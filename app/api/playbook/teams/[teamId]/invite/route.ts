export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, position, jersey_number } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  // Verify caller is team coach
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, name, invite_code")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (teamErr || !team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();

  const { error } = await supabase.from("team_invitations").insert({
    team_id: teamId,
    email,
    token,
    position: position ?? null,
    jersey_number: jersey_number ?? null,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("team_invitations insert error:", error);
    const isTableMissing = error.code === "42P01";
    return NextResponse.json(
      { error: isTableMissing ? "Database migration pending — run `supabase db push`" : error.message },
      { status: 500 },
    );
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${token}`;
  return NextResponse.json({ success: true, inviteUrl }, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invitations, error } = await supabase
    .from("team_invitations")
    .select("id, email, position, jersey_number, token, expires_at, accepted_at, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  return NextResponse.json({ invitations });
}
