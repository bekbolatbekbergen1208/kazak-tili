import test from "node:test";
import assert from "node:assert/strict";
import { kazakhEvaluationCases } from "../training/evaluation-cases";
import { collectEvaluation, runEvaluation } from "../training/evaluation";
import {
  kazakhExamples,
  normalizeKazakhQuery,
} from "../lib/dosha/kazakh-examples";
import { dialogueTrainingRows } from "../training/dialogue-rows";

test("held-out tasks are distinct from worked examples and training dialogues", () => {
  const trainingPrompts = new Set(
    [
      ...kazakhExamples.flatMap((example) => example.questions),
      ...dialogueTrainingRows().flatMap((row) =>
        row.messages
          .filter((message) => message.role === "user")
          .map((message) => message.content),
      ),
    ].map(normalizeKazakhQuery),
  );
  const ids = new Set<string>();
  const prompts = new Set<string>();
  for (const item of kazakhEvaluationCases) {
    assert.ok(!ids.has(item.id), item.id);
    ids.add(item.id);
    const normalized = normalizeKazakhQuery(item.prompt);
    assert.ok(!prompts.has(normalized), item.id);
    prompts.add(normalized);
    assert.ok(!trainingPrompts.has(normalized), item.id);
    assert.ok(item.rubric.length >= 2, item.id);
    assert.ok(
      item.rubric.every((criterion) => criterion.trim()),
      item.id,
    );
  }
});

test("evaluation preserves conversation context and leaves quality for manual review", async () => {
  const item = kazakhEvaluationCases.find((entry) => entry.history?.length)!;
  const [result] = await collectEvaluation([item], async (input) => {
    assert.equal(input.prompt, item.prompt);
    assert.deepEqual(input.history, item.history);
    return "Сынақ жауабы";
  });
  assert.equal(result.answer, "Сынақ жауабы");
  assert.equal(result.error, null);
  assert.equal(result.review.status, "pending");
  assert.deepEqual(
    result.review.criteria,
    item.rubric.map(() => null),
  );
});

test("provider errors are redacted and cannot count as generated answers", async () => {
  let count = 0;
  const results = await collectEvaluation(
    kazakhEvaluationCases.slice(0, 3),
    async () => {
      count += 1;
      if (count === 1) throw Error("private endpoint secret");
      return count === 2 ? "  " : "Сынақ жауабы";
    },
  );
  assert.equal(results.length, 3);
  assert.equal(results[0].answer, null);
  assert.equal(results[1].error, "REPLY_FAILED");
  assert.equal(results[2].error, null);
  assert.ok(!JSON.stringify(results).includes("secret"));
});

test("reference evaluation is labeled and never reports a trained model", async () => {
  const report = await runEvaluation({ mode: "reference", limit: 1 });
  assert.equal(report.mode, "reference");
  assert.equal(report.model, null);
  assert.equal(report.summary.attempted, 1);
  assert.equal(report.summary.reviewed, 0);
  await assert.rejects(runEvaluation({ mode: "reference", limit: 0 }), /Limit/);
});
