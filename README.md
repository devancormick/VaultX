# VaultX

**Secure access. Protected assets. Zero compromise.**

VaultX is a production-grade, multi-tenant SaaS platform for gated browser-based 3D experiences. Enterprise-level backend security, real Stripe billing, and complete user management.

---

## Tech Stack

- **Framework**: Next.js 14 App Router + TypeScript (strict)
- **Auth & DB**: Supabase (SSR auth, Postgres, RLS, Storage)
- **Billing**: Stripe (subscriptions, webhooks, Customer Portal)
- **3D Viewer**: Three.js + React Three Fiber + @react-three/drei
- **Email**: Resend + React Email
- **Rate Limiting**: Upstash Redis
- **Validation**: Zod
- **Styling**: Tailwind CSS with custom brand tokens

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode is fine)
- An [Upstash](https://upstash.com) Redis database
- A [Resend](https://resend.com) account
- A [Sentry](https://sentry.io) project (optional for local dev)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd VaultX
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See the section below for how to get each one.

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
3. Run the database migrations:
   ```bash
   # Option A: Supabase CLI
   npx supabase db push

   # Option B: Supabase dashboard SQL editor
   # Copy and run supabase/migrations/001_initial_schema.sql
   # then supabase/migrations/002_storage_buckets.sql
   ```
4. Enable Google OAuth (optional) in **Authentication → Providers**
5. Set your site URL in **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Set up Stripe

1. Create a Stripe account and go to test mode
2. Copy your **Publishable key** and **Secret key**
3. Create two recurring products:
   - **Pro**: $49/month → copy the price ID to `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - **Enterprise**: $199/month → copy to `NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID`
4. Set up the webhook endpoint:
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
5. In production, register `https://yourdomain.com/api/stripe/webhook` in the Stripe dashboard with these events:
   - `checkout.session.completed`
   - `customer.subscription.created/updated/deleted`
   - `invoice.payment_succeeded/failed`
   - `customer.updated/deleted`

### 5. Set up Upstash Redis

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token to your `.env.local`

### 6. Set up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Copy your API key to `RESEND_API_KEY`
4. Update the `FROM` address in `lib/email/send.ts`

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
/app
  /(public)          Landing, pricing, login, signup, verify-email
  /(onboarding)      Plan selection, post-payment success
  /(app)             Protected: dashboard, viewer, assets, settings, admin
  /api               All API routes
  /auth/callback     OAuth callback handler

/components
  /ui                Button, Card, Badge, Input, Modal, Toast, Skeleton, Avatar
  /layout            Navbar, Footer
  /viewer            VaultX Three.js viewer + hero scene
  /assets            AssetGrid, AssetCard, AssetUploader
  /migration         AdminDashboard, MigrationSection
  /emails            All 8 React Email templates

/lib
  /supabase          client.ts, server.ts, types.ts
  /stripe            client.ts (PLANS config)
  /redis             ratelimit.ts
  /email             send.ts
  /validation        schemas.ts (all Zod schemas)
  /utils             cn, formatDate, formatBytes, maskString

/supabase/migrations
  001_initial_schema.sql
  002_storage_buckets.sql
```

---

## Security Architecture

Every request to a protected resource flows through:

1. **Middleware** — Supabase SSR session validation via HttpOnly cookie
2. **API route** — `getUser()` server-side (never trust client state)
3. **Subscription check** — DB query for `status = 'active'`
4. **Rate limit** — Upstash Redis sliding window per user
5. **Signed URL** — Service role key, 60–3600s expiry, private bucket only
6. **Audit log** — Every access event recorded immutably

Direct bucket access is blocked by storage RLS. Signed URLs are the only access path.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.example` (set `NEXT_PUBLIC_APP_URL` to your production domain)
4. Deploy
5. Register your production webhook URL in Stripe
6. Run migrations against your production Supabase project

---

## Deployment Checklist

- [ ] Supabase migrations run, RLS verified
- [ ] Stripe webhook registered with all 9 events
- [ ] `assets` (private) and `thumbnails` (public) buckets created
- [ ] All env vars set in Vercel
- [ ] Test user created, subscription activated in test mode
- [ ] Upload a GLB file and test the signed URL flow
- [ ] Verify direct asset URL returns 403
- [ ] Verify `/viewer` without session redirects to `/login`
- [ ] Sentry DSN connected and verified

---

Built by Devan McCormick
