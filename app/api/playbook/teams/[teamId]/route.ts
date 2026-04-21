export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      id, name, invite_code, created_at,
      team_memberships (
        id, player_id, position, jersey_number, status,
        profiles!inner (full_name, email, avatar_url)
      )
    `)
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (error || !team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json({ team });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("teams")
    .update({ name: body.name })
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  return NextResponse.json({ team: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("coach_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  return NextResponse.json({ success: true });
}
