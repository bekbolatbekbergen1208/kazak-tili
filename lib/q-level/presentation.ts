import { labels, skills, type Result, type Level } from "./types";
export const scoreLevel = (n: number): Level =>
  n >= 85 ? "C1" : n >= 65 ? "B2" : n >= 45 ? "B1" : n >= 25 ? "A2" : "A1";
export function recommendations(
  r: Result | null,
): { skill: string; percent: number; href: string }[] {
  if (!r) return [{ skill: "Алғашқы сабақ", percent: 100, href: "/learn/map" }];
  const sorted = skills
    .filter((s) => r.skills[s].score !== null)
    .sort((a, b) => (r.skills[a].score ?? 0) - (r.skills[b].score ?? 0));
  const weak = r.skills.speaking.score === null ? "speaking" : sorted[0];
  const second = weak === "speaking" ? "listening" : (sorted[1] ?? "reading");
  return [
    {
      skill: labels[weak],
      percent: 40,
      href: weak === "speaking" ? "/learn/friend" : "/learn/review",
    },
    { skill: labels[second], percent: 30, href: "/student/lessons" },
    { skill: labels.vocabulary, percent: 15, href: "/learn/review" },
    { skill: "Басқа дағдылар", percent: 15, href: "/learn/map" },
  ];
}
export function nextTarget(result: Result): {
  level: Level;
  score: number;
  remaining: number;
} {
  const target: Record<Level, { level: Level; score: number }> = {
    A0: { level: "A1", score: 1 },
    A1: { level: "A2", score: 25 },
    A2: { level: "B1", score: 45 },
    B1: { level: "B2", score: 65 },
    B2: { level: "C1", score: 85 },
    C1: { level: "C1", score: 100 },
  };
  const next = target[result.level];
  return { ...next, remaining: Math.max(0, next.score - result.score) };
}
