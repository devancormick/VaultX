import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Mail, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get user's teams with member counts
  const { data: teams } = await supabase
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your football teams and players</p>
        </div>
        <Link href="/playbook/teams/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {team.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Players</span>
                      <Badge variant="default">{team.team_memberships?.length || 0}</Badge>
                    </div>

                    {team.team_memberships && team.team_memberships.length > 0 ? (
                      <div className="space-y-2">
                        {team.team_memberships.slice(0, 3).map((membership: any) => (
                          <div key={membership.id} className="flex items-center justify-between text-sm">
                            <span>{membership.profiles?.full_name || membership.profiles?.email}</span>
                            <Badge variant="default" className="text-xs">
                              {membership.position || "Player"}
                            </Badge>
                          </div>
                        ))}
                        {team.team_memberships.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{team.team_memberships.length - 3} more players
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No players yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/playbook/teams/${team.id}`}>
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </Link>

                    <Link href={`/playbook/teams/${team.id}/invite`}>
                      <Button variant="secondary" size="sm">
                        <Mail className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start managing players and plays
          </p>
          <Link href="/playbook/teams/new">
            <Button>Create Team</Button>
          </Link>
        </div>
      )}
    </div>
  );
}