import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoEvaluationLeakage,
  prepareTextRows,
} from "../training/dataset-quality";
import { kazakhEvaluationCases } from "../training/evaluation-cases";

function row(id: string, group: string, question: string, answer = "Жауап") {
  return {
    id,
    group,
    messages: [
      { role: "system", content: "Нұсқау" },
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ],
  };
}

test("deduplication merges transitive source groups before removing repeated rows", () => {
  const input = [
    row("1", "a", "first"),
    row("2", "b", "first"),
    row("3", "b", "second"),
    row("4", "c", "second"),
    row("5", "c", "third"),
  ];
  const snapshot = JSON.stringify(input);
  const result = prepareTextRows(input);
  assert.equal(result.rows.length, 3);
  assert.equal(result.removedDuplicates, 2);
  assert.deepEqual(
    new Set(result.rows.map((item) => item.group)),
    new Set(["a"]),
  );
  assert.equal(JSON.stringify(input), snapshot);
});

test("alternative answers share a split but neither answer is silently discarded", () => {
  const result = prepareTextRows([
    row("1", "b", "teacher", "ұстаз"),
    row("2", "a", "teacher", "мұғалім"),
  ]);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].group, result.rows[1].group);
  assert.equal(result.removedDuplicates, 0);
});

test("different conversation context does not merge unrelated groups", () => {
  const first = row("1", "a", "Неге?");
  const second = row("2", "b", "Неге?");
  second.messages[0].content = "Басқа контекст";
  const result = prepareTextRows([first, second]);
  assert.notEqual(result.rows[0].group, result.rows[1].group);
});

test("duplicate IDs fail instead of dropping potentially different data", () => {
  assert.throws(
    () => prepareTextRows([row("1", "a", "first"), row("1", "b", "second")]),
    /Duplicate/,
  );
});

test("export rejects held-out prompts even with punctuation and case changes", () => {
  const prompt = kazakhEvaluationCases[0].prompt.toLocaleUpperCase("kk") + "?!";
  assert.throws(
    () => assertNoEvaluationLeakage([row("leak", "a", prompt)]),
    /Held-out/,
  );
  const historyPrompt = kazakhEvaluationCases.find((item) => item.history)
    ?.history?.[0].content;
  assert.ok(historyPrompt);
  assert.throws(
    () => assertNoEvaluationLeakage([row("history-leak", "a", historyPrompt)]),
    /Held-out/,
  );
  assert.doesNotThrow(() =>
    assertNoEvaluationLeakage([row("ok", "a", "Өзге мысал")]),
  );
});
