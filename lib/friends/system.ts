import type { LearningState } from "../learning/types";
export const friendLevels = [
  { name: "Жаңа таныстар", min: 0, max: 99 },
  { name: "Оқу серіктестері", min: 100, max: 299 },
  { name: "Тіл білгірлері", min: 300, max: 599 },
  { name: "Біріккен зерттеушілер", min: 600, max: 999 },
  { name: "QazaqDos достары", min: 1000, max: Infinity },
];
export const friendLevel = (points: number) =>
  friendLevels.findLast((x) => points >= x.min)!;
export const safeMessages = [
  "Бүгін бірге сабақ орындайық!",
  "Жарайсың!",
  "Ортақ тапсырмамыз аяқталуға жақын!",
  "Келесі тарихи қалаға барайық!",
  "Жаңа сөздерді бірге үйренейік!",
];
export function localDay(date: string, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(date));
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${value("year")}-${value("month")}-${value("day")}`;
  } catch {
    return date.slice(0, 10);
  }
}
export function learningDays(s: LearningState, timeZone: string) {
  const dates = [
    ...s.progress.xpTransactions.map((t) => t.date),
    ...(s.progress.vision?.days ?? []),
  ];
  return [...new Set(dates.map((d) => localDay(d, timeZone)))].sort();
}
export function sharedDays(a: LearningState, b: LearningState, tz: string) {
  const bd = new Set(learningDays(b, tz));
  return learningDays(a, tz).filter((d) => bd.has(d));
}
export function sharedStreak(days: string[], now = new Date(), freeze = false) {
  const set = new Set(days),
    cursor = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  if (!set.has(cursor.toISOString().slice(0, 10)))
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  let current = 0;
  let saved = false;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) current++;
    else if (freeze && !saved) saved = true;
    else break;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let best = 0,
    run = 0,
    last = "";
  for (const d of [...set].sort()) {
    if (last) {
      const next = new Date(last + "T00:00:00Z");
      next.setUTCDate(next.getUTCDate() + 1);
      run = next.toISOString().slice(0, 10) === d ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    last = d;
  }
  return { current, best };
}
export function missionStats(a: LearningState, b: LearningState) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  start.setUTCHours(0, 0, 0, 0);
  const lessons = (s: LearningState) =>
    Object.values(s.progress.lessons).filter((x) => x.completedAt).length;
  const weeklyLessons = (s: LearningState) =>
    Object.values(s.progress.lessons).filter(
      (x) => x.completedAt && Date.parse(x.completedAt) >= start.getTime(),
    ).length;
  const artifacts = (s: LearningState) =>
    s.progress.history?.cities.otyrar?.discovered.length ?? 0;
  const vision = (s: LearningState) =>
    Object.values(s.progress.vision?.words ?? {}).filter((x) => x.tasks.length)
      .length;
  return [
    {
      id: "weekly-lessons",
      title: "Бір аптада 5 сабақ аяқтаңдар",
      target: 5,
      a: weeklyLessons(a),
      b: weeklyLessons(b),
    },
    {
      id: "otyrar-artifacts",
      title: "Отырардан 5 жәдігер табыңдар",
      target: 10,
      a: artifacts(a),
      b: artifacts(b),
    },
    {
      id: "vision-words",
      title: "Бірге 10 жаңа сөз жинаңдар",
      target: 10,
      a: vision(a),
      b: vision(b),
    },
  ].map((m) => ({
    ...m,
    total: Math.min(m.target, m.a + m.b),
    complete: m.a > 0 && m.b > 0 && m.a + m.b >= m.target,
  }));
}
