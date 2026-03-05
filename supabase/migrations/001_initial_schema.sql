-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  email               text not null,
  full_name           text,
  avatar_url          text,
  stripe_customer_id  text unique,
  memberstack_id      text,
  is_admin            boolean default false,
  email_verified      boolean default false,
  notification_prefs  jsonb default '{"billing": true, "access": true, "product": false}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, email_verified)
  values (new.id, new.email, coalesce(new.email_confirmed_at is not null, false));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

-- ============================================================
-- SUBSCRIPTIONS (source of truth — synced from Stripe webhooks)
-- ============================================================
create table subscriptions (
  id                    text primary key,
  user_id               uuid references profiles(id) on delete cascade not null,
  stripe_customer_id    text not null,
  status                text not null check (status in ('active','canceled','past_due','trialing','incomplete','unpaid')),
  plan                  text not null check (plan in ('free','pro','enterprise')),
  stripe_price_id       text,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean default false,
  canceled_at           timestamptz,
  trial_end             timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users read own subscription"
  on subscriptions for select using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure set_updated_at();

-- ============================================================
-- ASSETS
-- ============================================================
create table assets (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  storage_path text not null,
  file_name    text not null,
  file_size    bigint,
  file_type    text,
  thumbnail_url text,
  access_count integer default 0,
  created_at   timestamptz default now()
);

alter table assets enable row level security;

create policy "Users manage own assets"
  on assets for all using (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOG (append-only)
-- ============================================================
create table audit_log (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete set null,
  event_type   text not null,
  event_data   jsonb,
  ip_address   inet,
  user_agent   text,
  status       text,
  created_at   timestamptz default now()
);

alter table audit_log enable row level security;

create policy "Users read own audit log"
  on audit_log for select using (auth.uid() = user_id);

-- No update or delete policies — append-only

-- ============================================================
-- VIEWER SESSIONS
-- ============================================================
create table viewer_sessions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  token_hash   text not null,
  ip_address   inet,
  user_agent   text,
  expires_at   timestamptz not null,
  revoked      boolean default false,
  created_at   timestamptz default now()
);

alter table viewer_sessions enable row level security;

create policy "Users read own sessions"
  on viewer_sessions for select using (auth.uid() = user_id);

create policy "Users revoke own sessions"
  on viewer_sessions for update using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION TABLES
-- ============================================================
create table migration_batches (
  id                uuid default gen_random_uuid() primary key,
  initiated_by      uuid references profiles(id),
  total_users       integer,
  succeeded         integer default 0,
  failed            integer default 0,
  status            text default 'pending' check (status in ('pending','running','complete','failed','rolled_back')),
  error_log         jsonb,
  started_at        timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz default now()
);

create table migration_users (
  id                uuid default gen_random_uuid() primary key,
  batch_id          uuid references migration_batches(id) on delete cascade,
  memberstack_id    text,
  email             text,
  stripe_customer_id text,
  supabase_user_id  uuid,
  status            text default 'pending' check (status in ('pending','complete','failed','skipped')),
  error_message     text,
  migrated_at       timestamptz
);

-- ============================================================
-- PLAN LIMITS
-- ============================================================
create table plan_limits (
  plan              text primary key,
  max_assets        integer,
  max_asset_size_mb integer,
  signed_url_expiry integer,
  rate_limit_per_min integer,
  viewer_sessions   integer
);

insert into plan_limits values
  ('free',       5,    25,   60,   10,  1),
  ('pro',        100,  100,  300,  30,  5),
  ('enterprise', 9999, 500,  3600, 100, 50);
