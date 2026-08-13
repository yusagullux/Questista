// Mirrors the SQL `confidence_level_for` so the UI can render levels without a round-trip.
export const LEVELS = [
  { name: "Curious", min: 0 },
  { name: "Explorer", min: 50 },
  { name: "Contributor", min: 150 },
  { name: "Conversationalist", min: 400 },
  { name: "Confident", min: 900 },
  { name: "Thought Leader", min: 1800 },
] as const;

export function levelFor(points: number): string {
  let current: string = LEVELS[0].name;
  for (const l of LEVELS) if (points >= l.min) current = l.name;
  return current;
}

export function nextLevel(points: number) {
  const idx = LEVELS.findIndex((l) => points < l.min);
  if (idx === -1) return null; // maxed out
  const target = LEVELS[idx];
  const floor = idx === 0 ? 0 : LEVELS[idx - 1].min;
  return {
    name: target.name,
    pointsToNext: target.min - points,
    progress: Math.min(1, (points - floor) / (target.min - floor)),
  };
}

export function pointsForAnswer(opts: {
  visibility: "public" | "private" | "skipped";
  contentLength: number;
}) {
  if (opts.visibility === "skipped") return 2; // daily-return bonus only
  let p = 3;
  if (opts.visibility === "public") p += 2;
  if (opts.contentLength >= 80) p += 1;
  return p + 2; // + daily-return
}