export type InterfaceLanguage = "ru" | "en";
export type LearningGoal = "tourism" | "work" | "study" | "daily" | "books";
export type Localized = Record<InterfaceLanguage, string>;
export type UserProfile = {
  nickname: string;
  language: InterfaceLanguage;
  goal: LearningGoal;
  onboarded: boolean;
  animations: boolean;
  avatar: string;
  theme: string;
};
export type ExerciseOption = { id: string; text: string | Localized };
export type ExerciseKind =
  | "choice"
  | "sentence"
  | "match"
  | "gap"
  | "situation"
  | "listening"
  | "speaking"
  | "flashcard"
  | "order"
  | "correction"
  | "dialogue"
  | "timed"
  | "open";
export type Exercise = {
  id: string;
  kind: ExerciseKind;
  prompt: Localized;
  answer: string;
  options?: ExerciseOption[];
  explanation: Localized;
  translation: Localized;
  example: string;
  audio?: string;
  words?: string[];
  pairs?: { kk: string; translation: Localized }[];
};
export type Lesson = {
  id: string;
  goal: LearningGoal;
  sectionId: string;
  title: Localized;
  exercises: Exercise[];
  kind: "lesson" | "game" | "review" | "test";
  bookId?: string;
};
export type Section = { id: string; title: Localized; lessonIds: string[] };
export type Course = {
  id: LearningGoal;
  title: Localized;
  description: Localized;
  icon: string;
  sections: Section[];
  topics: Localized[];
};
export type LessonProgress = {
  status: "started" | "completed" | "perfect";
  answers: Record<string, string>;
  firstAnswers: Record<string, string>;
  completedAt?: string;
  correct: number;
};
export type UserMistake = {
  exerciseId: string;
  lessonId: string;
  count: number;
  resolved: boolean;
};
export type XPTransaction = {
  id: string;
  amount: number;
  reason: string;
  date: string;
};
export type CoinTransaction = XPTransaction;
export type UserStreak = {
  current: number;
  best: number;
  lastDay: string | null;
  days: string[];
};
export type Achievement = { id: string; title: Localized; icon: string };
export type UserAchievement = { achievementId: string; date: string };
export type DailyQuest = {
  id: string;
  title: Localized;
  target: number;
  reward: number;
  metric: "lessons" | "words" | "combo" | "reviews" | "dialogues";
};
export type UserQuestProgress = {
  lessons: number;
  words: number;
  combo: number;
  reviews: number;
  dialogues: number;
  claimed: string[];
};
export type League = "Қола" | "Күміс" | "Алтын" | "Гауһар";
export type LeagueParticipant = {
  nickname: string;
  avatar: string;
  level: number;
  xp: number;
  demo?: boolean;
};
export type BookChapter = { id: string; title: Localized; summary: Localized };
export type BookQuestion = Exercise;
export type BookQuiz = { bookId: string; lessonId: string };
export type Book = {
  id: string;
  title: string;
  author: string;
  summary: Localized;
  characters: { name: string; description: Localized }[];
  events: Localized[];
  vocabulary: { kk: string; translation: Localized }[];
  chapters: BookChapter[];
  quiz: BookQuiz;
  source: string;
};
export type UserProgress = {
  version: 1;
  xp: number;
  coins: number;
  correctAnswers: number;
  combo: number;
  lessons: Record<string, LessonProgress>;
  mistakes: Record<string, UserMistake>;
  achievements: UserAchievement[];
  quests: Record<string, UserQuestProgress>;
  xpTransactions: XPTransaction[];
  coinTransactions: CoinTransaction[];
  streak: UserStreak;
  inventory: string[];
};
export type LearningState = { profile: UserProfile; progress: UserProgress };
export type LearningAction =
  | { type: "profile"; profile: UserProfile }
  | { type: "start"; lessonId: string }
  | { type: "answer"; lessonId: string; exerciseId: string; answer: string }
  | { type: "finish"; lessonId: string }
  | { type: "review"; exerciseId: string; answer: string }
  | { type: "claim"; questId: string }
  | { type: "buy"; itemId: string };
