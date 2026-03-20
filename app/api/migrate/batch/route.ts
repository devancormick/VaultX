export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { migrationBatchSchema } from "@/lib/validation/schemas";
import { stripe } from "@/lib/stripe/client";
import { sendEmail } from "@/lib/email/send";
import MigrationInviteEmail from "@/components/emails/migration-invite";
import React from "react";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
    }

    // Admin only
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required", code: "forbidden" }, { status: 403 });
    }

    const body = await request.json() as unknown;
    const parsed = migrationBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid migration data", code: "validation_error", details: parsed.error.issues }, { status: 400 });
    }

    const { users } = parsed.data;
    const serviceClient = createServiceRoleClient();

    // Create batch record
    const { data: batch, error: batchError } = await serviceClient
      .from("migration_batches")
      .insert({
        initiated_by: user.id,
        total_users: users.length,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: "Failed to create batch", code: "db_error" }, { status: 500 });
    }

    // Process in background (non-blocking response)
    processMigrationBatch(batch.id, users, serviceClient).catch(console.error);

    return NextResponse.json({ batchId: batch.id, total: users.length }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "server_error" }, { status: 500 });
  }
}

async function processMigrationBatch(
  batchId: string,
  users: Array<{ memberstackId: string; email: string; stripeCustomerId: string; plan: string }>,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  let succeeded = 0;
  let failed = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  for (const u of users) {
    try {
      // Check if user already exists (idempotent)
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const exists = existingUser.users.find((x) => x.email === u.email);

      if (exists) {
        await supabase.from("migration_users").insert({
          batch_id: batchId,
          memberstack_id: u.memberstackId,
          email: u.email,
          stripe_customer_id: u.stripeCustomerId,
          supabase_user_id: exists.id,
          status: "skipped",
          migrated_at: new Date().toISOString(),
        });
        succeeded++;
        continue;
      }

      // Create Supabase user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        email_confirm: true,
      });

      if (createError || !newUser.user) throw new Error(createError?.message ?? "Failed to create user");

      // Update profile
      await supabase.from("profiles").upsert({
        id: newUser.user.id,
        email: u.email,
        stripe_customer_id: u.stripeCustomerId,
        memberstack_id: u.memberstackId,
        email_verified: true,
      });

      // Fetch Stripe subscription
      const stripeSubs = await stripe.subscriptions.list({
        customer: u.stripeCustomerId,
        limit: 1,
        status: "active",
      });

      if (stripeSubs.data.length > 0) {
        const sub = stripeSubs.data[0];
        const priceId = sub.items.data[0]?.price?.id ?? null;
        let plan: "free" | "pro" | "enterprise" = "free";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) plan = "pro";
        else if (priceId === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID) plan = "enterprise";

        await supabase.from("subscriptions").upsert({
          id: sub.id,
          user_id: newUser.user.id,
          stripe_customer_id: u.stripeCustomerId,
          status: "active",
          plan,
          stripe_price_id: priceId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current_period_start: (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000).toISOString() : null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
        });
      }

      // Generate password-set link
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: u.email,
      });

      const setPasswordUrl = linkData?.properties?.action_link ?? `${appUrl}/login`;

      // Send migration invite email
      await sendEmail({
        to: u.email,
        subject: "Your account has been migrated to VaultX",
        react: React.createElement(MigrationInviteEmail, {
          email: u.email,
          setPasswordUrl,
          plan: u.plan,
        }),
      });

      await supabase.from("migration_users").insert({
        batch_id: batchId,
        memberstack_id: u.memberstackId,
        email: u.email,
        stripe_customer_id: u.stripeCustomerId,
        supabase_user_id: newUser.user.id,
        status: "complete",
        migrated_at: new Date().toISOString(),
      });

      succeeded++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase.from("migration_users").insert({
        batch_id: batchId,
        memberstack_id: u.memberstackId,
        email: u.email,
        stripe_customer_id: u.stripeCustomerId,
        status: "failed",
        error_message: message,
      });
    }
  }

  await supabase.from("migration_batches").update({
    status: failed === users.length ? "failed" : "complete",
    succeeded,
    failed,
    completed_at: new Date().toISOString(),
  }).eq("id", batchId);
}
