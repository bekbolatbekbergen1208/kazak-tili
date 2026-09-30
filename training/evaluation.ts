import { referenceAnswer } from "../lib/friend/knowledge";
import { requestDossha, type ChatMessage } from "../lib/friend/chat";
import {
  formatKnowledgeContext,
  searchDoshaKnowledge,
} from "../lib/dosha/knowledge";
import { doshaChatModel } from "../lib/dosha/config";
import { localAiConfigured } from "../lib/ai/local";
import { kazakhEvaluationCases, type EvaluationCase } from "./evaluation-cases";

export type EvaluationMode = "reference" | "model";
export type EvaluationReply = (input: {
  prompt: string;
  history: ChatMessage[];
}) => Promise<string>;

export async function collectEvaluation(
  cases: EvaluationCase[],
  reply: EvaluationReply,
) {
  const results = [];
  // Sequential requests keep local model memory and concurrency bounded.
  for (const item of cases) {
    const started = Date.now();
    const base = {
      id: item.id,
      category: item.category,
      prompt: item.prompt,
      history: item.history ?? [],
      rubric: item.rubric,
      review: {
        status: "pending" as const,
        criteria: item.rubric.map(() => null as boolean | null),
        notes: "",
      },
    };
    try {
      const answer = await reply({
        prompt: item.prompt,
        history: item.history ?? [],
      });
      if (!answer.trim()) throw Error("EMPTY_REPLY");
      results.push({
        ...base,
        answer,
        error: null,
        durationMs: Date.now() - started,
      });
    } catch {
      // Do not write endpoint credentials or untrusted provider error bodies.
      results.push({
        ...base,
        answer: null,
        error: "REPLY_FAILED",
        durationMs: Date.now() - started,
      });
    }
  }
  return results;
}

export async function runEvaluation({
  mode,
  limit = kazakhEvaluationCases.length,
}: {
  mode: EvaluationMode;
  limit?: number;
}) {
  const model = doshaChatModel();
  if (mode === "model" && !localAiConfigured(model))
    throw Error(
      "Set OLLAMA_BASE_URL and OLLAMA_MODEL before model evaluation.",
    );
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > kazakhEvaluationCases.length
  )
    throw Error(`Limit must be between 1 and ${kazakhEvaluationCases.length}.`);
  const reply: EvaluationReply =
    mode === "reference"
      ? async ({ prompt, history }) => referenceAnswer(prompt, history).reply
      : async ({ prompt, history }) =>
          requestDossha({
            key: "",
            model,
            message: prompt,
            history,
            language: "kk",
            context: formatKnowledgeContext(searchDoshaKnowledge(prompt)),
          });
  const results = await collectEvaluation(
    kazakhEvaluationCases.slice(0, limit),
    reply,
  );
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    mode,
    model: mode === "model" ? model : null,
    description:
      "Held-out review tasks. Generation success is not a quality score. All answers require manual rubric review.",
    summary: {
      attempted: results.length,
      generated: results.filter((row) => row.answer !== null).length,
      failed: results.filter((row) => row.error !== null).length,
      reviewed: 0,
    },
    results,
  };
}
