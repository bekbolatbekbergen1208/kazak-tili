import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialState, applyAction } from "../lib/learning/state";
import { regions } from "../lib/travel/catalog";
import { travelOf, travelXP, travelTitle } from "../lib/travel/state";
import { coreSections } from "../lib/travel/types";
const ready = () => {
  const s = initialState();
  s.profile.onboarded = true;
  return s;
};
test("20 unique territories correspond exactly to licensed geographic boundaries", () => {
  const map = JSON.parse(readFileSync("public/travel/boundaries.json", "utf8"));
  assert.equal(regions.length, 20);
  assert.equal(regions.filter((r) => r.type === "city").length, 3);
  assert.equal(new Set(regions.map((r) => r.slug)).size, 20);
  assert.deepEqual(
    new Set(regions.map((r) => r.mapFeatureId)),
    new Set(map.map((r: { id: string }) => r.id)),
  );
  for (const r of regions) {
    assert.ok(r.vocabulary.length >= 10);
    assert.equal(r.games.quiz.length, 5);
    assert.ok(r.landmarks.length >= 4);
    assert.ok(r.sources.length > 0);
    assert.equal(r.games.matching.length, 3);
    for (const q of r.games.quiz) {
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.explanation);
    }
    for (const id of r.games.matching)
      assert.ok(r.vocabulary.some((w) => w.id === id));
  }
});
test("visit and replay quiz awards are idempotent, score verified from answers", () => {
  const r = regions.find((r) => r.id === "mangystau")!;
  let s = ready();
  const visit = { type: "travel-visit" as const, regionId: r.id };
  s = applyAction(s, visit);
  assert.equal(s.progress.xp, 10);
  s = applyAction(s, visit);
  assert.equal(s.progress.xp, 10);
  const quiz = {
    type: "travel-game" as const,
    regionId: r.id,
    game: "quiz" as const,
    answers: r.games.quiz.map((q) => q.answer),
  };
  s = applyAction(s, quiz);
  assert.equal(travelXP(s), 60);
  const correct = s.progress.correctAnswers;
  s = applyAction(s, quiz);
  assert.equal(travelXP(s), 60);
  assert.equal(s.progress.correctAnswers, correct);
  assert.equal(travelOf(s).regions[r.id].quizBestScore, 5);
  assert.throws(() => applyAction(s, { ...quiz, answers: ["fabricated"] }));
  assert.throws(() =>
    applyAction(s, {
      type: "travel-section",
      regionId: r.id,
      sectionId: "invented",
    }),
  );
});
test("partial content never grants stamp; completed games and vocabulary survive serialization", () => {
  const r = regions.find((r) => r.contentStatus === "partial")!;
  let s = applyAction(ready(), { type: "travel-visit", regionId: r.id });
  for (const sectionId of coreSections)
    s = applyAction(s, { type: "travel-section", regionId: r.id, sectionId });
  for (const w of r.vocabulary)
    s = applyAction(s, {
      type: "travel-word",
      regionId: r.id,
      wordId: w.id,
      answer: w.en,
    });
  for (const [game, answers] of [
    ["quiz", r.games.quiz.map((q) => q.answer)],
    ["matching", r.games.matching],
    ["sentence", r.games.sentence],
  ] as const)
    s = applyAction(s, {
      type: "travel-game",
      regionId: r.id,
      game,
      answers: [...answers],
    });
  s = JSON.parse(JSON.stringify(s));
  assert.equal(travelOf(s).regions[r.id].stampUnlocked, false);
  assert.equal(travelXP(s), 75);
  assert.equal(
    travelOf(s).regions[r.id].vocabularyLearned.length,
    r.vocabulary.length,
  );
});
test("forged vocabulary and invalid settings rejected; wrong answers do not count", () => {
  let s = applyAction(ready(), { type: "travel-visit", regionId: "mangystau" });
  s = applyAction(s, {
    type: "travel-word",
    regionId: "mangystau",
    wordId: "seal",
    answer: "wrong",
  });
  assert.equal(travelOf(s).regions.mangystau.vocabularyLearned.length, 0);
  assert.throws(() =>
    applyAction(s, {
      type: "travel-word",
      regionId: "mangystau",
      wordId: "fake",
      answer: "fake",
    }),
  );
  assert.throws(() =>
    applyAction(s, {
      type: "travel-camera",
      center: { x: Infinity, y: 0 },
      zoom: 2,
    }),
  );
  assert.equal(travelTitle(1800), "QazaqDos елшісі");
});
test("legacy progress and equipment remain intact when travel is first added", () => {
  const s = ready();
  s.progress.xp = 900;
  s.progress.coins = 43;
  s.progress.inventory = ["scarf"];
  const next = applyAction(s, { type: "travel-visit", regionId: "astana" });
  assert.equal(next.progress.xp, 910);
  assert.equal(next.progress.coins, 43);
  assert.deepEqual(next.progress.inventory, s.progress.inventory);
  assert.equal(s.progress.travel, undefined);
  assert.ok(travelOf(next).regions.astana.visited);
});

test("100 unique vocabulary words are attainable", () => {
  assert.ok(
    new Set(regions.flatMap((r) => r.vocabulary.map((w) => w.id))).size >= 100,
  );
});
test("nature and history achievements can be earned from sourced regional content", () => {
  let s = ready();
  for (const r of regions) {
    s = applyAction(s, { type: "travel-visit", regionId: r.id });
    for (const animal of r.animals) {
      assert.ok(animal.source && animal.status);
      s = applyAction(s, {
        type: "travel-object",
        regionId: r.id,
        objectId: animal.id,
      });
    }
    s = applyAction(s, {
      type: "travel-game",
      regionId: r.id,
      game: "quiz",
      answers: r.games.quiz.map((q) => q.answer),
    });
  }
  assert.ok(travelOf(s).achievements.includes("nature"));
  assert.ok(travelOf(s).achievements.includes("history"));
});
test("every stamp-enabled region supplies all reading categories and sourced wildlife", () => {
  for (const r of regions.filter((r) => r.contentStatus === "ready")) {
    for (const category of [
      "nature",
      "plants",
      "history",
      "landmarks",
      "culture",
      "foods",
      "famousPeople",
      "resources",
      "industries",
      "agriculture",
      "importance",
    ] as const)
      assert.ok(r[category].length, `${r.id}: ${category}`);
    assert.ok(r.animals.length >= 3 && r.animals.length <= 6);
    assert.ok(r.interestingFacts.length >= 5);
    assert.deepEqual(r.missingContent, []);
  }
});
test("ready region needs all three games; a stamp and completion reward are issued only once", () => {
  for (const r of regions.filter((r) => r.contentStatus === "ready")) {
    let s = applyAction(ready(), { type: "travel-visit", regionId: r.id });
    for (const sectionId of coreSections)
      s = applyAction(s, { type: "travel-section", regionId: r.id, sectionId });
    for (const w of r.vocabulary)
      s = applyAction(s, {
        type: "travel-word",
        regionId: r.id,
        wordId: w.id,
        answer: w.en,
      });
    s = applyAction(s, {
      type: "travel-game",
      regionId: r.id,
      game: "quiz",
      answers: r.games.quiz.map((q) => q.answer),
    });
    s = applyAction(s, {
      type: "travel-game",
      regionId: r.id,
      game: "matching",
      answers: r.games.matching,
    });
    assert.equal(travelOf(s).regions[r.id].stampUnlocked, false);
    const finish = {
      type: "travel-game" as const,
      regionId: r.id,
      game: "sentence" as const,
      answers: r.games.sentence,
    };
    s = applyAction(s, finish);
    assert.equal(travelOf(s).regions[r.id].stampUnlocked, true);
    assert.equal(travelXP(s), 195);
    assert.equal(s.progress.coins, 30);
    const again = applyAction(s, finish);
    assert.equal(travelXP(again), 195);
    assert.equal(again.progress.coins, 30);
    assert.equal(
      s.progress.xpTransactions.filter(
        (x) => x.id === `travel:${r.id}:complete`,
      ).length,
      1,
    );
  }
});
