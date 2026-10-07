import type { Exercise, LearningGoal, Lesson, Localized } from "../types";
export type WordEntry = {
  id?: string;
  kk: string;
  ru: string;
  en: string;
  meaning: string;
  example: string;
  forms?: string[];
};
export type EditorialRow = {
  slug: string;
  title: string;
  level: "A1" | "A2" | "B1" | "B2";
  objective: string;
  explanation: string;
  text: string;
  words: [string, string, string, string, string, string];
  question: string;
  choices: [string, string, string];
  reason: string;
  gap: [string, string, string?];
  sentence: string;
  dialogue: [string, string, string, string];
  practice: string;
  practiceAnswer: string;
  targets: string[];
  regionId?: string;
  mode?: "match" | "dialogue" | "sequence";
  steps?: [string, string, string];
  sources?: string[];
};
export type EditorialBatch = {
  id: string;
  title: string;
  goal: LearningGoal;
  rows: EditorialRow[];
  independent?: boolean;
};
const l = (s: string): Localized => ({ ru: s, en: s });
export function wordEntry(row: string): WordEntry {
  const [kk, ru, en, meaning, example, forms] = row.split("|");
  return { kk, ru, en, meaning, example, forms: forms?.split(",") };
}
export const visibleLessons = (list: Lesson[]) =>
  list.filter((x) => x.status === undefined || x.status === "published");
export function buildBatch(batch: EditorialBatch): Lesson[] {
  return batch.rows.map((r, i) => {
    const previous = batch.rows
      .slice(0, i)
      .filter((x) => x.level === r.level)
      .at(-1);
    const id = `${batch.goal}-content-${r.slug}`,
      vocab = r.words.map((w, index) => ({
        ...wordEntry(w),
        id: `content:${id}:${index}`,
      })),
      objective = r.objective;
    const ex = (
      suffix: string,
      e: Omit<Exercise, "id" | "objective" | "hint">,
    ): Exercise => ({
      id: `${id}-${suffix}`,
      objective,
      hint: l(r.explanation),
      ...e,
    });
    const reading = ex("read", {
      kind: "situation",
      prompt: l(`${r.question}\nЖауапты оқу мәтініне сүйеніп таңда.`),
      options: r.choices.map((text, j) => ({ id: String(j), text })),
      answer: "0",
      explanation: l(r.reason),
      translation: l(r.text),
      example: r.choices[0],
    });
    const gap = ex("gap", {
      kind: "gap",
      prompt: l(r.gap[0]),
      answer: r.gap[1],
      acceptedAnswers: r.gap[2]?.split("/"),
      explanation: l(`${r.gap[1]} — осы сөйлемге сай нұсқа. ${r.explanation}`),
      translation: l(r.gap[0]),
      example: r.sentence,
    });
    const sentence = ex("sentence", {
      kind: "sentence",
      prompt: l("Сөздерден мағынасы түсінікті сөйлем құра."),
      words: r.sentence.replace(/[.!?]/g, "").split(" ").reverse(),
      answer: r.sentence,
      explanation: l(`Үлгі: ${r.sentence} ${r.explanation}`),
      translation: l(r.sentence),
      example: r.sentence,
    });
    const interaction =
      r.mode === "match"
        ? ex("match", {
            kind: "match",
            prompt: l("Сөзді осы сабақтағы мағынасымен сәйкестендір."),
            pairs: vocab
              .slice(0, 3)
              .map((w) => ({ kk: w.kk, translation: { ru: w.ru, en: w.en } })),
            answer: "0,1,2",
            explanation: l(
              vocab
                .slice(0, 3)
                .map((w) => `${w.kk}: ${w.meaning}`)
                .join(" "),
            ),
            translation: l(r.title),
            example: r.sentence,
          })
        : r.mode === "sequence" && r.steps
          ? ex("sequence", {
              kind: "order",
              prompt: l("Іс-әрекетті мәтіндегі ретімен орналастыр."),
              options: r.steps.map((text, j) => ({ id: String(j), text })),
              answer: "0 1 2",
              explanation: l(r.steps.join(" → ")),
              translation: l(r.title),
              example: r.sentence,
            })
          : ex("dialogue", {
              kind: "dialogue",
              prompt: l("Осы жағдайға сәйкес келесі жауапты таңда."),
              dialogueCue: r.dialogue[0],
              options: r.dialogue
                .slice(1)
                .map((text, j) => ({ id: String(j), text })),
              answer: "0",
              explanation: l(
                `Бұл жауап сұрақтың мақсатына сай: ${r.dialogue[1]}`,
              ),
              translation: l(r.dialogue[0]),
              example: r.dialogue[1],
            });
    const application = ex("apply", {
      kind: "open",
      prompt: l(r.practice),
      answer: r.practiceAnswer,
      response: { minWords: 3, targetWords: r.targets },
      explanation: l(
        `Өз жауабыңды үлгімен салыстыр: ${r.practiceAnswer} Автоматты тексеру сөз саны мен мақсатты тіркестің қолданылуын ғана тексереді; барлық грамматикалық қатені бағаламайды.`,
      ),
      translation: l(r.practice),
      example: r.practiceAnswer,
    });
    return {
      id,
      slug: r.slug,
      goal: batch.goal,
      sectionId: `${batch.id}-${r.level.toLowerCase()}`,
      title: l(r.title),
      kind: "lesson",
      level: r.level,
      topic: batch.title,
      order: batch.rows.slice(0, i + 1).filter((x) => x.level === r.level)
        .length,
      status: "published",
      minutes: r.level === "A1" ? 8 : 10,
      objective,
      prerequisites:
        batch.independent || !previous
          ? []
          : [`${batch.goal}-content-${previous.slug}`],
      vocabulary: vocab,
      introduction: r.text,
      explanation: r.explanation,
      dialogue: [
        { speaker: "Досша", text: r.dialogue[0] },
        { speaker: "Оқушы", text: r.dialogue[1] },
      ],
      reviewWords: vocab.map((w) => w.kk),
      regionId: r.regionId,
      sources: r.sources,
      exercises: [reading, gap, sentence, interaction, application],
    };
  });
}
