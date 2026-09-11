export type VisionCategory =
  "Мектеп" | "Үй" | "Ас үй" | "Табиғат" | "Көлік" | "Технология" | "Киім";
export type VisionWord = {
  id: string;
  kk: string;
  plural: string;
  ru: string;
  en: string;
  pronunciation: string;
  easy: string;
  medium: string;
  category: VisionCategory;
  xp: number;
  aliases: string[];
};
export type VisionProgress = {
  words: Record<
    string,
    { foundAt: string; sentence?: string; tasks: string[] }
  >;
  days: string[];
  badges: string[];
};
export type VisionAction =
  | { type: "vision-found"; wordId: string }
  | { type: "vision-answer"; wordId: string; task: string; answer: string };
