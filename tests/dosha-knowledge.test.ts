import test from "node:test";
import assert from "node:assert/strict";
import {
  doshaKnowledge,
  formatKnowledgeContext,
  searchDoshaKnowledge,
} from "../lib/dosha/knowledge";

test("unified Dosha knowledge includes every learning domain", () => {
  const documents = doshaKnowledge();
  assert.equal(
    documents.filter((item) => item.category === "lesson").length,
    1000,
  );
  for (const category of [
    "region",
    "history",
    "literature",
    "national-game",
    "vision",
    "robotics",
  ])
    assert.ok(
      documents.some((item) => item.category === category),
      category,
    );
});

test("retrieval is bounded, relevant, and honors lesson context", () => {
  const games = searchDoshaKnowledge(
    "Тоғызқұмалақтың отауы мен тұздығы",
    {},
    20,
  );
  assert.ok(games.length <= 6);
  assert.equal(games[0]?.id, "game-togyz");
  const lesson = searchDoshaKnowledge("осы сабақты түсіндір", {
    currentLesson: 777,
  });
  assert.equal(lesson[0]?.id, "lesson-777");
  assert.match(formatKnowledgeContext(lesson), /777-сабақ/);
  assert.equal(
    searchDoshaKnowledge("сенсор қозғалтқыш алгоритм")[0]?.category,
    "robotics",
  );
});
