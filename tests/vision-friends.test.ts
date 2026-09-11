import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, initialState } from "../lib/learning/state";
import {
  acceptableVisionAnswer,
  visionCategories,
  visionTasks,
  visionWords,
} from "../lib/vision/words";
import { visionOf } from "../lib/vision/state";
import {
  friendLevel,
  localDay,
  missionStats,
  sharedDays,
  sharedStreak,
} from "../lib/friends/system";
function fresh() {
  const s = initialState();
  s.profile.onboarded = true;
  return s;
}
const now = new Date("2026-09-10T10:00:00Z");
test("vision supplies 30 unique complete words across seven categories", () => {
  assert.equal(visionWords.length, 30);
  assert.equal(new Set(visionWords.map((w) => w.id)).size, 30);
  assert.deepEqual(
    new Set(visionWords.map((w) => w.category)),
    new Set(visionCategories),
  );
  for (const w of visionWords)
    assert.ok(
      w.kk &&
        w.plural &&
        w.ru &&
        w.en &&
        w.pronunciation &&
        w.easy &&
        w.medium &&
        w.aliases.length,
    );
});
test("vision answers reward each task only once", () => {
  const w = visionWords[0];
  assert.ok(acceptableVisionAnswer(w, visionTasks[0], "Мен кітап оқимын."));
  assert.ok(!acceptableVisionAnswer(w, visionTasks[0], "кітап"));
  assert.ok(acceptableVisionAnswer(w, visionTasks[3], w.plural));
  let s = fresh();
  s = applyAction(s, { type: "vision-found", wordId: w.id }, now);
  assert.equal(s.progress.xp, 0);
  s = applyAction(
    s,
    {
      type: "vision-answer",
      wordId: w.id,
      task: visionTasks[0],
      answer: "Мен кітап оқимын.",
    },
    now,
  );
  assert.equal(s.progress.xp, w.xp);
  s = applyAction(
    s,
    {
      type: "vision-answer",
      wordId: w.id,
      task: visionTasks[0],
      answer: "Бұл кітап жақсы.",
    },
    now,
  );
  assert.equal(s.progress.xp, w.xp);
  assert.equal(visionOf(s).words[w.id].sentence, "Мен кітап оқимын.");
});
test("vision rejects forged ids and incorrect answers", () => {
  const s = fresh();
  assert.throws(() =>
    applyAction(s, { type: "vision-found", wordId: "fake" }, now),
  );
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "vision-answer",
        wordId: "book",
        task: visionTasks[0],
        answer: "кітап",
      },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "vision-answer",
        wordId: "book",
        task: visionTasks[3],
        answer: "кітаплар",
      },
      now,
    ),
  );
});
test("friend levels, timezone days, streaks and missions are deterministic", () => {
  assert.equal(friendLevel(0).name, "Жаңа таныстар");
  assert.equal(friendLevel(100).name, "Оқу серіктестері");
  assert.equal(friendLevel(1000).name, "QazaqDos достары");
  assert.equal(localDay("2026-09-10T20:30:00Z", "Asia/Almaty"), "2026-09-11");
  const a = fresh(),
    b = fresh();
  a.progress.xpTransactions.push({
    id: "a",
    amount: 1,
    reason: "lesson",
    date: "2026-09-09T23:30:00Z",
  });
  b.progress.xpTransactions.push({
    id: "b",
    amount: 1,
    reason: "lesson",
    date: "2026-09-10T01:00:00Z",
  });
  assert.equal(sharedDays(a, b, "Asia/Almaty").length, 1);
  assert.deepEqual(
    sharedStreak(["2026-09-08", "2026-09-09", "2026-09-10"], now),
    { current: 3, best: 3 },
  );
  assert.deepEqual(
    sharedStreak(
      ["2026-09-08", "2026-09-10"],
      new Date("2026-09-10T12:00:00Z"),
      true,
    ),
    { current: 2, best: 1 },
  );
  assert.equal(missionStats(a, b).length, 3);
});
