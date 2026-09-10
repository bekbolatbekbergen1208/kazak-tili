import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, initialState } from "../lib/learning/state";
import { historyCities, historyTaskAnswer } from "../lib/history/catalog";
import {
  cityOpen,
  cityPercent,
  cityProgress,
  HISTORY_SECONDS,
  historyRank,
} from "../lib/history/state";
import { shopItemById, characters, canWear } from "../lib/characters/config";
import type { LearningState } from "../lib/learning/types";
const now = new Date("2026-09-09T12:00:00Z");
function fresh() {
  const s = initialState();
  s.profile.onboarded = true;
  return s;
}
function ready(s = fresh(), cityId = "otyrar") {
  const c = historyCities.find((c) => c.id === cityId)!;
  s = applyAction(s, { type: "history-visit", cityId }, now);
  s = applyAction(s, { type: "history-intro", cityId }, now);
  for (const o of c.objects)
    s = applyAction(
      s,
      { type: "history-discover", cityId, objectId: o.id },
      now,
    );
  for (const t of c.tasks)
    s = applyAction(
      s,
      { type: "history-answer", cityId, taskId: t.id, answer: t.answer },
      now,
    );
  return s;
}
function finish(s: LearningState, cityId: string) {
  s = applyAction(s, { type: "history-final-start", cityId }, now);
  for (const objectId of cityProgress(s, cityId).final!.targets)
    s = applyAction(s, { type: "history-final-find", cityId, objectId }, now);
  return applyAction(s, { type: "history-final-finish", cityId }, now);
}
test("history has ten unique places, three coherent playable cities and valid rewards/sources", () => {
  assert.equal(historyCities.length, 10);
  assert.equal(new Set(historyCities.map((c) => c.id)).size, 10);
  assert.equal(historyCities.filter((c) => c.ready).length, 3);
  for (const c of historyCities.filter((c) => c.ready)) {
    assert.equal(c.objects.length, 5);
    assert.equal(c.tasks.length, 4);
    assert.equal(new Set(c.objects.map((o) => o.id)).size, 5);
    assert.equal(new Set(c.tasks.map((t) => t.id)).size, 4);
    assert.ok(shopItemById(c.reward.itemId));
    for (const character of characters)
      assert.ok(canWear(shopItemById(c.reward.itemId)!, character.id));
    for (const o of c.objects)
      assert.match(c.sources[o.source].url, /^https:\/\//);
    for (const t of c.tasks) {
      assert.ok(historyTaskAnswer(t, t.answer));
      assert.ok(!historyTaskAnswer(t, "not an answer"));
    }
  }
});
test("history prevents skipping cities, introductions, discoveries and tasks", () => {
  const s = fresh();
  for (const cityId of ["turkistan", "taraz", "saraishyq", "invalid"])
    assert.throws(() => applyAction(s, { type: "history-visit", cityId }, now));
  assert.throws(() =>
    applyAction(
      s,
      { type: "history-discover", cityId: "otyrar", objectId: "gate" },
      now,
    ),
  );
  let visited = applyAction(
    s,
    { type: "history-visit", cityId: "otyrar" },
    now,
  );
  assert.throws(() =>
    applyAction(
      visited,
      { type: "history-discover", cityId: "otyrar", objectId: "gate" },
      now,
    ),
  );
  visited = applyAction(
    visited,
    { type: "history-intro", cityId: "otyrar" },
    now,
  );
  assert.throws(() =>
    applyAction(
      visited,
      { type: "history-final-start", cityId: "otyrar" },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(
      visited,
      { type: "history-discover", cityId: "otyrar", objectId: "fake" },
      now,
    ),
  );
});
test("wrong answers keep balances, correct answers and discoveries award only once", () => {
  let s = ready();
  const before = structuredClone(s.progress);
  s = applyAction(
    s,
    { type: "history-discover", cityId: "otyrar", objectId: "gate" },
    now,
  );
  s = applyAction(
    s,
    {
      type: "history-answer",
      cityId: "otyrar",
      taskId: "road",
      answer: historyCities[0].tasks[0].answer,
    },
    now,
  );
  assert.equal(s.progress.xp, before.xp);
  assert.equal(s.progress.coins, before.coins);
  s.progress.history!.cities.otyrar.tasks = [];
  const wrong = applyAction(
    s,
    {
      type: "history-answer",
      cityId: "otyrar",
      taskId: "road",
      answer: "wrong",
    },
    now,
  );
  assert.equal(wrong.progress.xp, s.progress.xp);
  assert.equal(wrong.progress.coins, s.progress.coins);
  assert.equal(cityProgress(wrong, "otyrar").mistakes.road, 1);
  assert.equal(cityProgress(s, "otyrar").mistakes.road, undefined);
});
test("timed hunt cannot reset its clock, accept wrong targets, or finish early; expired attempts retry", () => {
  let s = applyAction(
    ready(),
    { type: "history-final-start", cityId: "otyrar" },
    now,
  );
  const initial = cityProgress(s, "otyrar").final!;
  s = applyAction(
    s,
    { type: "history-final-start", cityId: "otyrar" },
    new Date(now.getTime() + 1000),
  );
  assert.equal(cityProgress(s, "otyrar").final!.startedAt, initial.startedAt);
  const wrongId = historyCities[0].objects.find(
    (o) => o.id !== initial.targets[0],
  )!.id;
  s = applyAction(
    s,
    { type: "history-final-find", cityId: "otyrar", objectId: wrongId },
    now,
  );
  assert.equal(cityProgress(s, "otyrar").final!.found.length, 0);
  assert.throws(() =>
    applyAction(s, { type: "history-final-finish", cityId: "otyrar" }, now),
  );
  const expired = new Date(now.getTime() + HISTORY_SECONDS * 1000);
  assert.throws(() =>
    applyAction(
      s,
      {
        type: "history-final-find",
        cityId: "otyrar",
        objectId: initial.targets[0],
      },
      expired,
    ),
  );
  s = applyAction(
    s,
    { type: "history-final-finish", cityId: "otyrar" },
    expired,
  );
  assert.equal(cityProgress(s, "otyrar").final!.passed, false);
  assert.ok(!cityOpen(s, "turkistan"));
  s = applyAction(
    s,
    { type: "history-final-start", cityId: "otyrar" },
    expired,
  );
  assert.notEqual(
    cityProgress(s, "otyrar").final!.targets.join(),
    initial.targets.join(),
  );
});
test("all three cities persist through JSON, unlock sequentially, award equipment and ranks without farming", () => {
  let s = fresh();
  for (const [index, c] of historyCities.filter((c) => c.ready).entries()) {
    assert.ok(cityOpen(s, c.id));
    s = finish(ready(s, c.id), c.id);
    assert.equal(cityPercent(s, c.id), 100);
    assert.ok(s.progress.inventory.includes(c.reward.itemId));
    assert.equal(historyRank(s).count, index + 1);
    const xp = s.progress.xp;
    s = applyAction(s, { type: "history-final-start", cityId: c.id }, now);
    assert.equal(s.progress.xp, xp);
    s = JSON.parse(JSON.stringify(s));
    assert.ok(cityProgress(s, c.id).completedAt);
  }
  assert.equal(historyRank(s).title, "Ұлы дала зерттеушісі");
  assert.ok(!cityOpen(s, "saraishyq"));
  assert.equal(s.progress.national!.crystals, 12);
  const historyRewards = s.progress.national!.rewards.filter((r) =>
    r.id.startsWith("history-"),
  );
  assert.equal(
    historyRewards.reduce((n, r) => n + r.xp, 0),
    435,
  );
  assert.equal(
    historyRewards.reduce((n, r) => n + r.coins, 0),
    111,
  );
});
test("saved position is bounded and invalid values are rejected; day/night persists", () => {
  const s = ready();
  assert.throws(() =>
    applyAction(
      s,
      { type: "history-position", cityId: "otyrar", point: { x: NaN, y: 50 } },
      now,
    ),
  );
  const moved = applyAction(
    s,
    { type: "history-position", cityId: "otyrar", point: { x: 1000, y: -100 } },
    now,
  );
  assert.deepEqual(cityProgress(moved, "otyrar").position, { x: 95, y: 15 });
  const night = applyAction(moved, { type: "history-night", night: true }, now);
  assert.equal(night.progress.history!.night, true);
});
