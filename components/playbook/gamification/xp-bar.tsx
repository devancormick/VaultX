"use client";

import { getLevelForXp, getNextLevel, getLevelProgress, type LevelDefinition } from "@/lib/playbook/gamification";
import { cn } from "@/lib/utils";

export function XpBar({ xp, className }: { xp: number; className?: string }) {
  const level = getLevelForXp(xp);
  const next = getNextLevel(xp);
  const progress = getLevelProgress(xp);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">
          {next ? `${xp - level.minXp} / ${next.minXp - level.minXp} XP to ${next.name}` : "Max level reached"}
        </span>
        <span className="text-text font-medium tabular-nums">{xp} XP</span>
      </div>
      <div className="relative h-2.5 bg-border rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${level.color}99, ${level.color})` }}
        />
      </div>
    </div>
  );
}

export function LevelBadge({ level, className }: { level: LevelDefinition; className?: string }) {
  return (
    <div
      className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold", className)}
      style={{ borderColor: level.color + "55", color: level.color, background: level.color + "15" }}
    >
      <span>Lvl {level.level}</span>
      <span>{level.name}</span>
    </div>
  );
}

export function StreakBadge({ streak, className }: { streak: number; className?: string }) {
  if (streak === 0) return null;
  return (
    <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/15 border border-warning/30 text-xs font-semibold text-warning", className)}>
      🔥 {streak} day{streak !== 1 ? "s" : ""}
    </div>
  );
}
