export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/redis/ratelimit";
import { signedUrlQuerySchema } from "@/lib/validation/schemas";
import type { Plan } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
    }

    // Validate query params
    const query = signedUrlQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!query.success) {
      return NextResponse.json({ error: "Invalid request", code: "validation_error" }, { status: 400 });
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

    // Get plan limits
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("signed_url_expiry, rate_limit_per_min")
      .eq("plan", subscription.plan as Plan)
      .single();

    const rateLimitPerMin = planLimits?.rate_limit_per_min ?? 10;
    const expiry = planLimits?.signed_url_expiry ?? 300;

    // Rate limit check
    const limiter = createRateLimiter(rateLimitPerMin);
    const { success, reset } = await limiter.limit(`signed-url:${user.id}`);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Rate limit exceeded", code: "rate_limit_exceeded", retryAfter },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    // Generate signed URL using service role
    const serviceClient = createServiceRoleClient();
    const { data: signedData, error: signedError } = await serviceClient.storage
      .from("assets")
      .createSignedUrl(query.data.asset, expiry);

    if (signedError || !signedData) {
      return NextResponse.json(
        { error: "Failed to generate signed URL", code: "storage_error" },
        { status: 500 }
      );
    }

    // Write audit log
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await supabase.from("audit_log").insert({
      user_id: user.id,
      event_type: "asset.signed_url",
      event_data: { path: query.data.asset, expiresAt: new Date(Date.now() + expiry * 1000).toISOString() },
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      status: "success",
    });

    // Increment access count
    await supabase
      .from("assets")
      .update({ access_count: supabase.rpc("increment", { x: 1 }) })
      .eq("storage_path", query.data.asset)
      .eq("user_id", user.id);

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      expiresAt: new Date(Date.now() + expiry * 1000).toISOString(),
      assetPath: query.data.asset,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "server_error" }, { status: 500 });
  }
}
