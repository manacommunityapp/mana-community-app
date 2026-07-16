export function ballColor(ball: string): string {
  if (ball === "W") return "bg-red-100 text-red-700";
  if (ball === "4") return "bg-emerald-100 text-emerald-700";
  if (ball === "6") return "bg-purple-100 text-purple-700";
  if (ball.includes("wd") || ball.includes("nb")) return "bg-amber-100 text-amber-700";
  if (ball === "0") return "bg-slate-100 text-slate-400";
  return "bg-blue-100 text-blue-700";
}

export function remainingBalls(currentOvers: string, maxOvers?: number): number {
  const parts = currentOvers.split(".");
  const overs = parseInt(parts[0]) || 0;
  const balls = parseInt(parts[1]) || 0;
  const bowled = overs * 6 + balls;
  const total = (maxOvers ?? 20) * 6;
  return Math.max(0, total - bowled);
}

export function requiredRunRate(target: number, currentRuns: number, currentOvers: string, maxOvers?: number): string {
  const remaining = remainingBalls(currentOvers, maxOvers);
  if (remaining <= 0) return "-";
  const needed = target - currentRuns;
  if (needed <= 0) return "0.00";
  return (needed / (remaining / 6)).toFixed(2);
}
