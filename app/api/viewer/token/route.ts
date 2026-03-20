export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
    }

    // Check active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription required", code: "subscription_required" },
        { status: 403 }
      );
    }

    // Get session limit for plan
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("viewer_sessions")
      .eq("plan", subscription.plan)
      .single();

    const sessionLimit = planLimits?.viewer_sessions ?? 1;

    // Count active (non-revoked, non-expired) viewer sessions
    const { count } = await supabase
      .from("viewer_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("revoked", false)
      .gt("expires_at", new Date().toISOString());

    if (count !== null && count >= sessionLimit) {
      return NextResponse.json(
        { error: `Session limit reached (${sessionLimit} concurrent for ${subscription.plan} plan)`, code: "session_limit_reached" },
        { status: 403 }
      );
    }

    // Generate token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    await supabase.from("viewer_sessions").insert({
      user_id: user.id,
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      expires_at: expiresAt.toISOString(),
    });

    await supabase.from("audit_log").insert({
      user_id: user.id,
      event_type: "viewer.load",
      event_data: { plan: subscription.plan },
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      status: "success",
    });

    return NextResponse.json({ token: rawToken, expiresAt: expiresAt.toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "server_error" }, { status: 500 });
  }
}
