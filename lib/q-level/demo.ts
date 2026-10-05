import type { Result } from "./types";
import { skills } from "./types";
import { scoreLevel } from "./presentation";
export const demoHistory: Result[] = [41, 57, 68].map((score, i) => ({
  id: `demo-${i}`,
  score,
  level: i === 0 ? "A2" : "B1",
  confidence: 76,
  type: "full",
  pending: false,
  date: ["2026-08-12", "2026-09-05", "2026-10-02"][i] + "T12:00:00Z",
  previousScore: i === 0 ? null : [41, 57][i - 1],
  skills: Object.fromEntries(
    skills.map((s, j) => {
      const n = Math.max(0, Math.min(100, score + [0, 12, -17, -4, 2, 0][j]));
      return [
        s,
        { score: n, level: scoreLevel(n), count: 10, confidence: 0.8 },
      ];
    }),
  ) as Result["skills"],
  feedback: [
    "Оқылымың жақсы. Келесі 14 күнде айтылым мен тыңдалымды көбірек жаттықтыр.",
  ],
}));
export const demoLeaders = [
  {
    name: "Нұрсұлтан",
    level: "A2",
    weekly: 29,
    monthly: 31,
    score: 42,
    school: "№12 мектеп",
  },
  {
    name: "Аружан",
    level: "B1",
    weekly: 23,
    monthly: 23,
    score: 62,
    school: "№8 мектеп",
  },
  {
    name: "Әлихан",
    level: "B1",
    weekly: 21,
    monthly: 24,
    score: 58,
    school: "№12 мектеп",
  },
  {
    name: "Диас",
    level: "B2",
    weekly: 12,
    monthly: 12,
    score: 77,
    school: "№3 мектеп",
  },
];
export const leagues = [
  "Qadam",
  "Samgau",
  "Tulpar",
  "Barys",
  "Altyn",
  "Qazaq Master",
];
export function activityLeague(
  lessons: number,
  streak: number,
  growth: number,
) {
  return leagues[
    Math.min(
      5,
      Math.floor((lessons * 3 + streak * 2 + Math.max(0, growth) * 4) / 100),
    )
  ];
}
