import test from "node:test";
import assert from "node:assert/strict";
import {
  characters,
  characterShop,
  coinRewards,
  unlockRequirements,
  unlockedCharacters,
} from "../lib/characters/config";
import {
  equipmentFor,
  getCollection,
  hydrateCharacters,
  pendingReveals,
} from "../lib/characters/state";
import { applyAction, initialState } from "../lib/learning/state";
import { lessons } from "../lib/learning/content";
const now = new Date("2026-09-07T12:00:00Z");
function ready(xp = 0, coins = 0) {
  const s = initialState();
  s.progress.xp = xp;
  s.progress.coins = coins;
  s.profile.onboarded = true;
  return hydrateCharacters(s, now);
}
test("all eight boundaries use total XP; lesson count is irrelevant", () => {
  assert.deepEqual(
    unlockRequirements.map((x) => x.xp),
    [0, 100, 350, 500, 600, 700, 900, 1000],
  );
  characters.forEach((c, i) => {
    if (c.unlockXP > 0)
      assert.equal(unlockedCharacters(c.unlockXP - 1).length, i);
    assert.equal(unlockedCharacters(c.unlockXP).length, i + 1);
  });
  assert.equal(characterShop.filter((i) => i.slot === "skin").length, 3);
  assert.equal(
    new Set(characterShop.map((i) => i.id)).size,
    characterShop.length,
  );
  for (const c of characters)
    assert.ok(
      c.dialogueLines.support.en &&
        c.dialogueLines.support.ru &&
        c.imageUrl.endsWith(".svg"),
    );
});
test("locked selection, fake IDs, unowned and incompatible equipment rejected", () => {
  const s = ready();
  assert.throws(() =>
    applyAction(s, { type: "select-character", characterId: "aibar" }, now),
  );
  assert.throws(() =>
    applyAction(
      s,
      { type: "select-character", characterId: "invalid" as never },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(
      s,
      { type: "equip", characterId: "tilmash", itemId: "scarf" },
      now,
    ),
  );
  let rich = ready(100, 100);
  rich = applyAction(rich, { type: "buy", itemId: "dictionary" }, now);
  assert.throws(() =>
    applyAction(
      rich,
      { type: "equip", characterId: "balapan", itemId: "dictionary" },
      now,
    ),
  );
  assert.throws(() =>
    applyAction(
      rich,
      { type: "equip", characterId: "aibar", itemId: "dictionary" },
      now,
    ),
  );
});
test("reveals persist, can select immediately, and do not consume XP", () => {
  let s = ready(350);
  assert.deepEqual(
    pendingReveals(s).map((c) => c.id),
    ["balapan", "qonyr"],
  );
  s = applyAction(
    s,
    { type: "reveal-character", characterId: "balapan", select: true },
    now,
  );
  assert.equal(getCollection(s).selectedId, "balapan");
  assert.equal(s.progress.xp, 350);
  assert.deepEqual(
    pendingReveals(hydrateCharacters(JSON.parse(JSON.stringify(s)), now)).map(
      (c) => c.id,
    ),
    ["qonyr"],
  );
  s = applyAction(
    s,
    { type: "reveal-character", characterId: "qonyr", select: false },
    now,
  );
  assert.equal(getCollection(s).selectedId, "balapan");
  assert.equal(pendingReveals(s).length, 0);
});
test("skin and accessories charge once, equip independently, and unequip without deleting", () => {
  let s = ready(100, 100);
  s = applyAction(s, { type: "buy", itemId: "skin-steppe" }, now);
  assert.equal(s.progress.coins, 60);
  assert.throws(() =>
    applyAction(s, { type: "buy", itemId: "skin-steppe" }, now),
  );
  s = applyAction(
    s,
    { type: "equip", characterId: "tilmash", itemId: "skin-steppe" },
    now,
  );
  s = applyAction(s, { type: "buy", itemId: "glasses" }, now);
  s = applyAction(
    s,
    { type: "equip", characterId: "balapan", itemId: "glasses" },
    now,
  );
  assert.equal(equipmentFor(s, "tilmash").skin, "skin-steppe");
  assert.equal(equipmentFor(s, "tilmash").eyewear, undefined);
  assert.equal(equipmentFor(s, "balapan").eyewear, "glasses");
  assert.equal(s.progress.coins, 40);
  s = applyAction(
    s,
    { type: "unequip", characterId: "tilmash", slot: "skin" },
    now,
  );
  assert.ok(s.progress.inventory.includes("skin-steppe"));
  assert.equal(equipmentFor(s, "tilmash").skin, undefined);
  assert.throws(() => applyAction(s, { type: "buy", itemId: "shapan" }, now));
});
test("old progress and purchases survive hydration without replaying rewards", () => {
  const s = ready(700, 88);
  delete s.progress.characters;
  s.progress.inventory = ["scarf", "frame", "mint"];
  s.profile.theme = "mint";
  s.progress.achievements = [
    { achievementId: "first", date: now.toISOString() },
  ];
  const upgraded = hydrateCharacters(s, now);
  assert.equal(upgraded.progress.coins, 88);
  assert.equal(upgraded.progress.xp, 700);
  assert.equal(getCollection(upgraded).unlocked.length, 6);
  assert.equal(equipmentFor(upgraded).neck, "scarf");
  assert.equal(equipmentFor(upgraded).theme, "mint");
  assert.equal(equipmentFor(upgraded).frame, "frame");
  assert.deepEqual(hydrateCharacters(upgraded, now), upgraded);
});
test("1000 XP grants Samuryq and legend achievement reward exactly once", () => {
  let s = ready(990);
  s = applyAction(
    s,
    {
      type: "answer",
      lessonId: "tourism-1",
      exerciseId: "tourism-1-meaning",
      answer: "correct",
    },
    now,
  );
  assert.equal(s.progress.xp, 1000);
  assert.ok(getCollection(s).unlocked.some((c) => c.characterId === "samuryq"));
  assert.equal(
    s.progress.achievements.filter((a) => a.achievementId === "legendary")
      .length,
    1,
  );
  assert.equal(
    s.progress.coinTransactions.find((x) => x.id === "achievement-legendary")
      ?.amount,
    50,
  );
  const coins = s.progress.coins;
  s = applyAction(s, { type: "select-character", characterId: "samuryq" }, now);
  s = applyAction(s, { type: "profile", profile: s.profile }, now);
  assert.equal(s.progress.coins, coins);
});
test("new economy: daily quest 15, section 30, lesson 10 + perfect 5", () => {
  let s = ready();
  for (const l of lessons.filter((l) => l.sectionId === "tourism-a")) {
    for (const e of l.exercises)
      s = applyAction(
        s,
        { type: "answer", lessonId: l.id, exerciseId: e.id, answer: e.answer },
        now,
      );
    s = applyAction(s, { type: "finish", lessonId: l.id }, now);
  }
  assert.equal(
    s.progress.coinTransactions.find((t) => t.id === "finish-tourism-1")
      ?.amount,
    15,
  );
  assert.equal(
    s.progress.coinTransactions.find((t) => t.id === "section-tourism-a")
      ?.amount,
    30,
  );
  s = applyAction(s, { type: "claim", questId: "lessons" }, now);
  assert.equal(
    s.progress.coinTransactions.find((t) => t.id === "quest-2026-09-07-lessons")
      ?.amount,
    15,
  );
  assert.equal(coinRewards.achievement, 10);
});
