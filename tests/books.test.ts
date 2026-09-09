import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, initialState } from "../lib/learning/state";
import { battleFor, readingBooks, tasksFor } from "../lib/books/catalog";
import {
  BATTLE_SECONDS,
  readerTitles,
  readingPercent,
  readingStreak,
  recordFor,
  validTask,
} from "../lib/books/state";
import type { LearningState } from "../lib/learning/types";

const book = readingBooks[0];
const now = new Date("2026-09-09T10:00:00Z");
function fresh() {
  const s = initialState();
  s.profile.onboarded = true;
  return s;
}
function ready() {
  let s = fresh();
  for (let chapter = 0; chapter < 3; chapter++)
    s = applyAction(s, { type: "book-read", bookId: book.id, chapter }, now);
  for (const task of tasksFor(book)) {
    const answer =
      task.kind === "map"
        ? JSON.stringify([
            "Ол өте қиялшыл бала",
            "Жақсы адам болғысы келеді",
            "Өз қатесін мойындайды",
            "Мұғалімімен сөйлеседі",
          ])
        : task.kind === "ending"
          ? "Қожа ертең мектепке ерте келді. Ол достарынан кешірім сұрады. Балалар бірге жақсы іс бастады."
          : task.kind === "opinion"
            ? "Мен оның орнында болсам, қателігімді мойындап, достарымнан кешірім сұрар едім."
            : task.answer;
    s = applyAction(
      s,
      { type: "book-answer", bookId: book.id, taskId: task.id, answer },
      now,
    );
  }
  return s;
}
function finish(s: LearningState, correct: number) {
  s = applyAction(s, { type: "book-battle-start", bookId: book.id }, now);
  for (const [i, q] of battleFor(book).entries())
    s = applyAction(
      s,
      {
        type: "book-battle-answer",
        bookId: book.id,
        questionId: q.id,
        answer: i < correct ? q.answer : q.options.find((o) => o !== q.answer)!,
      },
      now,
    );
  return applyAction(s, { type: "book-battle-finish", bookId: book.id }, now);
}
test("15 books have coherent tasks and ten distinct final questions each", () => {
  assert.equal(readingBooks.length, 15);
  assert.equal(new Set(readingBooks.map((b) => b.id)).size, 15);
  for (const b of readingBooks) {
    assert.equal(b.chapters.length, 3);
    assert.equal(tasksFor(b).length, 9);
    assert.equal(new Set(tasksFor(b).map((t) => t.kind)).size, 9);
    const questions = battleFor(b);
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map((q) => q.id)).size, 10);
    for (const q of questions) {
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.length >= 2);
      assert.equal(new Set(q.options).size, q.options.length);
    }
  }
  assert.equal(
    readingBooks.find((b) => b.id === "baqbaq")?.author,
    "Марат Қабанбаев",
  );
  assert.equal(readingBooks.find((b) => b.id === "aiqai")?.level, "advanced");
});
test("reading order, task gates, invalid payloads and answer validation are enforced", () => {
  const s = fresh();
  assert.throws(() =>
    applyAction(s, { type: "book-read", bookId: book.id, chapter: 2 }, now),
  );
  assert.throws(() =>
    applyAction(s, { type: "book-read", bookId: "__proto__", chapter: 0 }, now),
  );
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "book-answer",
        bookId: book.id,
        taskId: "character",
        answer: "Қожа",
      },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(s, { type: "book-battle-start", bookId: book.id }, now),
  );
  const partial = applyAction(
    s,
    { type: "book-read", bookId: book.id, chapter: 0 },
    now,
  );
  assert.equal(
    s.progress.reading,
    undefined,
    "reducer must not mutate original state",
  );
  assert.equal(recordFor(partial, book.id).chapters.length, 1);
  const replay = applyAction(
    partial,
    { type: "book-read", bookId: book.id, chapter: 0 },
    now,
  );
  assert.equal(replay.progress.xp, partial.progress.xp);
  const full = ready();
  assert.throws(() =>
    applyAction(
      full,
      {
        type: "book-answer",
        bookId: book.id,
        taskId: "character",
        answer: "Жантас",
      },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(
      full,
      {
        type: "book-answer",
        bookId: book.id,
        taskId: "constructor",
        answer: "",
      },
      now,
    ),
  );
  assert.equal(
    validTask(tasksFor(book)[6], JSON.stringify(["a", "b", "c", "d"])),
    false,
  );
  assert.equal(validTask(tasksFor(book)[7], "Бір ғана сөйлем."), false);
  assert.equal(validTask(tasksFor(book)[8], "!".repeat(60)), false);
  assert.equal(validTask(tasksFor(book)[8], null), false);
});
test("rewards, certificate, titles, balances and drafts survive JSON persistence without replay farming", () => {
  let s = finish(ready(), 7);
  assert.ok(recordFor(s, book.id).certifiedAt);
  assert.equal(readingPercent(s, book.id), 100);
  assert.equal(s.progress.national?.crystals, 14);
  assert.equal(readerTitles(s)[0].unlocked, true);
  assert.equal(readerTitles(s)[2].unlocked, false);
  const total = s.progress.xp,
    coins = s.progress.coins;
  s = finish(JSON.parse(JSON.stringify(s)), 7);
  assert.equal(s.progress.xp, total);
  assert.equal(s.progress.coins, coins);
  s = finish(s, 10);
  assert.equal(s.progress.xp, total + 15);
  assert.equal(s.progress.national?.crystals, 14);
  assert.equal(recordFor(s, book.id).bestScore, 10);
  assert.ok(recordFor(s, book.id).answers.ending.includes("Қожа"));
  const tx = s.progress.xpTransactions.map((t) => t.id);
  assert.equal(new Set(tx).size, tx.length);
});
test("battle deadline is server enforced; cannot restart clock, change answers, or finish early", () => {
  let s = applyAction(
    ready(),
    { type: "book-battle-start", bookId: book.id },
    now,
  );
  const later = new Date(now.getTime() + 60000);
  s = applyAction(s, { type: "book-battle-start", bookId: book.id }, later);
  assert.equal(recordFor(s, book.id).battle?.startedAt, now.toISOString());
  const q = battleFor(book)[0];
  s = applyAction(
    s,
    {
      type: "book-battle-answer",
      bookId: book.id,
      questionId: q.id,
      answer: q.answer,
    },
    later,
  );
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "book-battle-answer",
        bookId: book.id,
        questionId: q.id,
        answer: q.answer,
      },
      later,
    ),
  );
  assert.throws(() =>
    applyAction(s, { type: "book-battle-finish", bookId: book.id }, later),
  );
  const expired = new Date(now.getTime() + BATTLE_SECONDS * 1000);
  const q2 = battleFor(book)[1];
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "book-battle-answer",
        bookId: book.id,
        questionId: q2.id,
        answer: q2.answer,
      },
      expired,
    ),
  );
  s = applyAction(s, { type: "book-battle-finish", bookId: book.id }, expired);
  assert.equal(recordFor(s, book.id).battle?.score, 1);
  assert.equal(recordFor(s, book.id).certifiedAt, undefined);
  const oldOrder = recordFor(s, book.id).battle!.order.join(",");
  s = applyAction(s, { type: "book-battle-start", bookId: book.id }, expired);
  assert.notEqual(recordFor(s, book.id).battle!.order.join(","), oldOrder);
});
test("reading streak counts distinct consecutive UTC days and expires after a gap", () => {
  const days = ["2026-09-07", "2026-09-08", "2026-09-08", "2026-09-09"];
  assert.equal(readingStreak(days, now), 3);
  assert.equal(readingStreak(days, new Date("2026-09-10T10:00:00Z")), 3);
  assert.equal(readingStreak(days, new Date("2026-09-11T10:00:00Z")), 0);
  let s = applyAction(
    fresh(),
    { type: "book-read", bookId: book.id, chapter: 0 },
    now,
  );
  s = applyAction(
    s,
    { type: "book-read", bookId: book.id, chapter: 1 },
    new Date("2026-09-10T10:00:00Z"),
  );
  assert.equal(s.progress.streak.current, 2);
});
