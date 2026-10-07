export const stages = [
  "Тыңда",
  "Түсін",
  "Ойна",
  "Айт",
  "Қолдан",
  "Қайтала",
] as const;
export type SongLevel = "A1" | "A2" | "B1";
export type SongWord = {
  id: string;
  word: string;
  base: string;
  meaning: string;
  ru: string;
  en: string;
  example: string;
  forms: string[];
};
export type SongTask = {
  id: string;
  kind: "gap" | "order" | "match" | "listening";
  prompt: string;
  options: string[];
  answer: string | string[];
  explanation: string;
  wordIds: string[];
  pairs?: { word: string; meaning: string }[];
  line?: number;
};
export type SongLesson = {
  id: string;
  title: string;
  level: SongLevel;
  topic: string;
  tourism?: string[];
  minutes: number;
  objective: string;
  grammar: string;
  lyrics: { text: string; start?: number; end?: number }[];
  audio?: { src: string; license: string };
  words: SongWord[];
  tasks: SongTask[];
  questions: string[];
  speaking: string;
  checks: {
    prompt: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
};
export type SongRecord = {
  stage: number;
  seen: string[];
  answers: Record<
    string,
    { answer: string | string[]; correct: boolean; attempts: number }
  >;
  speech?: string;
  writing?: string;
  checks: number[];
  completedAt?: string;
  updatedAt?: string;
  xp: number;
};
export type SongProgress = {
  lessons: Record<string, SongRecord>;
  level?: SongLevel;
  lastLessonId?: string;
  reviews: Record<
    string,
    {
      wordId: string;
      dueAt: string;
      attempts: number;
      correct: number;
      lastCorrect?: boolean;
      lastReviewedAt?: string;
    }
  >;
  draft?: { topic: string; text: string };
};
export type SongAction =
  | { type: "song-start"; lessonId: string }
  | { type: "song-level"; level: SongLevel }
  | { type: "song-word"; lessonId: string; wordId: string }
  | {
      type: "song-answer";
      lessonId: string;
      taskId: string;
      answer: string | string[];
    }
  | { type: "song-next"; lessonId: string }
  | { type: "song-speech"; lessonId: string; text: string }
  | { type: "song-writing"; lessonId: string; text: string }
  | { type: "song-check"; lessonId: string; index: number; answer: string }
  | { type: "song-finish"; lessonId: string }
  | { type: "song-review"; wordId: string; answer: string }
  | { type: "song-draft"; topic: string; text: string };
