type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function discreteFrechet(p: Point[], q: Point[]): number {
  const n = p.length;
  const m = q.length;
  if (n === 0 || m === 0) return Infinity;

  const ca: number[][] = Array.from({ length: n }, () => new Array(m).fill(-1));

  function c(i: number, j: number): number {
    if (ca[i][j] !== -1) return ca[i][j];
    const d = dist(p[i], q[j]);
    if (i === 0 && j === 0) {
      ca[i][j] = d;
    } else if (i === 0) {
      ca[i][j] = Math.max(c(0, j - 1), d);
    } else if (j === 0) {
      ca[i][j] = Math.max(c(i - 1, 0), d);
    } else {
      ca[i][j] = Math.max(Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)), d);
    }
    return ca[i][j];
  }

  return c(n - 1, m - 1);
}

export function frechetScore(
  playerPath: Point[],
  coachPath: Point[],
  fieldDiagonal = 1442,
): number {
  if (playerPath.length < 2 || coachPath.length < 2) return 0;
  const raw = discreteFrechet(playerPath, coachPath);
  return Math.max(0, 1 - raw / fieldDiagonal);
}
