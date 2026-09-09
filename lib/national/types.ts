export type GameKind = "asyk" | "arqan";
export type Stat = "strength" | "accuracy" | "knowledge";
export type Bone = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  out: boolean;
  special: boolean;
};
export type GameSession = {
  id: string;
  kind: GameKind;
  startedAt: string;
  questionAt: string;
  turn: number;
  answered: boolean;
  bonus: boolean;
  correct: number;
  combo: number;
  score: number;
  rope: number;
  bones: Bone[];
  finished: boolean;
};
export type RewardEntry = {
  id: string;
  title: string;
  xp: number;
  coins: number;
  crystals: number;
  date: string;
};
export type GameResult = {
  id: string;
  kind: GameKind;
  score: number;
  won: boolean;
  correct: number;
  date: string;
  reward: RewardEntry;
};
export type NationalProgress = {
  crystals: number;
  stats: Partial<Record<string, Record<Stat, number>>>;
  session: GameSession | null;
  results: GameResult[];
  rewards: RewardEntry[];
  daily: Record<string, { games: number; correct: number; claimed: string[] }>;
  settings: {
    sound: boolean;
    music: boolean;
    light: boolean;
    onboarded: boolean;
  };
};
export type NationalAction =
  | { type: "national-start"; kind: GameKind }
  | { type: "national-answer"; sessionId: string; turn: number; answer: number }
  | {
      type: "national-shot";
      sessionId: string;
      turn: number;
      dx: number;
      dy: number;
    }
  | { type: "national-buy"; itemId: string }
  | { type: "national-upgrade"; stat: Stat }
  | { type: "national-daily"; quest: "play" | "words" | "lesson" }
  | { type: "national-settings"; settings: NationalProgress["settings"] };
