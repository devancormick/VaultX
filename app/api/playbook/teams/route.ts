export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter } from "@/lib/redis/ratelimit";
import { createTeamSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: teams, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        invite_code,
        created_at,
        updated_at,
        team_memberships (
          id,
          player_id,
          position,
          jersey_number,
          profiles (
            full_name,
            email
          )
        )
      `)
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting (skip if Redis unavailable)
    try {
      const rateLimiter = createRateLimiter(10, "1 m"); // 10 requests per minute
      const { success } = await rateLimiter.limit(user.id);
      if (!success) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
    } catch (rateLimitError) {
      // Log but don't fail if Redis is unavailable
      console.warn("Rate limiting unavailable:", rateLimitError);
    }

    const body = await request.json();
    const { name } = createTeamSchema.parse(body);

    // Resolve plan — default to "free" if no active subscription row exists
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1);

    const planName = subscriptions?.[0]?.plan ?? "free";

    // Get plan limits
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("max_teams")
      .eq("plan", planName)
      .single();

    const maxTeams = planLimits?.max_teams ?? 1;

    // Check team count
    const { count } = await supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id);

    if (count !== null && count >= maxTeams) {
      return NextResponse.json(
        { error: `Team limit reached (${maxTeams} max for ${planName} plan)` },
        { status: 403 }
      );
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name,
        coach_id: user.id,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}