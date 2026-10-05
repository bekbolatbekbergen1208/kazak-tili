import test from "node:test";
import assert from "node:assert/strict";
import {
  adapt,
  calculate,
  getQuestion,
  publicQuestion,
  scoreLevel,
  startAttempt,
  submitAnswer,
} from "../lib/q-level/engine";
import { questionBank } from "../lib/q-level/questions";
import { skills } from "../lib/q-level/types";
test("adaptive quick assessment completes with no duplicate questions; production skills stay unassessed", () => {
  let a = startAttempt("quick");
  const used = new Set<string>();
  for (let i = 0; i < 16; i++) {
    const q = getQuestion(a)!;
    assert.ok(q);
    assert.ok(!used.has(q.id));
    used.add(q.id);
    const safe = publicQuestion(q);
    assert.ok(!("correct_answer" in safe));
    assert.ok(!("explanation" in safe));
    if (q.skill === "listening") assert.ok(!("text_content" in safe));
    a = submitAnswer(a, String(q.correct_answer), 8);
  }
  assert.equal(a.completed, true);
  assert.ok(a.result!.score > 65);
  assert.equal(a.result!.pending, true);
  assert.equal(a.result!.skills.speaking.score, null);
  assert.equal(a.result!.skills.writing.score, null);
  assert.equal(a.result!.skills.speaking.level, "A0");
  assert.ok(a.result!.confidence < 100);
  assert.throws(() => submitAnswer(a, "x", 0));
});
test("one mistake does not lower ability; repeated mistakes do", () => {
  const base = {
    questionId: "q",
    value: "x",
    responseTime: 1,
    difficulty: 2,
    skill: "grammar" as const,
  };
  assert.equal(adapt(2, [{ ...base, correct: false }]), 2);
  assert.ok(
    adapt(2, [
      { ...base, correct: false },
      { ...base, correct: false },
    ]) < 2,
  );
});
test("skill bottleneck caps overall classification", () => {
  const a = startAttempt("quick");
  a.answers = skills.slice(0, 4).flatMap((skill) =>
    Array.from({ length: 4 }, () => ({
      questionId: "q",
      value: "x",
      correct: skill !== "listening",
      responseTime: 1,
      difficulty: skill === "listening" ? 0 : 4,
      skill,
    })),
  );
  const r = calculate(a);
  assert.equal(r.level, "A2");
  assert.ok(r.score >= 65);
});
test("full exam has five stages; no fabricated writing or speaking score", () => {
  let a = startAttempt("full");
  for (let i = 0; i < 22; i++) {
    const q = getQuestion(a)!;
    a = submitAnswer(
      a,
      q.correct_answer === undefined
        ? "Мен қазақ тілін үйреніп жүрмін."
        : String(q.correct_answer),
      9,
    );
  }
  assert.equal(a.completed, true);
  assert.equal(a.answers.length, 22);
  assert.equal(a.result!.skills.writing.score, null);
  assert.equal(a.result!.skills.speaking.score, null);
});
test("unavailable listening can be skipped without being treated as a wrong answer", () => {
  let a = startAttempt("quick");
  assert.equal(getQuestion(a)!.skill, "listening");
  a = submitAnswer(a, "__SKIP__", 10);
  assert.equal(a.answers[0].correct, null);
  assert.equal(calculate(a).skills.listening.score, null);
});
test("question bank validates keys and score boundaries", () => {
  for (const q of questionBank) {
    assert.ok(q.options?.includes(String(q.correct_answer)));
    assert.ok(q.tags.length);
  }
  assert.equal(scoreLevel(24), "A1");
  assert.equal(scoreLevel(25), "A2");
  assert.equal(scoreLevel(45), "B1");
  assert.equal(scoreLevel(65), "B2");
  assert.equal(scoreLevel(85), "C1");
});
import { gradeQuestion } from "../lib/q-level/grading";
import type { Question } from "../lib/q-level/types";
test("reusable grading handles choice sets, matching, ordering and normalized short answers", () => {
  const base: Question = {
    id: "format",
    skill: "reading",
    level: "A2",
    difficulty: 1,
    tags: [],
    question: "Сәйкестендір",
    options: ["кітап", "қалам", "дәптер"],
    type: "multiple-choice",
    correct_answer: ["кітап", "дәптер"],
  };
  assert.equal(gradeQuestion(base, JSON.stringify(["дәптер", "кітап"])), true);
  assert.equal(gradeQuestion(base, JSON.stringify(["кітап"])), false);
  assert.throws(() => gradeQuestion(base, JSON.stringify(["кітап", "кітап"])));
  assert.equal(
    gradeQuestion(
      { ...base, type: "matching" },
      JSON.stringify(["кітап", "дәптер"]),
    ),
    true,
  );
  assert.equal(
    gradeQuestion(
      { ...base, type: "matching" },
      JSON.stringify(["дәптер", "кітап"]),
    ),
    false,
  );
  assert.equal(
    gradeQuestion(
      {
        ...base,
        type: "ordering",
        correct_answer: ["кітап", "қалам", "дәптер"],
      },
      JSON.stringify(["кітап", "қалам", "дәптер"]),
    ),
    true,
  );
  assert.throws(() =>
    gradeQuestion({ ...base, type: "ordering" }, JSON.stringify(["кітап"])),
  );
  assert.equal(
    gradeQuestion(
      {
        ...base,
        type: "short-answer",
        options: undefined,
        correct_answer: "Ақтау",
      },
      " ақтау. ",
    ),
    true,
  );
});
