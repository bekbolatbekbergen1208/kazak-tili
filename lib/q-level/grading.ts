import type { Question } from "./types";
const normalize = (s: string) =>
  s
    .normalize("NFC")
    .toLocaleLowerCase("kk-KZ")
    .trim()
    .replace(/[.!?,;:]+$/, "")
    .replace(/\s+/g, " ");
export function answerValue(q: Question): string {
  return Array.isArray(q.correct_answer)
    ? JSON.stringify(q.correct_answer)
    : String(q.correct_answer ?? "");
}
export function gradeQuestion(q: Question, value: string): boolean | null {
  if (
    q.type === "writing" ||
    q.type === "speaking" ||
    (q.skill === "listening" && value === "__SKIP__")
  )
    return null;
  if (
    q.type === "multiple-choice" ||
    q.type === "matching" ||
    q.type === "ordering"
  ) {
    let selected: unknown;
    try {
      selected = JSON.parse(value);
    } catch {
      throw Error("Жауап пішімі дұрыс емес.");
    }
    if (
      !Array.isArray(selected) ||
      selected.length > 30 ||
      selected.some((x) => typeof x !== "string" || !q.options?.includes(x))
    )
      throw Error("Жауап нұсқаларын тексеріңіз.");
    if (
      q.type === "multiple-choice" &&
      new Set(selected).size !== selected.length
    )
      throw Error("Қайталанған жауап.");
    if (
      q.type === "ordering" &&
      (selected.length !== q.options?.length ||
        new Set(selected).size !== selected.length)
    )
      throw Error("Барлық элементті реттеңіз.");
    const expected = Array.isArray(q.correct_answer) ? q.correct_answer : [];
    const a = q.type === "multiple-choice" ? [...selected].sort() : selected;
    const b = q.type === "multiple-choice" ? [...expected].sort() : expected;
    return JSON.stringify(a) === JSON.stringify(b);
  }
  if (q.options && !q.options.includes(value)) throw Error("Жауапты таңдаңыз.");
  if (!value.trim()) throw Error("Жауап жазыңыз.");
  return normalize(value) === normalize(String(q.correct_answer ?? ""));
}
