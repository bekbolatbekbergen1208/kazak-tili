export type Point = { x: number; y: number };
export type TravelSettings = {
  sound: boolean;
  animation: "full" | "light" | "off";
  follow: boolean;
  introSeen: boolean;
};
export type TravelProgress = {
  regions: Record<string, RegionProgress>;
  lastRegion?: string;
  camera?: { center: Point; zoom: number };
  settings: TravelSettings;
  achievements: string[];
  announced: string[];
};
export type RegionProgress = {
  visited: boolean;
  sectionsViewed: string[];
  objectsExplored: string[];
  vocabularyLearned: string[];
  gameResults: Partial<Record<"quiz" | "matching" | "sentence", number>>;
  quizBestScore: number;
  correctIds: string[];
  xpEarned: number;
  stampUnlocked: boolean;
  completedAt?: string;
};
export type TravelAction =
  | { type: "travel-visit"; regionId: string }
  | { type: "travel-section"; regionId: string; sectionId: string }
  | { type: "travel-object"; regionId: string; objectId: string }
  | { type: "travel-word"; regionId: string; wordId: string; answer: string }
  | {
      type: "travel-game";
      regionId: string;
      game: "quiz" | "matching" | "sentence";
      answers: string[];
    }
  | { type: "travel-settings"; settings: TravelSettings }
  | { type: "travel-camera"; center: Point; zoom: number }
  | { type: "travel-announce"; id: string };
export type Word = {
  id: string;
  kk: string;
  ru: string;
  en: string;
  definition: string;
  example: string;
  icon: string;
};
export type Source = { title: string; url: string };
export type Card = {
  id: string;
  title: string;
  text: string;
  icon: string;
  wordId?: string;
  source?: string;
  status?: string;
};
export type Question = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  topic?: "history";
};
export type Region = {
  id: string;
  slug: string;
  nameKk: string;
  nameRu: string;
  nameEn: string;
  type: "region" | "city";
  capital?: string;
  coordinates: Point;
  mapFeatureId: string;
  theme: "sea" | "steppe" | "mountain" | "city" | "desert";
  shortDescription: string;
  nature: Card[];
  animals: Card[];
  plants: Card[];
  history: Card[];
  landmarks: Card[];
  culture: Card[];
  foods: Card[];
  famousPeople: Card[];
  resources: Card[];
  industries: Card[];
  agriculture: Card[];
  importance: Card[];
  interestingFacts: string[];
  vocabulary: Word[];
  games: { quiz: Question[]; matching: string[]; sentence: string[] };
  mapObjects: (Card & {
    type: "animal" | "plant" | "history" | "industry";
    coordinates: Point;
    minZoom: number;
  })[];
  ambientAnimations: string[];
  stamp: string;
  sources: Source[];
  contentStatus: "ready" | "partial";
  missingContent: string[];
};
export const coreSections = [
  "nature",
  "animals",
  "history",
  "landmarks",
  "culture",
  "industry",
  "importance",
] as const;
export const sectionNames: Record<string, string> = {
  nature: "Табиғат пен өсімдіктер",
  animals: "Жануарлар",
  history: "Тарих пен тұлғалар",
  landmarks: "Көрікті жерлер",
  culture: "Мәдениет пен ас мәзірі",
  industry: "Еңбек пен өндіріс",
  importance: "Ел үшін маңызы",
};
