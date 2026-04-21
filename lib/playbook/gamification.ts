export const XP = {
  STUDY_COMPLETE: 10,
  IDENTIFY_COMPLETE: 20,
  EXECUTE_BASE: 30,
  EXECUTE_BONUS_MAX: 20,
  GAME_READY: 30,
  STREAK_BONUS: 25,
  FIRST_DRILL_DAY: 15,
} as const;

export interface LevelDefinition {
  level: number;
  name: string;
  minXp: number;
  color: string;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: "Rookie",         minXp: 0,    color: "#6B7280" },
  { level: 2, name: "JV",             minXp: 100,  color: "#10B981" },
  { level: 3, name: "Varsity",        minXp: 300,  color: "#3B82F6" },
  { level: 4, name: "All-Conference", minXp: 600,  color: "#8B5CF6" },
  { level: 5, name: "All-American",   minXp: 1000, color: "#F59E0B" },
  { level: 6, name: "Pro Scout",      minXp: 1500, color: "#EF4444" },
  { level: 7, name: "Hall of Famer",  minXp: 2500, color: "#00D4FF" },
];

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number): LevelDefinition | null {
  const current = getLevelForXp(xp);
  const next = LEVELS.find(l => l.level === current.level + 1);
  return next ?? null;
}

export function getLevelProgress(xp: number): number {
  const current = getLevelForXp(xp);
  const next = getNextLevel(xp);
  if (!next) return 1;
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(1, Math.max(0, progress / range));
}

export interface DrillXpResult {
  total: number;
  breakdown: Array<{ label: string; amount: number }>;
  leveledUp: boolean;
  newLevel: LevelDefinition;
}

export function calculateDrillXp({
  prevXp,
  identifyScore,
  frechetScore,
  gameReadyScore,
  streakMaintained,
  isFirstDrillToday,
}: {
  prevXp: number;
  identifyScore: number;
  frechetScore: number;
  gameReadyScore: number;
  streakMaintained: boolean;
  isFirstDrillToday: boolean;
}): DrillXpResult {
  const breakdown: Array<{ label: string; amount: number }> = [];

  breakdown.push({ label: "Study", amount: XP.STUDY_COMPLETE });
  breakdown.push({ label: "Identify", amount: Math.round(XP.IDENTIFY_COMPLETE * identifyScore) });

  const executeBonus = Math.round(XP.EXECUTE_BONUS_MAX * (1 - frechetScore));
  breakdown.push({ label: "Execute", amount: XP.EXECUTE_BASE + executeBonus });
  breakdown.push({ label: "Game Ready", amount: Math.round(XP.GAME_READY * gameReadyScore) });

  if (streakMaintained) breakdown.push({ label: "Streak bonus", amount: XP.STREAK_BONUS });
  if (isFirstDrillToday) breakdown.push({ label: "Daily bonus", amount: XP.FIRST_DRILL_DAY });

  const total = breakdown.reduce((s, b) => s + b.amount, 0);
  const newTotalXp = prevXp + total;
  const prevLevel = getLevelForXp(prevXp);
  const newLevel = getLevelForXp(newTotalXp);

  return { total, breakdown, leveledUp: newLevel.level > prevLevel.level, newLevel };
}

const ACHIEVEMENT_CONDITIONS: Record<string, (ctx: AchievementContext) => boolean> = {
  first_play:        ctx => ctx.totalDrillsCompleted >= 1,
  hot_streak_3:      ctx => ctx.currentStreak >= 3,
  hot_streak_7:      ctx => ctx.currentStreak >= 7,
  hot_streak_30:     ctx => ctx.currentStreak >= 30,
  perfect_route:     ctx => ctx.frechetScore <= 0.05,
  near_perfect:      ctx => ctx.nearPerfectExecuteCount >= 5,
  speed_read:        ctx => ctx.gameReadyTimeMs > 0 && ctx.gameReadyTimeMs <= 5000,
  film_room_10:      ctx => ctx.studiedPlaysCount >= 10,
  film_room_50:      ctx => ctx.studiedPlaysCount >= 50,
  full_playbook:     ctx => ctx.totalDrillsCompleted >= 25,
  comeback:          ctx => ctx.prevScoreForPlay !== undefined && ctx.prevScoreForPlay < 0.5 && ctx.currentScoreForPlay >= 0.9,
  hat_trick:         ctx => ctx.drillsCompletedToday >= 3,
  century:           ctx => ctx.totalDrillsCompleted >= 100,
  level_5:           ctx => ctx.newLevel >= 5,
  level_7:           ctx => ctx.newLevel >= 7,
};

export interface AchievementContext {
  totalDrillsCompleted: number;
  currentStreak: number;
  frechetScore: number;
  gameReadyTimeMs: number;
  perfectExecuteCount: number;
  nearPerfectExecuteCount: number;
  studiedPlaysCount: number;
  drillsCompletedToday: number;
  newLevel: number;
  prevScoreForPlay?: number;
  currentScoreForPlay: number;
}

export function checkNewAchievements(ctx: AchievementContext, alreadyEarned: string[]): string[] {
  return Object.entries(ACHIEVEMENT_CONDITIONS)
    .filter(([id, check]) => !alreadyEarned.includes(id) && check(ctx))
    .map(([id]) => id);
}
