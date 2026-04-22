import { createClient } from "@/lib/supabase/server";
import { getLevelForXp } from "@/lib/playbook/gamification";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export async function Leaderboard({ teamId, currentUserId }: { teamId: string; currentUserId: string }) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("team_memberships")
    .select(`
      player_id,
      position,
      profiles!inner(full_name, email, avatar_url),
      player_xp!inner(total_xp, level),
      player_streaks!inner(current_streak)
    `)
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("player_xp(total_xp)", { ascending: false })
    .limit(20);

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted text-center py-6">No players on this team yet.</p>;
  }

  return (
    <div className="space-y-1">
      {rows.map((row, idx) => {
        const xp = (row.player_xp as unknown as { total_xp: number } | null)?.total_xp ?? 0;
        const streak = (row.player_streaks as unknown as { current_streak: number } | null)?.current_streak ?? 0;
        const level = getLevelForXp(xp);
        const profile = row.profiles as unknown as { full_name: string; email: string; avatar_url?: string };
        const isMe = row.player_id === currentUserId;
        const rank = idx + 1;

        return (
          <div
            key={row.player_id}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              isMe ? "bg-accent/10 border border-accent/20" : "hover:bg-surface/60",
            )}
          >
            <span className={cn(
              "w-6 text-center text-sm font-bold shrink-0",
              rank === 1 ? "text-warning" : rank <= 3 ? "text-muted" : "text-muted/50",
            )}>
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
            </span>
            <Avatar src={profile.avatar_url} name={profile.full_name} email={profile.email} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {profile.full_name ?? profile.email}
                {isMe && <span className="text-xs text-accent ml-1.5">(you)</span>}
              </p>
              <p className="text-xs text-muted">{row.position ?? "Player"}</p>
            </div>
            <div
              className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ color: level.color, background: level.color + "18", border: `1px solid ${level.color}44` }}
            >
              Lvl {level.level}
            </div>
            <span className="text-xs font-mono text-muted shrink-0 min-w-[52px] text-right">{xp.toLocaleString()} XP</span>
            {streak > 0 && <span className="text-xs text-warning shrink-0">🔥{streak}</span>}
          </div>
        );
      })}
    </div>
  );
}
