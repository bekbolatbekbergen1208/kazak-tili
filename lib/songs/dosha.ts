import { songLesson, songLessons, songTopics, roboticsWords } from "./content";
import { repairNaturalness, schoolUnsafe } from "../literary/quality";
import type { SongLevel, SongWord } from "./types";
export function songContext(id: string, level?: string) {
  const l = songLesson(id);
  if (!l) throw Error("Ән сабағы табылмады.");
  return `Әнмен үйрен: ${l.title}; сабақ деңгейі ${l.level}; оқушының таңдауы ${level ?? l.level} (ресми бағалау емес). Негізгі сөздер: ${l.words.map((w) => w.word).join(", ")}. Сұрақтар: ${l.questions.join(" ")}. Оқушының соңғы жауабын жылы түсіндір. Қате байқалса, бастапқы мағынаны сақтаған дұрыс нұсқаны бер; бір жаңа мысал мен келесі қысқа сұрақ ұсын. Толық грамматика немесе кәсіби айтылым бағасы туралы мәлімдеме жасама.`;
}
export function songFeedback(id: string, text: string) {
  const l = songLesson(id)!;
  const improved = repairNaturalness(text).text;
  const changed = improved !== text;
  return `Рақмет, өз ойыңды жеткіздің!\n${changed ? `Табиғи нұсқа: ${improved}` : `Сенің сөйлемің: ${text}`}\n${changed ? "Кейбір тіркесті қазақша табиғи үлгіге келтірдім." : "Анықтамалық режим барлық грамматикалық қатені бағаламайды. Құрылымды үлгімен салыстыр."}\nҚосымша мысал: ${l.words[0].example}\n${l.questions[1]}`;
}
export type GeneratedSong = {
  title: string;
  lines: string[];
  words: SongWord[];
  exercises: {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
  mode: "ai" | "reference";
  notice: string;
};
export function parseSongInput(value: unknown): {
  topic: string;
  text: string;
  level: SongLevel;
} {
  if (!value || typeof value !== "object") throw Error("Мәтін енгіз.");
  const b = value as Record<string, unknown>;
  if (
    typeof b.topic !== "string" ||
    !songTopics.includes(b.topic) ||
    typeof b.text !== "string" ||
    b.text.length > 1200 ||
    schoolUnsafe(b.text)
  )
    throw Error("Тақырыпты таңдап, мектеп жасына сай мәтін енгіз.");
  const lines = b.text
    .trim()
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    lines.length < 3 ||
    lines.length > 4 ||
    lines.some((l) => (l.match(/\p{L}+/gu)?.length ?? 0) < 2)
  )
    throw Error("Өзің туралы 3–4 толық сөйлем жаз.");
  return {
    topic: b.topic,
    text: b.text.trim(),
    level: ["A1", "A2", "B1"].includes(String(b.level))
      ? (b.level as SongLevel)
      : "A1",
  };
}
export function buildGenerated(
  topic: string,
  text: string,
  level: SongLevel,
  aiLines?: unknown,
): GeneratedSong {
  const original = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ok =
    Array.isArray(aiLines) &&
    aiLines.length >= 4 &&
    aiLines.length <= 8 &&
    aiLines.every(
      (l) =>
        typeof l === "string" &&
        l.length >= 3 &&
        l.length < 180 &&
        !schoolUnsafe(l),
    );
  const lines = ok
    ? (aiLines as string[])
    : [...original, "Бірге қазақша үйренейік!", "Жаңа сөзді күнде қолданайық!"];
  const relevant =
    topic === "Отбасым"
      ? "otbasy"
      : topic === "Арманым"
        ? "arman"
        : topic === "Саяхат" || topic === "Менің қалам"
          ? "aktau"
          : "kun";
  const pool =
    topic === "Робототехника"
      ? roboticsWords
      : songLessons.find((l) => l.id === relevant)!.words;
  const words = pool.filter((w) =>
    w.forms.some((f) =>
      lines.join(" ").toLowerCase().includes(f.toLowerCase()),
    ),
  );
  const selected = words.length ? words.slice(0, 6) : pool.slice(0, 3);
  const first = selected[0];
  return {
    title: `${topic} · ${level}`,
    lines,
    words: selected,
    exercises: [
      {
        prompt: `«${first.word}» сөзінің мағынасы қандай?`,
        options: pool.slice(0, 3).some((w) => w.id === first.id)
          ? pool.slice(0, 3).map((w) => w.ru)
          : [
              first.ru,
              ...pool
                .filter((w) => w.id !== first.id)
                .slice(0, 2)
                .map((w) => w.ru),
            ],
        answer: first.ru,
        explanation: first.example,
      },
      {
        prompt: "Өз мәтініңдегі бірінші сөйлемді тап.",
        options: [
          original[0],
          "Мен бүгін теңізге бармадым.",
          "Бүгін сағатым жоғалды.",
        ].filter((v, i, a) => a.indexOf(v) === i),
        answer: original[0],
        explanation: "Бұл сөйлемді өзің жаздың. Енді оны дауыстап оқып көр.",
      },
    ],
    mode: ok ? "ai" : "reference",
    notice: ok
      ? "Досша ұсынған жаңа оқу мәтіні. Мағынасын өз ақпаратыңмен салыстыр. Әуені бар аудио жасалған жоқ."
      : "Анықтамалық үлгі: өз сөйлемдерің сақталды, оқу қайырмасы қосылды. Сөздер — осы тақырыпқа арналған қосымша сөздік. Әуені бар аудио жасалған жоқ.",
  };
}
