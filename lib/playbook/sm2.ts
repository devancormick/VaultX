export interface SM2State {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
}

export const SM2_DEFAULT: SM2State = {
  easinessFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
  nextReviewAt: new Date().toISOString(),
};

export function sm2Update(state: SM2State, quality: number): SM2State & { nextReviewDays: number } {
  const q = Math.max(0, Math.min(5, quality));
  let ef = state.easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ef = Math.max(1.3, ef);

  let interval: number;
  let reps: number;

  if (q < 3) {
    interval = 1;
    reps = 0;
  } else {
    reps = state.repetitions + 1;
    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 6;
    } else {
      interval = Math.round(state.intervalDays * ef);
    }
  }

  const nextReviewAt = new Date(Date.now() + interval * 86400_000).toISOString();

  return {
    easinessFactor: ef,
    intervalDays: interval,
    repetitions: reps,
    nextReviewAt,
    nextReviewDays: interval,
  };
}

export function scoreToSM2Quality(score: number): number {
  if (score >= 0.95) return 5;
  if (score >= 0.85) return 4;
  if (score >= 0.70) return 3;
  if (score >= 0.50) return 2;
  if (score >= 0.30) return 1;
  return 0;
}
