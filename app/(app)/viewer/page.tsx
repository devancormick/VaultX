import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VaultXViewer } from "@/components/viewer/vaultx-viewer";
import type { Profile, Subscription } from "@/lib/supabase/types";

export default async function ViewerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Try to load the user's most recent play as coach
  let cards: Array<{ id: string; cardType: string; geometry: Record<string, unknown> }> | undefined;
  let assignments: Array<{ card_id: string; recorded_path: Array<{ x: number; y: number }> }> | undefined;

  // Check if user is a coach with teams
  const { data: coachTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("coach_id", user.id)
    .limit(1);

  if (coachTeams && coachTeams.length > 0) {
    // Get most recently updated play across all their teams
    const { data: recentPlay } = await supabase
      .from("plays")
      .select("id, playbooks!inner(team_id, teams!inner(coach_id))")
      .eq("playbooks.teams.coach_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (recentPlay) {
      const { data: cardRows } = await supabase
        .from("cards")
        .select("id, card_type, geometry")
        .eq("play_id", recentPlay.id);

      if (cardRows && cardRows.length > 0) {
        cards = cardRows.map(c => ({
          id: c.id,
          cardType: c.card_type,
          geometry: (c.geometry ?? {}) as Record<string, unknown>,
        }));

        const cardIds = cardRows.map(c => c.id);
        const { data: assignmentRows } = await supabase
          .from("assignments")
          .select("card_id, recorded_path")
          .in("card_id", cardIds);

        if (assignmentRows) {
          assignments = assignmentRows.map(a => ({
            card_id: a.card_id,
            recorded_path: (a.recorded_path as Array<{ x: number; y: number }>) ?? [],
          }));
        }
      }
    }
  } else {
    // Check if user is a player on a team
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("player_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (membership) {
      const { data: recentPlay } = await supabase
        .from("plays")
        .select("id, playbooks!inner(team_id)")
        .eq("playbooks.team_id", membership.team_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (recentPlay) {
        const { data: cardRows } = await supabase
          .from("cards")
          .select("id, card_type, geometry")
          .eq("play_id", recentPlay.id);

        if (cardRows && cardRows.length > 0) {
          cards = cardRows.map(c => ({
            id: c.id,
            cardType: c.card_type,
            geometry: (c.geometry ?? {}) as Record<string, unknown>,
          }));

          const cardIds = cardRows.map(c => c.id);
          const { data: assignmentRows } = await supabase
            .from("assignments")
            .select("card_id, recorded_path")
            .in("card_id", cardIds);

          if (assignmentRows) {
            assignments = assignmentRows.map(a => ({
              card_id: a.card_id,
              recorded_path: (a.recorded_path as Array<{ x: number; y: number }>) ?? [],
            }));
          }
        }
      }
    }
  }

  // Falls back to demo data inside FootballFieldScene when cards is undefined
  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 h-[calc(100vh-56px)] relative">
      <VaultXViewer
        profile={profile as Profile}
        subscription={subscription as Subscription}
        cards={cards}
        assignments={assignments}
      />
    </div>
  );
}

