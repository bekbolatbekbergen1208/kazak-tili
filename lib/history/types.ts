import type { Point } from "../travel/types";
export type HistorySource = { title: string; url: string };
export type HistoryObject = {
  id: string;
  title: string;
  kind:
    | "gate"
    | "market"
    | "pottery"
    | "book"
    | "dome"
    | "cauldron"
    | "tile"
    | "wall"
    | "coin";
  point: Point;
  fact: string;
  word: { term: string; meaning: string };
  artifact: string;
  source: number;
};
export type HistoryTask = {
  id: string;
  kind: "choice" | "timeline" | "match" | "route" | "build" | "dialogue";
  title: string;
  prompt: string;
  hint: string;
  explanation: string;
  answer: string;
  options: string[];
  labels?: string[];
  person?: string;
};
export type HistoryCity = {
  id: string;
  name: string;
  subtitle: string;
  era: string;
  point: Point;
  ready: boolean;
  previous?: string;
  icon: string;
  intro: string[];
  sources: HistorySource[];
  objects: HistoryObject[];
  tasks: HistoryTask[];
  people: { name: string; text: string }[];
  reward: {
    xp: number;
    coins: number;
    crystals: number;
    itemId: string;
    itemTitle: string;
  };
  badge: string;
};
export type HistoryCityProgress = {
  visited: boolean;
  intro: boolean;
  position: Point;
  discovered: string[];
  tasks: string[];
  mistakes: Record<string, number>;
  final?: {
    startedAt: string;
    targets: string[];
    found: string[];
    finishedAt?: string;
    passed?: boolean;
  };
  completedAt?: string;
};
export type HistoryProgress = {
  cities: Record<string, HistoryCityProgress>;
  lastCity?: string;
  night: boolean;
};
export type HistoryAction =
  | { type: "history-visit"; cityId: string }
  | { type: "history-intro"; cityId: string }
  | { type: "history-discover"; cityId: string; objectId: string }
  | { type: "history-answer"; cityId: string; taskId: string; answer: string }
  | { type: "history-final-start"; cityId: string }
  | { type: "history-final-find"; cityId: string; objectId: string }
  | { type: "history-final-finish"; cityId: string }
  | { type: "history-position"; cityId: string; point: Point }
  | { type: "history-night"; night: boolean };
