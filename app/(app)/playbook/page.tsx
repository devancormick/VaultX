import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PlaybookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, invite_code")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  // Separate queries so a missing FK never hides teams
  const teamIds = (teams ?? []).map((t: any) => t.id);
  const [{ data: allMembers }, { data: allPlaybooks }] = teamIds.length > 0
    ? await Promise.all([
        supabase.from("team_memberships").select("id, team_id").in("team_id", teamIds),
        supabase.from("playbooks").select("id, team_id, name, plays(id, name, thumbnail_url)").in("team_id", teamIds),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Playbook</h1>
          <p className="text-muted mt-1">Build plays, manage teams, and track player progress</p>
        </div>
        <Link href="/playbook/teams/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Team
          </Button>
        </Link>
      </div>

      {teams && teams.length > 0 ? (
        <div className="space-y-8">
          {teams.map((team: any) => {
            const playbooks = (allPlaybooks ?? []).filter((pb: any) => pb.team_id === team.id);
            const memberCount = (allMembers ?? []).filter((m: any) => m.team_id === team.id).length;
            return (
              <div key={team.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <h2 className="font-display font-extrabold text-lg text-text">{team.name}</h2>
                    <span className="text-xs text-muted">· {memberCount} player{memberCount !== 1 ? "s" : ""}</span>
                  </div>
                  <Link href={`/playbook/teams/${team.id}`}>
                    <Button variant="ghost" size="sm">Manage Team</Button>
                  </Link>
                </div>

                {playbooks.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {playbooks.map((pb: any) => {
                      const plays = pb.plays ?? [];
                      return (
                        <Card key={pb.id} className="hover:border-accent/40 transition-colors cursor-pointer">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-accent" />
                              {pb.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted mb-3">{plays.length} play{plays.length !== 1 ? "s" : ""}</p>
                            <div className="grid grid-cols-3 gap-1 mb-3">
                              {plays.slice(0, 3).map((play: any) => (
                                <div key={play.id} className="aspect-video bg-surface rounded border border-border flex items-center justify-center">
                                  {play.thumbnail_url
                                    ? <img src={play.thumbnail_url} alt={play.name} className="w-full h-full object-cover rounded" />
                                    : <Target className="w-3 h-3 text-muted/40" />}
                                </div>
                              ))}
                            </div>
                            <Link href={`/playbook/${pb.id}`}>
                              <Button variant="secondary" size="sm" className="w-full">Open Playbook</Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Add playbook card */}
                    <Card className="border-dashed hover:border-accent/40 transition-colors cursor-pointer">
                      <CardContent className="h-full flex flex-col items-center justify-center py-8 text-center gap-2">
                        <Plus className="w-6 h-6 text-muted/50" />
                        <p className="text-xs text-muted">New Playbook</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <BookOpen className="w-8 h-8 mx-auto text-muted/40 mb-3" />
                      <p className="text-sm font-medium text-text">No playbooks yet</p>
                      <p className="text-xs text-muted mt-1">Create your first playbook to start designing plays.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted/40 mb-4" />
            <h3 className="font-display font-extrabold text-lg text-text mb-2">No teams yet</h3>
            <p className="text-muted text-sm mb-6">Create your first team to start building football plays and inviting players.</p>
            <Link href="/playbook/teams/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
