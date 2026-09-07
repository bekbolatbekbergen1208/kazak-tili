import test from "node:test";
import assert from "node:assert/strict";
import {
  courses,
  exerciseById,
  lessons,
  quests,
} from "../lib/learning/content";
import {
  accessible,
  applyAction,
  initialState,
  isCorrect,
  levelFor,
  weeklyXP,
} from "../lib/learning/state";
import type { LearningState } from "../lib/learning/types";
const date = new Date("2026-09-07T12:00:00Z");
function ready() {
  const s = initialState();
  return applyAction(
    s,
    { type: "profile", profile: { ...s.profile, onboarded: true } },
    date,
  );
}
function finish(s: LearningState, id: string, now = date) {
  s = applyAction(s, { type: "start", lessonId: id }, now);
  for (const e of lessons.find((l) => l.id === id)!.exercises)
    s = applyAction(
      s,
      { type: "answer", lessonId: id, exerciseId: e.id, answer: e.answer },
      now,
    );
  return applyAction(s, { type: "finish", lessonId: id }, now);
}
test("content covers all goals, sections, languages, kinds and unique IDs", () => {
  const ids = lessons.flatMap((l) => l.exercises.map((e) => e.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const c of courses) {
    assert.ok(lessons.filter((l) => l.goal === c.id).length >= 2);
    for (const s of c.sections)
      assert.ok(s.lessonIds.length >= 5 && s.lessonIds.length <= 10);
  }
  for (const l of lessons) {
    assert.ok(l.exercises.length >= 5);
    for (const e of l.exercises) {
      assert.ok(
        e.prompt.ru && e.prompt.en && e.explanation.ru && e.explanation.en,
      );
      assert.ok(isCorrect(e, e.answer));
      if (e.options && e.kind !== "order")
        assert.ok(e.options.some((o) => o.id === e.answer));
    }
  }
  assert.equal(
    new Set(lessons.flatMap((l) => l.exercises.map((e) => e.kind))).size,
    13,
  );
});
test("onboarding, locking and incomplete lesson cannot be bypassed", () => {
  assert.throws(() =>
    applyAction(initialState(), { type: "start", lessonId: "tourism-1" }),
  );
  const s = ready();
  assert.equal(accessible(s, "tourism-2"), false);
  assert.throws(() => finish(s, "tourism-2"));
  assert.throws(() =>
    applyAction(s, { type: "finish", lessonId: "tourism-1" }),
  );
});
test("correct lesson awards once, unlocks next, achievements persist", () => {
  let s = finish(ready(), "tourism-1");
  assert.equal(s.progress.xp, 105);
  assert.equal(s.progress.coins, 21);
  assert.equal(accessible(s, "tourism-2"), true);
  assert.equal(s.progress.lessons["tourism-1"].status, "perfect");
  assert.ok(s.progress.achievements.some((a) => a.achievementId === "first"));
  assert.deepEqual(
    applyAction(s, { type: "finish", lessonId: "tourism-1" }, date),
    s,
  );
  s = finish(s, "tourism-2");
  assert.ok(levelFor(s.progress.xp) >= 2);
});
test("wrong answer is retained for review, retry does not earn first-try XP", () => {
  let s = ready();
  s = applyAction(
    s,
    {
      type: "answer",
      lessonId: "tourism-1",
      exerciseId: "tourism-1-meaning",
      answer: "wrong",
    },
    date,
  );
  s = finish(s, "tourism-1");
  assert.equal(s.progress.lessons["tourism-1"].status, "completed");
  assert.equal(s.progress.lessons["tourism-1"].correct, 4);
  assert.equal(s.progress.mistakes["tourism-1-meaning"].resolved, false);
  s = applyAction(
    s,
    { type: "review", exerciseId: "tourism-1-meaning", answer: "correct" },
    date,
  );
  assert.equal(s.progress.mistakes["tourism-1-meaning"].resolved, true);
  assert.throws(() =>
    applyAction(
      s,
      { type: "review", exerciseId: "tourism-1-meaning", answer: "correct" },
      date,
    ),
  );
});
test("day streak, gaps and week boundaries", () => {
  let s = finish(ready(), "tourism-1", new Date("2026-09-06T12:00:00Z"));
  s = finish(s, "tourism-2", date);
  assert.equal(s.progress.streak.current, 2);
  assert.ok(weeklyXP(s, date) < s.progress.xp);
  s = finish(s, "tourism-3", new Date("2026-09-09T12:00:00Z"));
  assert.equal(s.progress.streak.current, 1);
  assert.equal(s.progress.streak.best, 2);
});
test("quests cannot be claimed early or twice, purchases cannot overdraw", () => {
  let s = ready();
  assert.throws(() =>
    applyAction(s, { type: "claim", questId: quests[0].id }, date),
  );
  assert.throws(() => applyAction(s, { type: "buy", itemId: "scarf" }, date));
  s = finish(finish(s, "tourism-1"), "tourism-2");
  s = applyAction(s, { type: "claim", questId: "lessons" }, date);
  assert.throws(() =>
    applyAction(s, { type: "claim", questId: "lessons" }, date),
  );
  s = applyAction(s, { type: "buy", itemId: "scarf" }, date);
  assert.ok(s.progress.inventory.includes("scarf"));
  assert.throws(() => applyAction(s, { type: "buy", itemId: "scarf" }, date));
});
test("all 45 lessons complete and goals preserve progress", () => {
  let s = ready();
  for (const c of courses) {
    s = applyAction(
      s,
      {
        type: "profile",
        profile: { ...s.profile, goal: c.id, language: "en" },
      },
      date,
    );
    for (const section of c.sections)
      for (const id of section.lessonIds) s = finish(s, id);
  }
  assert.equal(
    Object.values(s.progress.lessons).filter((l) => l.completedAt).length,
    45,
  );
  assert.ok(s.progress.achievements.some((a) => a.achievementId === "books"));
  assert.ok(exerciseById("books-2-5"));
});
