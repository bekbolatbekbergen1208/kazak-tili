import type { LanguageAction, LanguageState } from "./types";
import { findWord } from "./words";
import { literatureLessons } from "./corpus";
export function initialLanguageState(): LanguageState {
  return {
    version: 1,
    vocabulary: {},
    lessons: {},
    reviews: 0,
    writingHistory: [],
    badges: [],
  };
}
export const normalize = (s: string) =>
  s
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("kk-KZ")
    .replace(/[.!?,;:]+$/, "")
    .replace(/\s+/g, " ");
export function applyLanguageAction(
  input: LanguageState,
  action: LanguageAction,
  now = new Date(),
): { state: LanguageState; xp: number; correct?: boolean } {
  const state = structuredClone(input),
    stamp = now.toISOString();
  let xp = 0,
    correct: boolean | undefined;
  if (action.type === "save-word") {
    const word = findWord(action.wordId);
    if (!word) throw Error("Сөз бекітілген сөздікте жоқ.");
    if (
      !["dosha", "vision", "literature", "lesson", "test"].includes(
        action.source,
      )
    )
      throw Error("Сөздің шыққан жерін таңдаңыз.");
    if (!state.vocabulary[word.id])
      state.vocabulary[word.id] = {
        wordId: word.id,
        source: action.source,
        status: "new",
        repetitions: 0,
        intervalDays: 0,
        dueAt: stamp,
        savedAt: stamp,
      };
  } else if (action.type === "review-word") {
    const entry = state.vocabulary[action.wordId],
      word = findWord(action.wordId);
    if (!entry || !word) throw Error("Алдымен сөзді сақта.");
    if (Date.parse(entry.dueAt) > now.getTime())
      throw Error("Бұл сөзді қайталау уақыты әлі келген жоқ.");
    correct = normalize(action.answer) === normalize(word.word);
    entry.repetitions = correct ? entry.repetitions + 1 : 0;
    entry.intervalDays = correct
      ? [1, 3, 7, 14, 30][Math.min(4, entry.repetitions - 1)]
      : 0;
    entry.dueAt = new Date(
      now.getTime() + (correct ? entry.intervalDays * 86400000 : 10 * 60000),
    ).toISOString();
    entry.status = entry.repetitions >= 4 ? "mastered" : "learning";
    state.reviews++;
  } else {
    const lesson = literatureLessons.find((x) => x.id === action.lessonId);
    if (!lesson) throw Error("Оқу мәтіні табылмады.");
    const progress = state.lessons[lesson.id] ?? { correct: [], writing: "" };
    state.lessons[lesson.id] = progress;
    if (progress.completedAt) return { state, xp: 0 };
    if (action.type === "literature-answer") {
      const question = lesson.questions.find((x) => x.id === action.questionId);
      if (!question || !question.options.includes(action.answer))
        throw Error("Жауап нұсқасын таңдаңыз.");
      correct = question.answer === action.answer;
      if (correct && !progress.correct.includes(question.id))
        progress.correct.push(question.id);
    } else if (action.type === "literature-writing") {
      if (typeof action.text !== "string" || action.text.length > 5000)
        throw Error("Жауап 5000 таңбадан аспасын.");
      progress.writing = action.text.trim();
    } else if (action.type === "literature-finish") {
      if (
        lesson.questions.some((q) => !progress.correct.includes(q.id)) ||
        (progress.writing.match(/\p{L}+/gu)?.length ?? 0) < 3
      )
        throw Error(
          "Алдымен сұрақтарға жауап беріп, кемінде 3 сөзден тұратын өз ойыңды жаз.",
        );
      progress.completedAt = stamp;
      xp = 20;
    } else throw Error("Әрекет табылмады.");
  }
  const mastered = Object.values(state.vocabulary).filter(
    (v) => v.status === "mastered",
  ).length;
  const completed = Object.values(state.lessons).filter(
    (v) => v.completedAt,
  ).length;
  const expressions = Object.values(state.vocabulary).filter(
    (v) => v.status === "mastered" && findWord(v.wordId)?.word.includes(" "),
  ).length;
  if (mastered >= 10 && !state.badges.includes("Сөз шебері"))
    state.badges.push("Сөз шебері");
  if (mastered >= 100 && !state.badges.includes("100 жаңа сөз"))
    state.badges.push("100 жаңа сөз");
  if (mastered >= 1000 && !state.badges.includes("1000 сөздік қор"))
    state.badges.push("1000 сөздік қор");
  if (expressions >= 3 && !state.badges.includes("Көркем сөйлеу"))
    state.badges.push("Көркем сөйлеу");
  if (expressions >= 10 && !state.badges.includes("10 тұрақты тіркес"))
    state.badges.push("10 тұрақты тіркес");
  if (completed >= 3 && !state.badges.includes("Әдебиет зерттеушісі"))
    state.badges.push("Әдебиет зерттеушісі");
  return { state, xp, correct };
}
export function languageGrowth(state: LanguageState) {
  return {
    saved: Object.keys(state.vocabulary).length,
    mastered: Object.values(state.vocabulary).filter(
      (v) => v.status === "mastered",
    ).length,
    expressions: Object.values(state.vocabulary).filter(
      (v) => v.status === "mastered" && findWord(v.wordId)?.word.includes(" "),
    ).length,
    texts: Object.values(state.lessons).filter((v) => v.completedAt).length,
    naturalness: state.writingHistory.at(-1)?.score ?? null,
  };
}
