import {
  labels,
  levels,
  skills,
  type Answer,
  type Attempt,
  type Level,
  type PublicQuestion,
  type Question,
  type Result,
  type SkillResult,
} from "./types";
import { productionQuestion, questionBank } from "./questions";
import { gradeQuestion } from "./grading";
export const scoreLevel = (n: number): Level =>
  n >= 85 ? "C1" : n >= 65 ? "B2" : n >= 45 ? "B1" : n >= 25 ? "A2" : "A1";
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function adapt(ability: number, answers: Answer[]): number {
  const recent = answers.filter((a) => a.correct !== null).slice(-3);
  if (recent.length < 2) return ability;
  const rate = recent.filter((a) => a.correct).length / recent.length;
  return Math.max(
    0,
    Math.min(4, ability + (rate >= 2 / 3 ? 0.35 : rate <= 1 / 3 ? -0.3 : 0)),
  );
}
export function nextQuestion(
  a: Attempt,
  excluded: string[] = [],
): Question | null {
  const n = a.answers.length;
  if ((a.type === "quick" && n >= 16) || (a.type === "full" && n >= 22))
    return null;
  if (a.type === "full" && n >= 20)
    return productionQuestion(
      n === 20 ? "writing" : "speaking",
      scoreLevel(10 + a.ability * 20),
    );
  const skill =
    a.type === "quick"
      ? skills[n % 4]
      : n < 6
        ? "listening"
        : n < 12
          ? "reading"
          : n % 2 === 0
            ? "vocabulary"
            : "grammar";
  const used = new Set(a.answers.map((x) => x.questionId));
  const candidates = questionBank.filter(
    (q) => q.skill === skill && !used.has(q.id),
  );
  const fresh = candidates.filter((q) => !excluded.includes(q.id));
  return (
    shuffle(fresh.length ? fresh : candidates).sort(
      (x, y) =>
        Math.abs(x.difficulty - a.ability) - Math.abs(y.difficulty - a.ability),
    )[0] ?? null
  );
}
export function startAttempt(
  type: "quick" | "full",
  lessons = 0,
  excluded: string[] = [],
): Attempt {
  const now = new Date().toISOString();
  const a: Attempt = {
    id: crypto.randomUUID(),
    type,
    startedAt: now,
    updatedAt: now,
    ability: 1.5,
    answers: [],
    questionId: null,
    completed: false,
    lessonsAtStart: lessons,
  };
  a.questionId = nextQuestion(a, excluded)?.id ?? null;
  return a;
}
export function getQuestion(a: Attempt): Question | undefined {
  return (
    questionBank.find((q) => q.id === a.questionId) ??
    (a.questionId?.startsWith("writing-")
      ? productionQuestion("writing", a.questionId.slice(8) as Level)
      : a.questionId?.startsWith("speaking-")
        ? productionQuestion("speaking", a.questionId.slice(9) as Level)
        : undefined)
  );
}
export function publicQuestion(q: Question): PublicQuestion {
  const { correct_answer, explanation, text_content, ...rest } = q;
  void correct_answer;
  void explanation;
  return {
    ...rest,
    options: q.options ? shuffle(q.options) : undefined,
    ...(q.skill === "listening" ? {} : { text_content }),
  };
}
export function submitAnswer(
  a: Attempt,
  value: string,
  responseTime: number,
  previousScore: number | null = null,
  excluded: string[] = [],
): Attempt {
  const q = getQuestion(a);
  if (!q || a.completed)
    throw new Error("Тест аяқталған немесе сұрақ табылмады.");
  if (typeof value !== "string" || value.length > 12000)
    throw new Error("Жауап тым ұзын.");
  if (
    (q.type === "writing" || q.type === "speaking") &&
    value.trim().length < 3
  )
    throw new Error("Жауап жазыңыз немесе «Өткізу» таңдаңыз.");
  const correct = gradeQuestion(q, value);
  const answers = [
    ...a.answers,
    {
      questionId: q.id,
      value,
      correct,
      responseTime: Math.max(0, Math.min(3600, responseTime)),
      difficulty: q.difficulty,
      skill: q.skill,
    },
  ];
  const out: Attempt = {
    ...a,
    answers,
    updatedAt: new Date().toISOString(),
    ability: adapt(a.ability, answers),
  };
  out.questionId = nextQuestion(out, excluded)?.id ?? null;
  if (!out.questionId) {
    out.completed = true;
    out.result = calculate(out, previousScore);
  }
  return out;
}
export function calculate(
  a: Attempt,
  previousScore: number | null = null,
): Result {
  const results = {} as Record<(typeof skills)[number], SkillResult>;
  for (const skill of skills) {
    const rows = a.answers.filter(
      (x) => x.skill === skill && x.correct !== null,
    );
    const evidence = rows.length;
    // Difficulty-weighted estimate, with smoothing for small samples.
    const raw = rows.reduce(
      (sum, x) =>
        sum +
        (x.correct
          ? Math.min(100, 30 + x.difficulty * 18)
          : Math.max(0, x.difficulty * 18 - 12)),
      0,
    );
    const score = evidence ? Math.round(raw / evidence) : null;
    results[skill] = {
      score,
      level: score === null ? "A0" : scoreLevel(score),
      count: evidence,
      confidence: Math.min(0.95, evidence / 10),
    };
  }
  const measured = skills
    .map((s) => results[s])
    .filter((s) => s.score !== null);
  const score = Math.round(
    measured.reduce((n, s) => n + (s.score ?? 0), 0) /
      Math.max(1, measured.length),
  );
  const sorted = measured
    .map((s) => levels.indexOf(s.level))
    .sort((x, y) => x - y);
  const bottleneck =
    levels[Math.min(levels.indexOf(scoreLevel(score)), (sorted[0] ?? 0) + 1)];
  const weak = skills
    .filter((s) => results[s].score !== null)
    .sort((x, y) => (results[x].score ?? 0) - (results[y].score ?? 0))[0];
  return {
    id: a.id,
    score,
    level: measured.length ? bottleneck : "A0",
    confidence: Math.round(
      (measured.reduce((n, s) => n + s.confidence, 0) / 6) * 100,
    ),
    skills: results,
    date: a.updatedAt,
    previousScore,
    type: a.type,
    pending: results.writing.score === null || results.speaking.score === null,
    feedback: [
      `${weak ? labels[weak] : "Тіл үйрену"} бағытына көбірек көңіл бөл.`,
      "Айтылым мен жазылым бағаланбайынша, жалпы деңгей — болжамды диагностикалық нәтиже.",
    ],
  };
}
export function beginner(): Result {
  return {
    id: crypto.randomUUID(),
    score: 0,
    level: "A0",
    confidence: 0,
    skills: Object.fromEntries(
      skills.map((s) => [
        s,
        { score: null, level: "A0", count: 0, confidence: 0 },
      ]),
    ) as Result["skills"],
    date: new Date().toISOString(),
    previousScore: null,
    type: "beginner",
    pending: true,
    feedback: ["Алдымен амандасу, танысу және күнделікті сөздерден баста."],
  };
}
