import type { Level } from "../q-level/types";
export type Style =
  | "simple"
  | "daily"
  | "academic"
  | "literary"
  | "formal"
  | "friendly"
  | "storytelling";
export const rights = [
  "public_domain",
  "licensed",
  "teacher_created",
  "open_license",
  "short_approved_excerpt",
] as const;
export type Rights = (typeof rights)[number];
export type AgeGroup = "all" | "school" | "adult";
export type CorpusItem = {
  id: string;
  title: string;
  source_type: "educational" | "dictionary" | "literature" | "teacher";
  author: string;
  copyright_status: Rights;
  license: string;
  rights_evidence: string;
  level: Level;
  genre: string;
  style: Style;
  topic: string;
  region: string;
  age_group: AgeGroup;
  text: string;
  keywords: string[];
  approved_by: string | null;
  status: "draft" | "approved" | "rejected";
  created_at: string;
  quality_score: number;
  language_quality: number;
  educational_value: number;
  age_suitability: number;
  revision: number;
};
export type Chunk = {
  id: string;
  corpus_id: string;
  text: string;
  position: number;
  revision: number;
};
export type RetrievalHit = {
  id: string;
  title: string;
  text: string;
  level: Level;
  style: Style;
  author: string;
  copyright_status: Rights;
  source_type: CorpusItem["source_type"];
  score: number;
};
export type LiteraryWord = {
  id: string;
  word: string;
  base: string;
  meaning: string;
  simple: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  forms: string[];
  level: Level;
  related: string[];
};
export type Quality = {
  score: number;
  grammar_score: number;
  naturalness_score: number;
  lexical_richness_score: number;
  level_match_score: number;
  style_match_score: number;
  issues: string[];
  heuristic: true;
};
export type Lesson = {
  id: string;
  corpusId: string;
  title: string;
  level: Level;
  wordIds: string[];
  mainIdea: string;
  expressions: string[];
  grammar: string[];
  styleAnalysis: string;
  characterSpeech: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
  writingTask: string;
};
export type VocabularyEntry = {
  wordId: string;
  source: "dosha" | "vision" | "literature" | "lesson" | "test";
  status: "new" | "learning" | "mastered";
  repetitions: number;
  intervalDays: number;
  dueAt: string;
  savedAt: string;
};
export type LanguageState = {
  version: 1;
  vocabulary: Record<string, VocabularyEntry>;
  lessons: Record<
    string,
    { correct: string[]; writing: string; completedAt?: string }
  >;
  reviews: number;
  writingHistory: { date: string; score: number }[];
  badges: string[];
};
export type LanguageAction =
  | { type: "save-word"; wordId: string; source: VocabularyEntry["source"] }
  | { type: "review-word"; wordId: string; answer: string }
  | {
      type: "literature-answer";
      lessonId: string;
      questionId: string;
      answer: string;
    }
  | { type: "literature-writing"; lessonId: string; text: string }
  | { type: "literature-finish"; lessonId: string };
