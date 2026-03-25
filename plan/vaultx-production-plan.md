# VaultX — Production SaaS Platform
### Full Product Architecture, Brand Guide & Claude Code Prompt
*Built by Devan McCormick*

---

## 1. PRODUCT VISION

**Name:** VaultX  
**Tagline:** "Secure access. Protected assets. Zero compromise."  
**What it is:** A production-grade, multi-tenant SaaS platform that delivers gated browser-based 3D experiences with enterprise-level backend security, real Stripe billing, and a complete user management system. This is a shippable product, not a demo.

**The product solves a real market problem:** Studios, agencies, and SaaS founders who build powerful browser-based tools (3D configurators, interactive viewers, data tools) need a proven, secure delivery layer — auth, billing, asset protection, and access control — without rebuilding it from scratch every time.

**Business model:** VaultX is the platform layer itself. Customers embed their 3D tool and connect their Stripe account. VaultX handles everything else.

---

## 2. BRAND GUIDE

### 2.1 Name & Logo
- **Product Name:** VaultX
- **Logo mark:** A geometric hexagonal vault door with a precision lock dial at center. Hard edges, no softness. SVG-native so it renders crisply at any size — favicon to billboard.
- **Logo type:** "Vault" in Sora ExtraBold + "X" in Electric Cyan (`#00D4FF`). The X is the accent, not decoration — it implies access, intersection, unlock.
- **Favicon:** Minimal hex outline with a small X in the center. Works at 16px.

### 2.2 Color System
| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-bg` | Obsidian | `#0A0C10` | Page background |
| `--color-surface` | Deep Slate | `#111318` | Section backgrounds |
| `--color-card` | Graphite | `#1A1D24` | Cards, panels, modals |
| `--color-border` | Steel | `#2D3340` | All borders, dividers |
| `--color-accent` | Electric Cyan | `#00D4FF` | Primary CTAs, links, glow |
| `--color-accent-dim` | Cyan 20% | `#00D4FF33` | Hover states, backgrounds |
| `--color-violet` | Violet | `#7C3AED` | Secondary actions, badges |
| `--color-success` | Mint | `#10B981` | Active status, success states |
| `--color-warning` | Amber | `#F59E0B` | Past due, expiry warnings |
| `--color-danger` | Crimson | `#EF4444` | Errors, blocked access, cancel |
| `--color-text` | Snow | `#F8FAFC` | Primary text |
| `--color-muted` | Mist | `#94A3B8` | Secondary text, placeholders |

### 2.3 Typography
- **Display / H1–H2:** `Sora` ExtraBold — geometric, sharp, unmistakably intentional
- **UI / Body / H3–H6:** `DM Sans` Regular + Medium — readable, clean, neutral
- **Code / Tokens / Keys:** `JetBrains Mono` — monospaced for all technical strings
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px — strict type scale, no arbitrary sizes

### 2.4 Component Design Language
- **Backgrounds:** Obsidian base with subtle radial gradient noise texture — never flat black
- **Cards:** `background: #1A1D24`, `border: 1px solid #2D3340`, `border-radius: 12px`, `backdrop-filter: blur(12px)` where layered
- **Glow effects:** `box-shadow: 0 0 24px #00D4FF22` on active/focused interactive elements
- **Buttons — Primary:** Solid cyan background, obsidian text, hover lifts with glow shadow
- **Buttons — Secondary:** Transparent with steel border, cyan text, hover fills dimly
- **Buttons — Danger:** Solid crimson, used only for destructive actions
- **Status badges:** Pill-shaped, color-coded — Mint/active, Amber/past_due, Crimson/canceled, Steel/free
- **Inputs:** Steel border, graphite background, cyan focus ring (`outline: 2px solid #00D4FF`)
- **Animations:** 200ms ease transitions on all interactive states. Page transitions: 300ms fade + 8px upward slide. Loading states: pulsing cyan skeleton loaders.
- **Icons:** Lucide icons throughout — consistent stroke weight, never filled

---

## 3. FULL PRODUCTION ARCHITECTURE

### Tech Stack
| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components, middleware, edge functions |
| Auth | Supabase Auth | Session cookies, SSR support, RLS integration |
| Database | Supabase Postgres | RLS policies, real-time subscriptions |
| Storage | Supabase Storage | Private buckets, signed URL API |
| Payments | Stripe Billing | Subscriptions, webhooks, customer portal |
| 3D Viewer | Three.js + React Three Fiber | Production-grade 3D, tree-shakeable |
| Email | Resend + React Email | Transactional emails with real templates |
| Rate Limiting | Upstash Redis | Per-user rate limits on API routes |
| Error Tracking | Sentry | Production error monitoring |
| Analytics | PostHog | Product analytics, feature flags |
| Deployment | Vercel | Edge middleware, preview deployments |
| CI/CD | GitHub Actions | Lint, type-check, test on every PR |

### Security Architecture — Non-Negotiables
Every single one of these must be implemented as production code, not mocked:

1. **Supabase middleware on every protected route** — `createMiddlewareClient` reads session from HttpOnly cookie. Zero client-side trust.
2. **Row Level Security on all tables** — users can only SELECT their own rows. Service role key only used server-side.
3. **Stripe webhook signature verification** — every webhook request validated with `stripe.webhooks.constructEvent` before processing.
4. **Private Supabase Storage buckets** — no public bucket policies. All assets require signed URL.
5. **Signed URL expiry of 300 seconds** — short enough to prevent sharing, long enough for real use. Generated per-request after subscription check.
6. **CSRF protection** — Next.js built-in + Supabase session cookie SameSite=Strict.
7. **Rate limiting on all API routes** — Upstash Redis sliding window. Signed URL endpoint: 30 req/min per user. Auth endpoints: 10 req/min per IP.
8. **Environment variable validation at startup** — `zod` schema validates all env vars at build time. Missing vars crash the build, not runtime.
9. **Content Security Policy headers** — strict CSP via next.config.js headers. No inline scripts.
10. **Audit log for every access event** — every viewer load, every asset request, every auth event written to `audit_log` table.

---

## 4. COMPLETE PAGE ARCHITECTURE

### Public Routes

#### `/` — Marketing Landing Page
- Animated hero: VaultX logo + tagline with a looping Three.js background (floating vault geometry, not interactive)
- Problem/solution narrative: "Your 3D tool is powerful. Your current security is not."
- Three feature pillars with animated icons: Backend Auth / Protected Assets / Stripe Billing
- Architecture diagram (SVG): shows the security flow visually — user → middleware → subscription check → signed URL → asset
- Social proof section: "Built on the same patterns used by..." (generic but credible)
- Pricing table (3 tiers, real Stripe checkout links)
- Footer: links, legal, status page

#### `/pricing` — Standalone Pricing Page
- Full feature comparison table across Free / Pro / Enterprise
- FAQ accordion
- "Talk to sales" CTA for Enterprise

#### `/login` — Sign In
- Email + password via Supabase
- Google OAuth (production-ready, not mocked)
- "Forgot password" → triggers Supabase password reset email via Resend
- Error states for invalid credentials, unverified email, locked account

#### `/signup` — Registration
- Email + password + full name
- Email verification required before dashboard access
- On verify → create Stripe customer via API
- Redirect to `/onboarding`

#### `/verify-email` — Email Verification Gate
- Shown after signup if email not yet verified
- Resend verification email button (rate limited)

### Onboarding Flow

#### `/onboarding` — Plan Selection
- Three plan cards with feature lists
- Free tier: access immediately, no payment
- Pro/Enterprise: redirect to Stripe Checkout
- Progress indicator: 1 of 2

#### `/onboarding/success` — Post-Payment
- Stripe Checkout success redirect
- Confirms subscription activated (polls webhook status)
- Redirect to dashboard after 3 seconds
- Progress indicator: 2 of 2

### App Routes (all protected by middleware)

#### `/dashboard` — Main Dashboard
Real production dashboard, not a demo panel. Sections:

**Overview cards:**
- Current plan badge + renewal date
- Assets accessed this billing period (count)
- Active sessions count
- Quick links to Viewer and Assets

**Subscription management:**
- Current plan details
- "Manage billing" → Stripe Customer Portal (real Stripe hosted portal)
- Upgrade/downgrade plan options
- Cancel subscription flow with confirmation modal

**Recent activity feed:**
- Last 10 audit log entries — viewer loads, asset requests, auth events
- Timestamp, event type, IP address (masked last octet), status

**Account settings panel:**
- Update email (triggers re-verification)
- Update password
- Delete account (with 30-day grace period, wipes data)

#### `/viewer` — Protected 3D Experience
Full production Three.js viewer:

**Access control:**
- Middleware validates session before page renders
- Server component checks subscription status from DB (not client)
- No active subscription → subscription wall with upgrade CTA (not a redirect, an in-page gate)
- Active subscription → full viewer loads

**Three.js scene (production quality):**
- PBR-lit 3D geometric object (geodesic vault form) with physically accurate materials
- Realistic environment map lighting (HDR)
- Smooth orbit controls with inertia — mouse and touch
- Post-processing: bloom on glowing edges, subtle film grain
- Responsive — fills viewport, recalculates on resize
- Loading state: skeleton + progress bar while assets stream
- Performance: dynamic quality scaling based on device GPU tier (via `detect-gpu`)

**Session indicator (subtle, not a demo panel):**
- Small avatar + email in top-right corner
- Plan badge
- No exposed tokens or internals — this is a real product

#### `/assets` — Asset Library
Production asset management UI:

**Asset grid:**
- Masonry grid of asset cards — thumbnail preview (rendered from GLB), file name, file size, format badge
- Filter by type (Model, Texture, HDR)
- Search by name
- Sort by date, size, name

**Per-asset actions:**
- "Load in Viewer" → opens viewer with that asset preloaded
- "Copy secure link" → calls `/api/assets/signed-url`, copies to clipboard, shows toast with 5-minute expiry warning
- Asset detail drawer: metadata, upload date, access count from audit log

**Upload (Pro/Enterprise only):**
- Drag-and-drop upload zone
- Client validates file type and size before upload
- Server validates again before writing to Supabase Storage private bucket
- Progress indicator, cancel support

#### `/settings` — Account Settings
- Profile: name, email, avatar upload
- Security: change password, active sessions list with "revoke" per session
- Billing: embedded Stripe Customer Portal iframe (or redirect, based on Stripe plan)
- Notifications: email preference toggles (stored in profiles table)
- Danger zone: delete account, export data (GDPR)

#### `/admin` — Admin Panel (service role only)
Protected by both middleware + a separate `is_admin` check in profiles table:

- User table: search, filter by plan, subscription status
- Per-user: view audit log, manually override subscription status, impersonate user (logs the action)
- Migration dashboard: run/monitor Memberstack → Supabase migration batches
- System health: recent webhook events, failed webhooks, storage usage

### API Routes

#### Auth
- `GET /api/auth/session` — returns current server-validated session or 401
- `POST /api/auth/logout` — destroys session cookie server-side

#### Assets
- `GET /api/assets/signed-url?asset=[path]`
  1. Validate session (server cookie)
  2. Check subscription status = 'active' in DB
  3. Check rate limit (Upstash Redis, 30/min per user)
  4. Call `supabase.storage.from('assets').createSignedUrl(path, 300)`
  5. Write to `audit_log`
  6. Return `{ signedUrl, expiresAt, assetPath }`

- `POST /api/assets/upload` — Pro/Enterprise only. Validates file type (GLTF/GLB/HDR/PNG/JPG), size limit per plan, writes to private bucket.

- `DELETE /api/assets/[id]` — owner only, validates via RLS.

#### Stripe
- `POST /api/stripe/webhook`
  Handles: `customer.subscription.created/updated/deleted`, `invoice.payment_failed/succeeded`, `customer.created`, `checkout.session.completed`
  Each event: verify signature → upsert to `subscriptions` table → write to `audit_log`

- `POST /api/stripe/create-checkout` — creates Stripe Checkout session for plan upgrade
- `POST /api/stripe/create-portal` — creates Stripe Customer Portal session

#### Migration
- `POST /api/migrate/batch` — Admin only. Accepts CSV or JSON of Memberstack users. Processes in batches of 50. Creates Supabase users, links Stripe customer IDs, sends password reset emails via Resend. Returns job ID.
- `GET /api/migrate/status/[jobId]` — polls migration job progress
- `POST /api/migrate/rollback/[jobId]` — rolls back a failed batch

#### Viewer
- `GET /api/viewer/token` — validates session + subscription, returns short-lived viewer access token (used to load Three.js assets without exposing signed URLs in source)

---

## 5. COMPLETE DATABASE SCHEMA

```sql
-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  email               text not null,
  full_name           text,
  avatar_url          text,
  stripe_customer_id  text unique,
  memberstack_id      text,        -- populated during migration
  is_admin            boolean default false,
  email_verified      boolean default false,
  notification_prefs  jsonb default '{"billing": true, "access": true, "product": false}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- ============================================================
-- SUBSCRIPTIONS (source of truth — synced from Stripe webhooks)
-- ============================================================
create table subscriptions (
  id                    text primary key,  -- Stripe subscription ID
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
  on subscriptions for select using (
    auth.uid() = user_id
  );

-- ============================================================
-- ASSETS (metadata — actual files in private Supabase Storage bucket)
-- ============================================================
create table assets (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  storage_path text not null,        -- path inside private bucket
  file_name    text not null,
  file_size    bigint,               -- bytes
  file_type    text,                 -- glb, gltf, hdr, png, jpg
  thumbnail_url text,                -- generated on upload, stored in public bucket
  access_count integer default 0,
  created_at   timestamptz default now()
);

alter table assets enable row level security;
create policy "Users manage own assets"
  on assets for all using (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOG (immutable — append only, no updates/deletes)
-- ============================================================
create table audit_log (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete set null,
  event_type   text not null,        -- viewer.load, asset.signed_url, auth.login, auth.logout, subscription.changed, migration.batch
  event_data   jsonb,                -- event-specific payload
  ip_address   inet,
  user_agent   text,
  status       text,                 -- success, blocked, error
  created_at   timestamptz default now()
);

alter table audit_log enable row level security;
create policy "Users read own audit log"
  on audit_log for select using (auth.uid() = user_id);
-- No update or delete policies — audit log is append-only

-- ============================================================
-- SESSIONS (active viewer sessions — for revocation)
-- ============================================================
create table viewer_sessions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  token_hash   text not null,        -- hashed viewer token (never store raw)
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
-- MIGRATION LOG
-- ============================================================
create table migration_batches (
  id                uuid default gen_random_uuid() primary key,
  initiated_by      uuid references profiles(id),   -- admin user
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
-- PLAN LIMITS (reference table — what each plan allows)
-- ============================================================
create table plan_limits (
  plan              text primary key,
  max_assets        integer,         -- max files storable
  max_asset_size_mb integer,         -- max single file size
  signed_url_expiry integer,         -- seconds
  rate_limit_per_min integer,        -- signed URL requests per minute
  viewer_sessions   integer          -- concurrent viewer sessions allowed
);

insert into plan_limits values
  ('free',       5,    25,   60,   10,  1),
  ('pro',        100,  100,  300,  30,  5),
  ('enterprise', 9999, 500,  3600, 100, 50);
```

---

## 6. STRIPE EVENTS — FULL HANDLER MATRIX

| Event | Action |
|---|---|
| `checkout.session.completed` | Create subscription row, set status = active/trialing |
| `customer.subscription.created` | Upsert subscription, write audit log |
| `customer.subscription.updated` | Update status, plan, period dates, cancel_at_period_end |
| `customer.subscription.deleted` | Set status = canceled, block asset access immediately |
| `invoice.payment_succeeded` | Set status = active if was past_due, write audit log |
| `invoice.payment_failed` | Set status = past_due, trigger dunning email via Resend |
| `invoice.payment_action_required` | Email user to complete 3DS auth |
| `customer.updated` | Sync email changes back to profiles table |
| `customer.deleted` | Cascade delete subscription, mark profile for deletion |

---

## 7. EMAIL TEMPLATES (Resend + React Email)

| Template | Trigger | Content |
|---|---|---|
| `welcome.tsx` | Signup | Welcome + verify email CTA |
| `verify-email.tsx` | Signup / resend | Magic link to verify |
| `subscription-active.tsx` | Payment succeeded | Plan confirmation, dashboard link |
| `payment-failed.tsx` | Invoice failed | Update billing CTA, grace period info |
| `subscription-canceled.tsx` | Sub deleted | Cancellation confirmed, reactivate link |
| `password-reset.tsx` | Forgot password | Reset link (15 min expiry) |
| `migration-invite.tsx` | Migration batch | "Your account has been migrated" + set password link |
| `access-revoked.tsx` | Admin action | "Your access has been suspended" |

---

## 8. MIGRATION SYSTEM (production grade)

### Phase 1 — Preparation (no user impact)
1. Export Memberstack user CSV: `{ memberstackId, email, stripeCustomerId, planName, createdAt }`
2. Validate every row: check Stripe customer exists, email is valid
3. Create migration batch record, status = pending

### Phase 2 — Parallel Run (both systems active)
1. Process batch of 50 users:
   - Create Supabase user via admin API (no password — triggers invite email)
   - Write `memberstack_id` and `stripe_customer_id` to profiles
   - Fetch subscription from Stripe, write to subscriptions table
   - Send `migration-invite.tsx` email with password-set link
   - Log result to `migration_users` table
2. New signups go through new system automatically
3. Old Memberstack users continue to work — parallel access during transition

### Phase 3 — Cutover
1. After all users migrated and password-set emails acted on (7-day window):
   - Disable Memberstack access
   - Switch Stripe webhook endpoint to new system
   - Monitor `audit_log` for any access errors
2. Rollback available: restore Memberstack if error rate > 2%

### Phase 4 — Cleanup
- Remove `memberstack_id` column after 90-day hold
- Archive migration tables
- Cancel Memberstack subscription

---

## 9. CLAUDE CODE PROMPT

> Open Claude Code in your terminal in a new empty directory. Paste this entire prompt. Claude Code will scaffold, implement, and wire the full application.

---

```
Build a production-grade multi-tenant SaaS platform called VaultX. This is NOT a demo 
or proof-of-concept — every feature must be implemented with production-quality code, 
real error handling, real security, and real UX polish. No placeholder data, no 
simulated API calls, no mock responses.

═══════════════════════════════════════
BRAND
═══════════════════════════════════════

Product name: VaultX
Tagline: "Secure access. Protected assets. Zero compromise."

Color tokens (define as CSS variables and Tailwind config):
  --color-bg:          #0A0C10   (page background)
  --color-surface:     #111318   (section backgrounds)
  --color-card:        #1A1D24   (cards, panels, modals)
  --color-border:      #2D3340   (borders, dividers)
  --color-accent:      #00D4FF   (primary CTA, links, focus rings, glow)
  --color-accent-dim:  #00D4FF22 (hover fill, subtle backgrounds)
  --color-violet:      #7C3AED   (secondary actions, badges)
  --color-success:     #10B981   (active status)
  --color-warning:     #F59E0B   (past due, expiry)
  --color-danger:      #EF4444   (error, cancel, blocked)
  --color-text:        #F8FAFC   (primary text)
  --color-muted:       #94A3B8   (secondary text)

Fonts (load from Google Fonts):
  Sora ExtraBold — headings and display text
  DM Sans Regular + Medium — body and UI
  JetBrains Mono — code, tokens, technical strings

Design language:
  - Dark obsidian backgrounds with subtle radial gradient noise texture
  - Glassmorphism cards: background #1A1D24, border 1px solid #2D3340, 
    border-radius 12px, backdrop-filter blur(12px) where layered
  - Cyan glow on active/focused elements: box-shadow 0 0 24px #00D4FF22
  - 200ms ease on all interactive transitions
  - Lucide icons throughout, consistent stroke weight

═══════════════════════════════════════
TECH STACK
═══════════════════════════════════════

- Next.js 14 App Router with TypeScript (strict mode)
- Supabase: auth (SSR with @supabase/ssr), postgres, storage
- Stripe: subscriptions, webhooks, customer portal
- Three.js + React Three Fiber + @react-three/drei
- Tailwind CSS with custom token config
- Resend + React Email for transactional emails
- Upstash Redis (@upstash/ratelimit) for rate limiting
- Sentry for error tracking
- Zod for all runtime validation and env var validation
- next-safe-action for type-safe server actions

═══════════════════════════════════════
PROJECT STRUCTURE
═══════════════════════════════════════

/app
  /(public)
    /page.tsx                    — Landing page
    /pricing/page.tsx            — Pricing page
    /login/page.tsx              — Sign in
    /signup/page.tsx             — Registration
    /verify-email/page.tsx       — Email verification gate
  /(onboarding)
    /onboarding/page.tsx         — Plan selection
    /onboarding/success/page.tsx — Post-payment confirmation
  /(app)                         — All routes protected by middleware
    /dashboard/page.tsx
    /viewer/page.tsx
    /assets/page.tsx
    /settings/page.tsx
    /admin/page.tsx              — Admin only (is_admin check)
  /api
    /auth/session/route.ts
    /auth/logout/route.ts
    /assets/signed-url/route.ts
    /assets/upload/route.ts
    /stripe/webhook/route.ts
    /stripe/create-checkout/route.ts
    /stripe/create-portal/route.ts
    /viewer/token/route.ts
    /migrate/batch/route.ts
    /migrate/status/[jobId]/route.ts

/components
  /ui         — Button, Card, Badge, Input, Modal, Toast, Skeleton, Avatar
  /layout     — Navbar, Sidebar, Footer
  /viewer     — VaultXViewer (Three.js scene component)
  /dashboard  — SubscriptionCard, ActivityFeed, AssetCountCard
  /assets     — AssetGrid, AssetCard, AssetUploader, SignedUrlPanel
  /migration  — MigrationDashboard, BatchProgress
  /emails     — All React Email templates

/lib
  /supabase   — client.ts, server.ts, middleware.ts, types.ts
  /stripe     — client.ts, webhooks.ts, plans.ts
  /redis      — ratelimit.ts
  /email      — send.ts
  /validation — schemas for all API inputs
  /utils      — cn(), formatDate(), formatBytes(), maskString()

/middleware.ts — route protection
/env.ts       — Zod env validation (crash build on missing vars)

═══════════════════════════════════════
MIDDLEWARE (middleware.ts)
═══════════════════════════════════════

Protect all routes under /(app):
1. Create Supabase SSR client from request cookies
2. Call supabase.auth.getUser() — server-side, never trust client
3. If no user → redirect to /login?redirect=[original path]
4. If user but unverified email → redirect to /verify-email
5. If /admin route → check profiles.is_admin = true, else redirect to /dashboard
6. Refresh session cookie if near expiry
7. Write access attempt to audit_log (non-blocking, fire-and-forget)

═══════════════════════════════════════
ENVIRONMENT VALIDATION (env.ts)
═══════════════════════════════════════

Use Zod to validate these at startup — throw if any missing:

Server-only:
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  RESEND_API_KEY
  SENTRY_DSN

Public (NEXT_PUBLIC_):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
  NEXT_PUBLIC_APP_URL

═══════════════════════════════════════
DATABASE
═══════════════════════════════════════

Create a /supabase/migrations/ folder with the full SQL migration:

Tables to create with full RLS policies:
  profiles, subscriptions, assets, audit_log, viewer_sessions,
  migration_batches, migration_users, plan_limits

Seed plan_limits with:
  free:       5 assets, 25MB max, 60s URL expiry, 10 req/min, 1 session
  pro:        100 assets, 100MB max, 300s expiry, 30 req/min, 5 sessions
  enterprise: unlimited assets, 500MB max, 3600s expiry, 100 req/min, 50 sessions

Create a Supabase Storage private bucket named 'assets'.
Create a Supabase Storage public bucket named 'thumbnails'.

═══════════════════════════════════════
API ROUTES — FULL IMPLEMENTATION
═══════════════════════════════════════

GET /api/assets/signed-url?asset=[storagePath]
  1. createServerClient from cookies
  2. getUser() → 401 if null
  3. Query subscriptions table: status = 'active' AND user_id = user.id
  4. If no active subscription → 403 { error: 'subscription_required' }
  5. Query plan_limits for user's plan → get signed_url_expiry and rate_limit_per_min
  6. Check Upstash rate limit: key = `signed-url:${user.id}`, limit = plan rate
  7. If rate limited → 429 { error: 'rate_limit_exceeded', retryAfter }
  8. supabase (service role) .storage.from('assets').createSignedUrl(path, expiry)
  9. Insert into audit_log: { user_id, event_type: 'asset.signed_url', event_data: { path, expiresAt }, status: 'success' }
  10. Return { signedUrl, expiresAt, assetPath }

POST /api/stripe/webhook
  1. Read raw body (important for signature verification)
  2. stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  3. If invalid signature → 400 immediately
  4. Switch on event.type — handle all 9 events listed in schema section
  5. Each handler: upsert subscriptions table + write audit_log
  6. Return 200 immediately after DB write — idempotent handlers

GET /api/viewer/token
  1. Validate session server-side
  2. Check active subscription
  3. Check plan_limits.viewer_sessions — count active viewer_sessions for user
  4. If at limit → 403 { error: 'session_limit_reached' }
  5. Generate cryptographically random token (crypto.randomBytes(32).toString('hex'))
  6. Hash token with SHA-256, store hash in viewer_sessions with 1hr expiry
  7. Return raw token (only time it's ever sent to client)

═══════════════════════════════════════
PAGES — FULL IMPLEMENTATION
═══════════════════════════════════════

LANDING PAGE (/)
  - Full-viewport hero: animated Three.js background (slowly rotating geometric 
    vault shape, no user interaction, performance-optimized with pixelRatio cap)
  - VaultX logo (SVG inline) + tagline + two CTAs: "Start Free" and "See Pricing"
  - Animated scroll-reveal sections using Intersection Observer
  - Architecture diagram as animated SVG: shows request flow with arrows lighting 
    up in sequence — Request → Middleware → Subscription Check → Signed URL → Asset
  - Pricing cards with real Stripe Checkout links
  - All sections fully responsive, mobile-first

DASHBOARD (/dashboard)
  Server component fetches:
    - profile from profiles table
    - subscription from subscriptions table
    - last 10 rows from audit_log
    - asset count from assets table

  Renders:
    - Subscription status card with plan badge, renewal date, "Manage Billing" button
      (links to /api/stripe/create-portal)
    - Stats row: assets stored, access events this month, active sessions
    - Recent activity feed: each row shows event icon, description, time ago, status badge
    - Quick actions: "Open Viewer", "Browse Assets", "Upload Asset" (if Pro+)
  
  NO demo panels, NO exposed tokens — this is a real product dashboard

VIEWER (/viewer)
  Server component:
    - Calls getUser() server-side
    - Queries subscriptions for active status
    - If no subscription: render <SubscriptionWall> component with upgrade CTA
    - If active: render <VaultXViewer> with a viewer token fetched server-side

  VaultXViewer (client component, Three.js):
    - Canvas fills full viewport minus sidebar
    - Scene: high-quality 3D vault object with PBR materials
      * Geometry: IcosahedronGeometry or custom vault/gem form
      * Material: MeshPhysicalMaterial with metalness, roughness, clearcoat
      * Environment: HDR environment map for realistic reflections
      * Edges: EdgesGeometry overlay with cyan color for the "wireframe" aesthetic
    - Lighting: three-point lighting setup (key, fill, rim) + ambient
    - Post-processing (@react-three/postprocessing):
      * Bloom effect on cyan edges
      * Subtle vignette
      * SMAA anti-aliasing
    - Controls: OrbitControls with damping enabled, zoom limits, auto-rotate off
    - Loading: full-viewport skeleton with progress bar while scene loads
    - Performance: use `detect-gpu` to set pixelRatio — high GPU: 2, mid: 1.5, low: 1
    - Responsive: resize handler updates camera aspect ratio

ASSETS (/assets)
  - Server component fetches assets from DB for current user
  - Renders AssetGrid with AssetCard per asset
  - AssetCard: thumbnail image (from public thumbnails bucket), file name, 
    size formatted, type badge, "Load in Viewer" button, "Copy secure link" button
  - "Copy secure link": client calls /api/assets/signed-url, writes to clipboard,
    shows toast: "Secure link copied — expires in 5 minutes"
  - Upload zone (Pro/Enterprise): react-dropzone, validates type/size client-side,
    then POSTs to /api/assets/upload, shows progress bar, updates grid on complete
  - Empty state: illustration + "Upload your first asset" CTA

SETTINGS (/settings)
  Tab navigation: Profile | Security | Billing | Notifications | Danger Zone

  Profile tab: update full_name, email (triggers re-verification if changed), 
    avatar upload (writes to thumbnails bucket)
  
  Security tab: change password form, active sessions table with "Revoke" button 
    per session (calls UPDATE viewer_sessions SET revoked = true)
  
  Billing tab: embedded Stripe Customer Portal session or redirect button
  
  Notifications tab: toggle switches for billing/access/product emails, 
    saves to profiles.notification_prefs jsonb column
  
  Danger Zone tab: "Delete Account" button → confirmation modal → 
    POST /api/auth/delete-account → cancels Stripe subscription, 
    deletes storage files, calls auth.admin.deleteUser

═══════════════════════════════════════
MIGRATION SYSTEM (/admin)
═══════════════════════════════════════

Admin dashboard section for running Memberstack → Supabase migrations:

  - CSV upload: drag CSV with columns { memberstackId, email, stripeCustomerId, plan }
  - Validate all rows before starting — show validation errors per row
  - "Start Migration" creates a migration_batches record and begins processing
  - Real-time progress: poll /api/migrate/status/[jobId] every 2s, 
    show progress bar, succeeded/failed counts, current user being processed
  - Per-user status table: email, memberstack ID, status badge, error message if failed
  - "Rollback" button if status = failed: deletes created Supabase users, 
    sets migration_users.status = rolled_back
  - "Export Results" button: download CSV of migration results

  Migration logic per user:
    1. Check if Supabase user already exists for email → skip if yes (idempotent)
    2. supabase.auth.admin.createUser({ email, email_confirm: true })
    3. Insert into profiles: { id, email, stripe_customer_id, memberstack_id }
    4. Fetch Stripe subscription for customer → insert into subscriptions
    5. Send migration-invite email via Resend with password-set link
    6. Update migration_users.status = complete

═══════════════════════════════════════
EMAIL TEMPLATES
═══════════════════════════════════════

Build all templates as React Email components in /components/emails/:
  welcome.tsx, verify-email.tsx, subscription-active.tsx, 
  payment-failed.tsx, subscription-canceled.tsx, password-reset.tsx,
  migration-invite.tsx, access-revoked.tsx

Each template:
  - Uses VaultX branding: obsidian background, cyan accents, Sora headings
  - Mobile-responsive using React Email's layout components
  - Clear single CTA button per email
  - Footer with unsubscribe link and legal address

═══════════════════════════════════════
ERROR HANDLING STANDARDS
═══════════════════════════════════════

- All API routes: try/catch, return typed error responses { error: string, code: string }
- All server components: use error.tsx boundaries per route segment
- Client components: React Error Boundary wrapping all async UI
- Stripe webhook: 200 on signature failure (per Stripe docs — never 4xx on webhook)
  Actually: 400 on signature failure, 200 on all valid events even if DB write fails 
  (log to Sentry instead)
- Supabase errors: map to user-friendly messages, never expose raw Postgres errors
- Rate limit hits: 429 with Retry-After header and human-readable message
- Sentry: capture all errors in API routes and middleware with user context attached

═══════════════════════════════════════
QUALITY STANDARDS — NON-NEGOTIABLE
═══════════════════════════════════════

- TypeScript strict mode — no `any`, no `@ts-ignore`
- All API inputs validated with Zod before processing
- All DB queries use parameterized inputs — never string interpolation
- No console.log in production code — use proper error logging
- All forms: loading states, error states, success states — no dead UI
- All buttons: disabled + spinner during async operations
- All images: next/image with proper width/height or fill
- Accessibility: all interactive elements keyboard navigable, ARIA labels on icons
- Performance: dynamic imports for Three.js and heavy components, 
  Suspense boundaries with skeleton loaders throughout
- Mobile: fully responsive, tested at 375px, 768px, 1280px, 1920px
- README.md: complete setup guide including Supabase project setup, 
  Stripe webhook configuration, env var documentation, deployment steps

═══════════════════════════════════════
DELIVERABLE
═══════════════════════════════════════

A complete Next.js repository that:
- Runs locally with `npm run dev` after setting env vars
- Passes `npm run build` with zero TypeScript errors
- Deploys to Vercel with zero configuration changes
- Contains a /supabase/migrations/ folder with the complete SQL to set up the DB
- Contains a README.md with the full setup guide
- Is indistinguishable in quality from a funded startup's production codebase
```

---

## 10. DEPLOYMENT CHECKLIST

After Claude Code builds the project, before sharing the URL:

- [ ] Supabase project created, migrations run, RLS verified
- [ ] Stripe webhook endpoint registered, all 9 events selected
- [ ] Private 'assets' bucket + public 'thumbnails' bucket created in Supabase Storage
- [ ] All env vars set in Vercel project settings
- [ ] At least one test user created, subscription activated via Stripe test mode
- [ ] Upload one GLB file to test signed URL flow end to end
- [ ] Verify direct asset URL returns 403 (not the file)
- [ ] Verify /viewer without session returns /login redirect
- [ ] Sentry DSN connected, trigger a test error to confirm
- [ ] Run Lighthouse — target 90+ performance, 100 accessibility

---

*Plan authored for Devan McCormick — github.com/devancormick*
