import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Target, Zap, Trophy, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XpBar, LevelBadge, StreakBadge } from "@/components/playbook/gamification/xp-bar";
import { Leaderboard } from "@/components/playbook/gamification/leaderboard";
import { getLevelForXp } from "@/lib/playbook/gamification";

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch team memberships (player role)
  const { data: memberships } = await supabase
    .from("team_memberships")
    .select(`
      id, team_id, position, status,
      teams!inner (id, name, coach_id,
        playbooks (id, name, plays (id, name, thumbnail_url))
      )
    `)
    .eq("player_id", user.id)
    .eq("status", "active");

  // Fetch XP — graceful if table doesn't exist
  const { data: xpRow } = await supabase
    .from("player_xp")
    .select("total_xp, level")
    .eq("player_id", user.id)
    .maybeSingle();

  // Fetch streak — graceful
  const { data: streakRow } = await supabase
    .from("player_streaks")
    .select("current_streak, longest_streak, last_drill_date")
    .eq("player_id", user.id)
    .maybeSingle();

  // Fetch spaced repetition due plays (next_review_at <= now)
  const { data: dueRows } = await supabase
    .from("spaced_repetition")
    .select("play_id, next_review_at, interval_days, repetitions")
    .eq("player_id", user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(10);

  // Fetch recent achievements
  const { data: achievements } = await supabase
    .from("player_achievements")
    .select("achievement_id, earned_at, achievement_definitions (name, icon, description)")
    .eq("player_id", user.id)
    .order("earned_at", { ascending: false })
    .limit(6);

  const totalXp = xpRow?.total_xp ?? 0;
  const currentStreak = streakRow?.current_streak ?? 0;
  const longestStreak = streakRow?.longest_streak ?? 0;
  const level = getLevelForXp(totalXp);
  const dueCount = dueRows?.length ?? 0;

  // Flatten plays from all team memberships
  const allPlays: Array<{ id: string; name: string; thumbnail_url?: string; teamName: string; playbookName: string }> = [];
  for (const m of memberships ?? []) {
    const team = m.teams as any;
    for (const pb of team?.playbooks ?? []) {
      for (const play of pb.plays ?? []) {
        allPlays.push({ ...play, teamName: team.name, playbookName: pb.name });
      }
    }
  }

  const firstTeamId = (memberships?.[0]?.teams as any)?.id;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Learn</h1>
        <p className="text-muted mt-1">Study your playbook, drill plays, and track your progress</p>
      </div>

      {/* XP / Level strip */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-4 flex-wrap">
            <LevelBadge level={level} className="shrink-0" />
            <div className="flex-1 min-w-[160px]">
              <XpBar xp={totalXp} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {currentStreak > 0 && <StreakBadge streak={currentStreak} />}
              {longestStreak > 0 && (
                <span className="text-xs text-muted">Best: {longestStreak} days</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-text tabular-nums">{totalXp.toLocaleString()}</p>
              <p className="text-xs text-muted">Total XP</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
              <span className="text-base">🔥</span>
            </div>
            <div>
              <p className="text-lg font-bold text-text tabular-nums">{currentStreak}</p>
              <p className="text-xs text-muted">Day streak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-danger" />
            </div>
            <div>
              <p className="text-lg font-bold text-text tabular-nums">{dueCount}</p>
              <p className="text-xs text-muted">Due for review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-text tabular-nums">{achievements?.length ?? 0}</p>
              <p className="text-xs text-muted">Achievements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due for review */}
      {dueCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-danger" />
              Due for Review
              <span className="text-xs bg-danger/15 text-danger border border-danger/25 px-2 py-0.5 rounded-full">{dueCount}</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(dueRows ?? []).slice(0, 6).map((row) => {
              const play = allPlays.find(p => p.id === row.play_id);
              if (!play) return null;
              return (
                <Card key={row.play_id} className="hover:border-danger/40 transition-colors">
                  <CardContent className="py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {play.thumbnail_url
                        ? <img src={play.thumbnail_url} alt={play.name} className="w-full h-full object-cover" />
                        : <Target className="w-4 h-4 text-muted/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{play.name}</p>
                      <p className="text-xs text-muted truncate">{play.playbookName}</p>
                    </div>
                    <Link href={`/learn/drill/${play.id}`}>
                      <Button size="sm" variant="ghost" className="shrink-0 text-accent border border-accent/30 hover:bg-accent/10">
                        Drill
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All plays */}
      {allPlays.length > 0 ? (
        <div>
          <h2 className="font-display font-bold text-lg text-text mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            All Plays
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allPlays.map((play) => (
              <Card key={play.id} className="hover:border-accent/40 transition-colors">
                <CardContent className="pt-4 pb-3 px-4 space-y-3">
                  <div className="aspect-video bg-surface rounded border border-border flex items-center justify-center overflow-hidden">
                    {play.thumbnail_url
                      ? <img src={play.thumbnail_url} alt={play.name} className="w-full h-full object-cover" />
                      : <Target className="w-5 h-5 text-muted/40" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text truncate">{play.name}</p>
                    <p className="text-xs text-muted">{play.teamName} · {play.playbookName}</p>
                  </div>
                  <Link href={`/learn/drill/${play.id}`} className="block">
                    <Button variant="secondary" size="sm" className="w-full">Start Drill</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-muted/40 mb-4" />
            <h3 className="font-display font-extrabold text-lg text-text mb-2">No plays assigned yet</h3>
            <p className="text-muted text-sm">Ask your coach to invite you to a team to start learning plays.</p>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg text-text mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            Recent Achievements
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a: any) => (
              <div key={a.achievement_id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                <span className="text-2xl shrink-0">{a.achievement_definitions?.icon ?? "🏆"}</span>
                <div>
                  <p className="text-sm font-medium text-text">{a.achievement_definitions?.name ?? a.achievement_id}</p>
                  <p className="text-xs text-muted">{a.achievement_definitions?.description ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {firstTeamId && (
        <div>
          <h2 className="font-display font-bold text-lg text-text mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Team Leaderboard
          </h2>
          <Card>
            <CardContent className="py-4 px-2">
              <Leaderboard teamId={firstTeamId} currentUserId={user.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
