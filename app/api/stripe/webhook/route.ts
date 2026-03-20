export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Helper: safely get subscription period dates
function subPeriodStart(sub: Stripe.Subscription): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_start;
  return raw ? new Date(raw * 1000).toISOString() : new Date().toISOString();
}
function subPeriodEnd(sub: Stripe.Subscription): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_end;
  return raw ? new Date(raw * 1000).toISOString() : new Date().toISOString();
}
function invoiceSubId(invoice: Stripe.Invoice): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = (invoice as any).subscription ?? (invoice as any).subscription_details?.metadata?.subscription_id;
  return typeof sub === "string" ? sub : null;
}

async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const customerId = sub.customer as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  const planItem = sub.items.data[0];
  const priceId = planItem?.price?.id ?? null;

  let plan: "free" | "pro" | "enterprise" = "free";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) plan = "pro";
  else if (priceId === process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID) plan = "enterprise";

  const status = sub.status as "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "unpaid";

  await supabase.from("subscriptions").upsert({
    id: sub.id,
    user_id: profile.id,
    stripe_customer_id: customerId,
    status,
    plan,
    stripe_price_id: priceId,
    current_period_start: subPeriodStart(sub),
    current_period_end: subPeriodEnd(sub),
    cancel_at_period_end: sub.cancel_at_period_end,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canceled_at: (sub as any).canceled_at ? new Date((sub as any).canceled_at * 1000).toISOString() : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trial_end: (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("audit_log").insert({
    user_id: profile.id,
    event_type: "subscription.changed",
    event_data: { subscriptionId: sub.id, status, plan },
    status: "success",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub, supabase);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.customer) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", session.customer as string)
            .single();
          if (profile) {
            await handleSubscriptionUpsert(sub, supabase);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubId(invoice);
        if (subId) {
          await supabase
            .from("subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("id", subId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubId(invoice);
        if (subId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("id", subId);
        }
        break;
      }

      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        if (customer.email) {
          await supabase
            .from("profiles")
            .update({ email: customer.email })
            .eq("stripe_customer_id", customer.id);
        }
        break;
      }

      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_customer_id", customer.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
