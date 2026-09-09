import test from "node:test";
import assert from "node:assert/strict";
import { initialState, applyAction } from "../lib/learning/state";
import { national, freshNational } from "../lib/national/state";
import { questionFor, questions } from "../lib/national/catalog";
import { initialBones, simulate, step } from "../lib/national/physics";
import { lessonById } from "../lib/learning/content";
function ready() {
  const s = initialState();
  s.profile.onboarded = true;
  s.progress.xp = 210;
  s.progress.national = freshNational();
  return s;
}
const now = new Date("2026-09-09T12:00:00Z");
test("national question bank is broad, valid and has no duplicate prompts", () => {
  assert(questions.length >= 60);
  assert.equal(new Set(questions.map((q) => q.prompt)).size, questions.length);
  for (const question of questions) {
    assert.equal(question.options.length, 3);
    assert(Number.isInteger(question.answer));
    assert(question.answer >= 0 && question.answer < question.options.length);
    assert.equal(new Set(question.options).size, question.options.length);
    assert(question.explanation.length >= 8);
  }
});
test("physics is deterministic, transfers momentum, stops, scores exits, preserves input", () => {
  const input = initialBones(),
    copy = structuredClone(input),
    a = simulate(input, 0, -120);
  assert.deepEqual(input, copy);
  assert.deepEqual(a, simulate(input, 0, -120));
  assert(a.some((b) => b.out));
  assert(a.every((b) => Number.isFinite(b.x) && Number.isFinite(b.y)));
  const touching = [
    { ...input[0], x: 250, y: 220, vx: 4 },
    { ...input[1], x: 280, y: 220 },
  ];
  step(touching);
  assert(touching[1].vx > 0);
});
test("locked game and incomplete session cannot be bypassed", () => {
  const s = ready();
  s.progress.xp = 0;
  assert.throws(() =>
    applyAction(s, { type: "national-start", kind: "arqan" }, now),
  );
  const started = applyAction(s, { type: "national-start", kind: "asyk" }, now);
  assert.throws(() =>
    applyAction(started, { type: "national-start", kind: "asyk" }, now),
  );
  assert.throws(() =>
    applyAction(
      started,
      {
        type: "national-shot",
        sessionId: national(started).session!.id,
        turn: 0,
        dx: 0,
        dy: -120,
      },
      now,
    ),
  );
});
test("asyk validates turns, rejects invalid shots, resumes and rewards once", () => {
  let s = applyAction(ready(), { type: "national-start", kind: "asyk" }, now);
  for (let i = 0; i < 5 && !national(s).session!.finished; i++) {
    const game = national(s).session!,
      answer = {
        type: "national-answer" as const,
        sessionId: game.id,
        turn: game.turn,
        answer: questionFor(game.id, game.turn).answer,
      };
    s = applyAction(s, answer, now);
    assert.throws(() => applyAction(s, answer, now));
    const shot = {
      type: "national-shot" as const,
      sessionId: game.id,
      turn: game.turn,
      dx: 0,
      dy: -120,
    };
    for (const value of [NaN, Infinity, 1000])
      assert.throws(() => applyAction(s, { ...shot, dx: value }, now));
    s = applyAction(JSON.parse(JSON.stringify(s)), shot, now);
    assert.throws(() => applyAction(s, shot, now));
  }
  assert(national(s).session!.finished);
  assert.equal(national(s).results.length, 1);
  assert.equal(national(s).rewards.length, 1);
});
test("arqan correct fast answers beat stats; timeout loses; daily cap and claims are idempotent", () => {
  let s = ready();
  for (let round = 0; round < 4; round++) {
    s = applyAction(
      s,
      { type: "national-start", kind: "arqan" },
      new Date(now.getTime() + round * 100000),
    );
    while (!national(s).session!.finished) {
      const g = national(s).session!;
      s = applyAction(
        s,
        {
          type: "national-answer",
          sessionId: g.id,
          turn: g.turn,
          answer: questionFor(g.id, g.turn).answer,
        },
        new Date(g.questionAt),
      );
    }
    assert(national(s).results.at(-1)!.won);
  }
  assert.equal(national(s).results[3].reward.xp, 0);
  assert.equal(national(s).results[3].reward.crystals, 0);
  s = applyAction(s, { type: "national-daily", quest: "words" }, now);
  assert.throws(() =>
    applyAction(s, { type: "national-daily", quest: "words" }, now),
  );
  s = applyAction(s, { type: "national-start", kind: "arqan" }, now);
  const g = national(s).session!;
  assert.throws(() =>
    applyAction(
      s,
      { type: "national-answer", sessionId: g.id, turn: 0, answer: -1 },
      now,
    ),
  );
  s = applyAction(
    s,
    { type: "national-answer", sessionId: g.id, turn: 0, answer: -1 },
    new Date(now.getTime() + 16000),
  );
  assert.equal(national(s).session!.rope, -23);
});
test("crystal purchases and upgrades debit exact server price, reject duplicates and insufficient balance", () => {
  let s = ready();
  assert.throws(() =>
    applyAction(s, { type: "national-upgrade", stat: "strength" }, now),
  );
  for (const itemId of ["constructor", "toString", "__proto__", "fake"])
    assert.throws(() => applyAction(s, { type: "national-buy", itemId }, now));
  s.progress.national!.crystals = 20;
  s = applyAction(s, { type: "national-upgrade", stat: "strength" }, now);
  assert.equal(national(s).crystals, 17);
  s = applyAction(s, { type: "national-upgrade", stat: "strength" }, now);
  assert.equal(national(s).crystals, 11);
  s = applyAction(s, { type: "national-buy", itemId: "victory-stars" }, now);
  assert.equal(national(s).crystals, 5);
  assert(s.progress.inventory.includes("victory-stars"));
  assert.throws(() =>
    applyAction(s, { type: "national-buy", itemId: "victory-stars" }, now),
  );
  assert.throws(() =>
    applyAction(s, { type: "national-upgrade", stat: "strength" }, now),
  );
});
test("lesson crystals require completion and cannot be farmed by reopening", () => {
  let s = ready();
  const lesson = lessonById("tourism-1")!;
  s = applyAction(s, { type: "start", lessonId: lesson.id }, now);
  assert.throws(() =>
    applyAction(s, { type: "finish", lessonId: lesson.id }, now),
  );
  for (const e of lesson.exercises)
    s = applyAction(
      s,
      {
        type: "answer",
        lessonId: lesson.id,
        exerciseId: e.id,
        answer: e.answer,
      },
      now,
    );
  s = applyAction(s, { type: "finish", lessonId: lesson.id }, now);
  const before = structuredClone(s.progress);
  s = applyAction(s, { type: "finish", lessonId: lesson.id }, now);
  assert.deepEqual(s.progress, before);
  assert.equal(national(s).crystals, 1);
});
