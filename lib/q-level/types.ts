export const levels = ["A0", "A1", "A2", "B1", "B2", "C1"] as const;
export type Level = (typeof levels)[number];
export const skills = [
  "listening",
  "reading",
  "vocabulary",
  "grammar",
  "writing",
  "speaking",
] as const;
export type Skill = (typeof skills)[number];
export const labels: Record<Skill, string> = {
  listening: "Тыңдалым",
  reading: "Оқылым",
  vocabulary: "Сөздік қор",
  grammar: "Грамматика",
  writing: "Жазылым",
  speaking: "Айтылым",
};
export type QuestionType =
  | "single-choice"
  | "multiple-choice"
  | "matching"
  | "ordering"
  | "fill-blank"
  | "short-answer"
  | "audio"
  | "writing"
  | "speaking";
export type Question = {
  id: string;
  skill: Skill;
  level: Level;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer?: string | string[];
  explanation?: string;
  audio_url?: string;
  text_content?: string;
  difficulty: number;
  tags: string[];
};
export type PublicQuestion = Omit<
  Question,
  "correct_answer" | "explanation" | "text_content"
> & { text_content?: string };
export type Answer = {
  questionId: string;
  value: string;
  correct: boolean | null;
  responseTime: number;
  difficulty: number;
  skill: Skill;
};
export type SkillResult = {
  score: number | null;
  level: Level;
  count: number;
  confidence: number;
};
export type Result = {
  id: string;
  score: number;
  level: Level;
  confidence: number;
  skills: Record<Skill, SkillResult>;
  date: string;
  previousScore: number | null;
  type: "quick" | "full" | "beginner";
  pending: boolean;
  feedback: string[];
};
export type Attempt = {
  id: string;
  type: "quick" | "full";
  startedAt: string;
  updatedAt: string;
  ability: number;
  answers: Answer[];
  questionId: string | null;
  completed: boolean;
  result?: Result;
  lessonsAtStart: number;
};
export type Snapshot = { attempt: Attempt | null; history: Result[] };

export type Review = {
  question: string;
  answer: string;
  correct: boolean | null;
  explanation: string;
};
