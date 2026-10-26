import test from "node:test";
import assert from "node:assert/strict";
import { questionBank } from "../lib/q-level/questions";
import { assessmentSources, methodologyVersion } from "../lib/q-level/methodology";
import { startAttempt, getQuestion, submitAnswer, publicQuestion } from "../lib/q-level/engine";
import { resultDocument } from "../lib/q-level/report";
test("active items have traceable pilot mappings without claiming C1 or exposing answer keys", () => {
  const sourceIds = new Set<string>(assessmentSources.map(s => s.id));
  for (const q of questionBank.filter(q => q.skill !== "listening")) {
    assert.ok(q.alignment?.objective);
    assert.equal(q.alignment?.status, "pilot-unvalidated");
    assert.equal(q.alignment?.targetBand, q.level);
    assert.ok(q.alignment?.sourceIds.every(id => sourceIds.has(id)));
    assert.notEqual(q.level, "C1");
    assert.ok(!("correct_answer" in publicQuestion(q)));
  }
});
test("new results and documents identify methodology and uncalibrated score limits", () => {
  let attempt = startAttempt("quick");
  while (!attempt.completed) { const q = getQuestion(attempt)!; attempt = submitAnswer(attempt, String(q.correct_answer), 2); }
  const r = attempt.result!;
  assert.equal(r.methodologyVersion, methodologyVersion);
  assert.equal(r.scoreModel, "heuristic-v1");
  assert.notEqual(r.level, "C1");
  const html = resultDocument(r);
  assert.ok(html.includes("статистикалық сенімділік емес"));
  assert.ok(html.includes(methodologyVersion));
  for (const source of assessmentSources) assert.ok(html.includes(source.url.replace(/&/g,"&amp;")));
});
test("an older in-flight attempt keeps its published item version", () => {
  const legacy = { ...startAttempt("quick"), methodologyVersion: undefined, questionId: "q-9" };
  assert.equal(getQuestion(legacy)!.level, "C1");
  const current = { ...legacy, methodologyVersion };
  assert.equal(getQuestion(current)!.level, "B2");
});
