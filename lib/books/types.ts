export type ReadingLevel = "easy" | "medium" | "advanced";
export type ReadingBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  level: ReadingLevel;
  icon: string;
  color: string;
  theme: string;
  summary: string;
  source: string;
  characters: { name: string; description: string; voice: string }[];
  chapters: { title: string; text: string }[];
  vocabulary: { word: string; meaning: string }[];
  reflection: string;
};
export type ReadingTask = {
  id: string;
  kind:
    | "character"
    | "order"
    | "truth"
    | "match"
    | "speaker"
    | "gap"
    | "map"
    | "ending"
    | "opinion";
  title: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
};
export type BattleQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};
export type ReadingRecord = {
  chapters: number[];
  answers: Record<string, string>;
  completed: string[];
  battle?: {
    startedAt: string;
    order: string[];
    answers: Record<string, string>;
    finishedAt?: string;
    score?: number;
  };
  bestScore: number;
  certifiedAt?: string;
};
export type ReadingProgress = {
  books: Record<string, ReadingRecord>;
  days: string[];
};
export type ReadingAction =
  | { type: "book-read"; bookId: string; chapter: number }
  | { type: "book-answer"; bookId: string; taskId: string; answer: string }
  | { type: "book-battle-start"; bookId: string }
  | {
      type: "book-battle-answer";
      bookId: string;
      questionId: string;
      answer: string;
    }
  | { type: "book-battle-finish"; bookId: string };
