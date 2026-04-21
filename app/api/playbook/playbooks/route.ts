export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, team_id } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!team_id) return NextResponse.json({ error: "team_id is required" }, { status: 400 });

  // Verify caller is coach of this team
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id")
    .eq("id", team_id)
    .eq("coach_id", user.id)
    .single();

  if (teamErr || !team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Resolve plan and check max_playbooks limit
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1);

  const planName = subscriptions?.[0]?.plan ?? "free";

  const { data: planLimits } = await supabase
    .from("plan_limits")
    .select("max_playbooks")
    .eq("plan", planName)
    .single();

  const maxPlaybooks = planLimits?.max_playbooks ?? 3;

  const { count } = await supabase
    .from("playbooks")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team_id);

  if (count !== null && count >= maxPlaybooks) {
    return NextResponse.json(
      { error: `Playbook limit reached (${maxPlaybooks} max for ${planName} plan)`, code: "limit_reached" },
      { status: 403 },
    );
  }

  const { data: playbook, error } = await supabase
    .from("playbooks")
    .insert({ name: name.trim(), team_id })
    .select()
    .single();

  if (error) {
    console.error("create playbook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ playbook }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = req.nextUrl.searchParams.get("team_id");

  let query = supabase
    .from("playbooks")
    .select("id, name, team_id, created_at, plays(id)")
    .order("created_at", { ascending: false });

  if (teamId) query = query.eq("team_id", teamId);

  const { data: playbooks, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playbooks });
}
