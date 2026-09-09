import type { LearningState } from "../learning/types";
import { awardNational } from "../national/state";
import { battleFor, readingBook, tasksFor } from "./catalog";
import type {
  ReadingAction,
  ReadingProgress,
  ReadingRecord,
  ReadingTask,
} from "./types";

export const BATTLE_SECONDS = 180;
export const PASS_SCORE = 7;
export const emptyReading = (): ReadingRecord => ({
  chapters: [],
  answers: {},
  completed: [],
  bestScore: 0,
});
export const reading = (s: LearningState): ReadingProgress =>
  s.progress.reading ?? { books: {}, days: [] };
export const recordFor = (s: LearningState, id: string) =>
  reading(s).books[id] ?? emptyReading();
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function validTask(task: ReadingTask, answer: unknown): boolean {
  if (typeof answer !== "string" || answer.length > 4000) return false;
  if (task.kind === "map") {
    try {
      const fields = JSON.parse(answer);
      return (
        Array.isArray(fields) &&
        fields.length === 4 &&
        fields.every(
          (x) =>
            typeof x === "string" &&
            /[\p{L}]/u.test(x) &&
            x.trim().length >= 12 &&
            x.length <= 700,
        )
      );
    } catch {
      return false;
    }
  }
  if (task.kind === "ending") {
    const sentences = answer
      .trim()
      .split(/[.!?]+/u)
      .map((x) => x.trim())
      .filter(Boolean);
    return (
      sentences.length >= 3 &&
      sentences.length <= 5 &&
      sentences.every((x) => x.length >= 8 && /[\p{L}]/u.test(x))
    );
  }
  if (task.kind === "opinion")
    return answer.trim().length >= 30 && /[\p{L}]/u.test(answer);
  return answer === task.answer;
}
export function readingPercent(s: LearningState, id: string) {
  const b = readingBook(id);
  if (!b) return 0;
  const p = recordFor(s, id);
  return Math.round(
    (100 * (p.chapters.length + p.completed.length + (p.certifiedAt ? 1 : 0))) /
      (b.chapters.length + tasksFor(b).length + 1),
  );
}
export function readingStreak(days: string[], now = new Date()) {
  const unique = new Set(days);
  const cursor = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  if (!unique.has(cursor.toISOString().slice(0, 10)))
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (unique.has(cursor.toISOString().slice(0, 10))) {
    count++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}
export function readerTitles(s: LearningState) {
  const records = Object.values(reading(s).books);
  const completed = records.filter((p) => p.certifiedAt).length;
  return [
    {
      name: "Кітап білгірі",
      unlocked: completed >= 1,
      hint: "1 кітапты аяқта",
    },
    {
      name: "Сөз шебері",
      unlocked:
        records.filter((p) => p.completed.includes("match")).length >= 5,
      hint: "5 кітаптың сөздік ойынын аяқта",
    },
    {
      name: "Ұлы оқырман",
      unlocked: completed >= 10,
      hint: "10 кітапты аяқта",
    },
  ];
}
export function applyReading(
  s: LearningState,
  action: ReadingAction,
  now: Date,
) {
  const book = readingBook(action.bookId);
  if (!book) throw Error("Unknown book");
  const progress = (s.progress.reading ??= { books: {}, days: [] });
  const p = (progress.books[book.id] ??= emptyReading());
  const stamp = now.toISOString(),
    day = stamp.slice(0, 10);
  const reward = (id: string, xp: number, coins: number, crystals: number) =>
    awardNational(s, {
      id: `reading-${book.id}-${id}`,
      title: `Кітап әлемі · ${book.title}`,
      xp,
      coins,
      crystals,
      date: stamp,
    });
  const markDay = () => {
    if (!progress.days.includes(day)) progress.days.push(day);
    const streak = s.progress.streak;
    if (streak.lastDay !== day) {
      const yesterday = new Date(now.getTime() - 86400000)
        .toISOString()
        .slice(0, 10);
      streak.current = streak.lastDay === yesterday ? streak.current + 1 : 1;
      streak.best = Math.max(streak.best, streak.current);
      streak.lastDay = day;
      if (!streak.days.includes(day)) streak.days.push(day);
    }
  };
  if (action.type === "book-read") {
    if (
      !Number.isInteger(action.chapter) ||
      !book.chapters[action.chapter] ||
      (action.chapter > 0 && !p.chapters.includes(action.chapter - 1))
    )
      throw Error("Invalid chapter");
    if (!p.chapters.includes(action.chapter)) {
      p.chapters.push(action.chapter);
      reward(`chapter-${action.chapter}`, 5, 1, 0);
      markDay();
    }
    return;
  }
  if (p.chapters.length !== book.chapters.length)
    throw Error("Read chapters first");
  if (action.type === "book-answer") {
    const task = tasksFor(book).find((x) => x.id === action.taskId);
    if (!task || !validTask(task, action.answer)) throw Error("Invalid answer");
    p.answers[task.id] = action.answer;
    if (!p.completed.includes(task.id)) {
      p.completed.push(task.id);
      reward(`task-${task.id}`, 10, 2, 1);
    }
    markDay();
    return;
  }
  if (p.completed.length !== tasksFor(book).length)
    throw Error("Complete tasks first");
  if (action.type === "book-battle-start") {
    // Resuming an active attempt cannot reset its deadline.
    if (p.battle && !p.battle.finishedAt) return;
    const previous = p.battle?.order.join(",");
    const order = shuffled(battleFor(book).map((q) => q.id));
    if (order.join(",") === previous) order.push(order.shift()!);
    p.battle = { startedAt: stamp, order, answers: {} };
    return;
  }
  const battle = p.battle;
  if (!battle || battle.finishedAt) throw Error("No active battle");
  const expired =
    now.getTime() >= Date.parse(battle.startedAt) + BATTLE_SECONDS * 1000;
  if (action.type === "book-battle-answer") {
    const question = battleFor(book).find((q) => q.id === action.questionId);
    if (
      expired ||
      !question ||
      !question.options.includes(action.answer) ||
      Object.hasOwn(battle.answers, question.id)
    )
      throw Error("Invalid battle answer");
    battle.answers[question.id] = action.answer;
    return;
  }
  if (action.type !== "book-battle-finish")
    throw Error("Unknown reading action");
  if (!expired && Object.keys(battle.answers).length !== 10)
    throw Error("Battle incomplete");
  const score = battleFor(book).filter(
    (q) => battle.answers[q.id] === q.answer,
  ).length;
  battle.score = score;
  battle.finishedAt = stamp;
  p.bestScore = Math.max(p.bestScore, score);
  // Pay each point once across all attempts, so retries cannot farm rewards.
  for (let point = 1; point <= score; point++)
    reward(`battle-point-${point}`, 5, 1, 0);
  if (score >= PASS_SCORE && !p.certifiedAt) {
    p.certifiedAt = stamp;
    reward("certificate", 50, 20, 5);
  }
  markDay();
}
