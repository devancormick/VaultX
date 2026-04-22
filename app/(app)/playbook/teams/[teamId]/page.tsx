import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Users, BookOpen, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyInviteCode } from "./copy-invite-code";
import { DeleteMemberButton } from "./delete-member-button";

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, invite_code, created_at")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (teamError || !team) notFound();

  const [{ data: rawMembers }, { data: rawPlaybooks }] = await Promise.all([
    supabase
      .from("team_memberships")
      .select("id, player_id, position, jersey_number, status, profiles!inner(full_name, email, avatar_url)")
      .eq("team_id", teamId),
    supabase
      .from("playbooks")
      .select("id, name, plays(id)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
  ]);

  const members = (rawMembers ?? []) as unknown as Array<{
    id: string;
    player_id: string;
    position: string | null;
    jersey_number: number | null;
    status: string;
    profiles: { full_name: string; email: string; avatar_url?: string } | null;
  }>;

  const playbooks = (rawPlaybooks ?? []) as Array<{
    id: string;
    name: string;
    plays: { id: string }[];
  }>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/playbook">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-1">
              <ArrowLeft className="w-4 h-4" />
              Playbook
            </Button>
          </Link>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">{team.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Users className="w-3.5 h-3.5" />
            {members.length} player{members.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Link href={`/playbook/teams/${teamId}/invite`}>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite Player
          </Button>
        </Link>
      </div>

      {/* Invite code */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted font-medium">Team Invite Code</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <div className="bg-surface border border-border rounded-lg px-4 py-2.5 flex-1">
              <p className="text-xs text-muted mb-0.5">Share this code with players to join the team</p>
              <CopyInviteCode code={team.invite_code} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster */}
      <div>
        <h2 className="font-display font-bold text-lg text-text mb-3">Roster</h2>
        {members.length > 0 ? (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {m.jersey_number ?? m.profiles?.full_name?.slice(0, 2).toUpperCase() ?? "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{m.profiles?.full_name ?? m.profiles?.email ?? "Unknown"}</p>
                  <p className="text-xs text-muted">{m.position ?? "No position"}{m.jersey_number ? ` · #${m.jersey_number}` : ""}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${m.status === "active" ? "text-success border-success/30 bg-success/10" : "text-muted border-border bg-surface"}`}>
                  {m.status}
                </span>
                <DeleteMemberButton teamId={teamId} memberId={m.id} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Users className="w-8 h-8 mx-auto text-muted/40 mb-3" />
              <p className="text-sm font-medium text-text">No players yet</p>
              <p className="text-xs text-muted mt-1 mb-4">Invite players using the button above or share the invite code.</p>
              <Link href={`/playbook/teams/${teamId}/invite`}>
                <Button size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite First Player
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Playbooks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-text">Playbooks</h2>
          <Link href={`/playbook/teams/${teamId}/playbooks/new`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="w-3.5 h-3.5" />
              New Playbook
            </Button>
          </Link>
        </div>
        {playbooks.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playbooks.map((pb) => (
              <Card key={pb.id} className="hover:border-accent/40 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{pb.name}</p>
                    <p className="text-xs text-muted">{pb.plays?.length ?? 0} plays</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <BookOpen className="w-6 h-6 mx-auto text-muted/40 mb-2" />
              <p className="text-sm text-muted">No playbooks yet. Create one to start designing plays.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
