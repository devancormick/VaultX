export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();

    // Cancel Stripe subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "active",
        limit: 1,
      });
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // Delete storage files
    const { data: assets } = await serviceClient
      .from("assets")
      .select("storage_path")
      .eq("user_id", user.id);

    if (assets && assets.length > 0) {
      await serviceClient.storage
        .from("assets")
        .remove(assets.map((a) => a.storage_path));
    }

    // Delete Supabase user (cascades to profiles, subscriptions, etc.)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
