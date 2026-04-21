-- ── Teams ─────────────────────────────────────────────────────────────────────
create table if not exists teams (
  id          uuid default gen_random_uuid() primary key,
  coach_id    uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  invite_code text not null unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table teams enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='teams' and policyname='coaches_own_teams') then
    create policy "coaches_own_teams" on teams
      using (coach_id = auth.uid())
      with check (coach_id = auth.uid());
  end if;
end $$;

-- ── Team memberships ──────────────────────────────────────────────────────────
create table if not exists team_memberships (
  id             uuid default gen_random_uuid() primary key,
  team_id        uuid references teams(id) on delete cascade not null,
  player_id      uuid references auth.users(id) on delete cascade not null,
  position       text,
  jersey_number  int,
  status         text not null default 'active' check (status in ('active','inactive','pending')),
  joined_at      timestamptz default now(),
  unique (team_id, player_id)
);

alter table team_memberships enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='team_memberships' and policyname='coach_manages_memberships') then
    create policy "coach_manages_memberships" on team_memberships
      using (team_id in (select id from teams where coach_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='team_memberships' and policyname='player_reads_own_membership') then
    create policy "player_reads_own_membership" on team_memberships
      for select using (player_id = auth.uid());
  end if;
end $$;

-- ── Team invitations ──────────────────────────────────────────────────────────
create table if not exists team_invitations (
  id             uuid default gen_random_uuid() primary key,
  team_id        uuid references teams(id) on delete cascade not null,
  email          text not null,
  token          text not null unique,
  position       text,
  jersey_number  int,
  expires_at     timestamptz not null,
  accepted_at    timestamptz,
  created_at     timestamptz default now()
);

alter table team_invitations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='team_invitations' and policyname='coach_manages_invitations') then
    create policy "coach_manages_invitations" on team_invitations
      using (team_id in (select id from teams where coach_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='team_invitations' and policyname='public_reads_invitation_by_token') then
    create policy "public_reads_invitation_by_token" on team_invitations
      for select using (true);
  end if;
end $$;

-- ── Playbooks ─────────────────────────────────────────────────────────────────
create table if not exists playbooks (
  id          uuid default gen_random_uuid() primary key,
  team_id     uuid references teams(id) on delete cascade not null,
  name        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table playbooks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='playbooks' and policyname='coach_manages_playbooks') then
    create policy "coach_manages_playbooks" on playbooks
      using (team_id in (select id from teams where coach_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='playbooks' and policyname='player_reads_playbooks') then
    create policy "player_reads_playbooks" on playbooks
      for select using (
        team_id in (select team_id from team_memberships where player_id = auth.uid() and status = 'active')
      );
  end if;
end $$;

-- ── Plays ─────────────────────────────────────────────────────────────────────
create table if not exists plays (
  id              uuid default gen_random_uuid() primary key,
  playbook_id     uuid references playbooks(id) on delete cascade not null,
  name            text not null,
  play_type       text default 'offense',
  thumbnail_url   text,
  canvas_width    int default 1200,
  canvas_height   int default 800,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table plays enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='plays' and policyname='coach_manages_plays') then
    create policy "coach_manages_plays" on plays
      using (
        playbook_id in (
          select pb.id from playbooks pb
          join teams t on t.id = pb.team_id
          where t.coach_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='plays' and policyname='player_reads_plays') then
    create policy "player_reads_plays" on plays
      for select using (
        playbook_id in (
          select pb.id from playbooks pb
          join team_memberships tm on tm.team_id = pb.team_id
          where tm.player_id = auth.uid() and tm.status = 'active'
        )
      );
  end if;
end $$;

-- ── Cards (canvas objects) ────────────────────────────────────────────────────
create table if not exists cards (
  id            uuid default gen_random_uuid() primary key,
  play_id       uuid references plays(id) on delete cascade not null,
  card_type     text not null,  -- draw, write, shape, arrow, player
  geometry      jsonb not null default '{}',
  quiz_answers  jsonb,
  z_index       int default 0,
  animation_start_ms int,
  animation_end_ms   int,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table cards enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='cards' and policyname='coach_manages_cards') then
    create policy "coach_manages_cards" on cards
      using (
        play_id in (
          select p.id from plays p
          join playbooks pb on pb.id = p.playbook_id
          join teams t on t.id = pb.team_id
          where t.coach_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='cards' and policyname='player_reads_cards') then
    create policy "player_reads_cards" on cards
      for select using (
        play_id in (
          select p.id from plays p
          join playbooks pb on pb.id = p.playbook_id
          join team_memberships tm on tm.team_id = pb.team_id
          where tm.player_id = auth.uid() and tm.status = 'active'
        )
      );
  end if;
end $$;

-- ── Assignments (coach-recorded player paths) ─────────────────────────────────
create table if not exists assignments (
  id              uuid default gen_random_uuid() primary key,
  card_id         uuid references cards(id) on delete cascade not null,
  play_id         uuid references plays(id) on delete cascade not null,
  recorded_path   jsonb not null default '[]',
  collision_events jsonb default '[]',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (card_id)
);

alter table assignments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='assignments' and policyname='coach_manages_assignments') then
    create policy "coach_manages_assignments" on assignments
      using (
        play_id in (
          select p.id from plays p
          join playbooks pb on pb.id = p.playbook_id
          join teams t on t.id = pb.team_id
          where t.coach_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where tablename='assignments' and policyname='player_reads_assignments') then
    create policy "player_reads_assignments" on assignments
      for select using (
        play_id in (
          select p.id from plays p
          join playbooks pb on pb.id = p.playbook_id
          join team_memberships tm on tm.team_id = pb.team_id
          where tm.player_id = auth.uid() and tm.status = 'active'
        )
      );
  end if;
end $$;

-- ── Drill sessions ────────────────────────────────────────────────────────────
create table if not exists drill_sessions (
  id            uuid default gen_random_uuid() primary key,
  player_id     uuid references auth.users(id) on delete cascade not null,
  play_id       uuid references plays(id) on delete cascade not null,
  current_phase int not null default 1,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

alter table drill_sessions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='drill_sessions' and policyname='player_owns_sessions') then
    create policy "player_owns_sessions" on drill_sessions
      using (player_id = auth.uid());
  end if;
end $$;

-- ── Drill results ─────────────────────────────────────────────────────────────
create table if not exists drill_results (
  id              uuid default gen_random_uuid() primary key,
  session_id      uuid references drill_sessions(id) on delete cascade not null,
  player_id       uuid references auth.users(id) on delete cascade not null,
  play_id         uuid references plays(id) on delete cascade not null,
  phase           int not null,
  score           float,
  frechet_score   float,
  drawn_path      jsonb,
  game_ready_time_ms int,
  answers         jsonb,
  created_at      timestamptz default now()
);

alter table drill_results enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='drill_results' and policyname='player_owns_results') then
    create policy "player_owns_results" on drill_results
      using (player_id = auth.uid());
  end if;
end $$;

-- ── Spaced repetition ─────────────────────────────────────────────────────────
create table if not exists spaced_repetition (
  id                uuid default gen_random_uuid() primary key,
  player_id         uuid references auth.users(id) on delete cascade not null,
  play_id           uuid references plays(id) on delete cascade not null,
  easiness_factor   float not null default 2.5,
  interval_days     int not null default 1,
  repetitions       int not null default 0,
  next_review_at    timestamptz not null default now(),
  updated_at        timestamptz default now(),
  unique (player_id, play_id)
);

alter table spaced_repetition enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='spaced_repetition' and policyname='player_owns_sr') then
    create policy "player_owns_sr" on spaced_repetition
      using (player_id = auth.uid());
  end if;
end $$;
