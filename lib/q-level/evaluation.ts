import type { Level, SkillResult } from "./types";
// Evaluation services must supply rubric evidence; text length is never a proficiency score.
export type Rubric = {
  taskCompletion: number;
  vocabulary: number;
  grammar: number;
  coherence: number;
  clarity: number;
  fluency?: number;
  pronunciation?: number;
};
export type EvaluationRequest = {
  attemptId: string;
  skill: "writing" | "speaking";
  prompt: string;
  estimatedLevel: Level;
  text: string;
  privateAudioPath?: string;
};
export type EvaluationResponse =
  | { status: "pending" }
  | {
      status: "evaluated";
      result: SkillResult;
      rubric: Rubric;
      feedback: string[];
      modelVersion: string;
      reviewed: boolean;
    };
export interface EvaluationProvider {
  evaluate(request: EvaluationRequest): Promise<EvaluationResponse>;
}
export const pendingEvaluator: EvaluationProvider = {
  async evaluate() {
    return { status: "pending" };
  },
};
