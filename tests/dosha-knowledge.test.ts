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

import { exerciseKnowledge, exerciseAnswer } from "../lib/dosha/exercises";
import { lessons } from "../lib/learning/content";
import { courseLessons } from "../lib/curriculum";
import { regions } from "../lib/travel/catalog";
import { historyCities } from "../lib/history/catalog";
import { readingBooks, tasksFor, battleFor } from "../lib/books/catalog";
import { questions } from "../lib/national/catalog";
import { referenceAnswer } from "../lib/friend/knowledge";

test("every catalog exercise is indexed with a readable answer", () => {
  const sources = exerciseKnowledge();
  const expected =
    6 +
    courseLessons.length * 4 +
    lessons.reduce((n, l) => n + l.exercises.length, 0) +
    regions.reduce((n, r) => n + r.games.quiz.length, 0) +
    historyCities.reduce((n, c) => n + c.tasks.length, 0) +
    readingBooks.reduce(
      (n, b) => n + tasksFor(b).length + battleFor(b).length,
      0,
    ) +
    questions.length;
  assert.equal(sources.length, expected);
  assert.equal(new Set(sources.map((s) => s.id)).size, expected);
  for (const lesson of lessons)
    for (const exercise of lesson.exercises) {
      const answer = exerciseAnswer(exercise);
      assert.ok(answer.length);
      assert.ok(!["correct", "a", "0,1,2", "0 1 2", "0,1"].includes(answer));
    }
  assert.ok(
    sources
      .filter((s) => s.id.endsWith("-opinion"))
      .every((s) => s.excerpt.includes("жалғыз дұрыс жауабы жоқ")),
  );
});

test("retrieves explicit lesson numbers and exact game questions", () => {
  assert.equal(
    searchDoshaKnowledge("777-сабақты түсіндір")[0].id,
    "lesson-777",
  );
  assert.equal(searchDoshaKnowledge("lesson 888")[0].id, "lesson-888");
  const question = regions[0].games.quiz[0];
  assert.ok(
    searchDoshaKnowledge(question.prompt).some((s) =>
      s.excerpt.includes(question.answer),
    ),
  );
  const exercise = lessons[0].exercises[0];
  assert.equal(
    searchDoshaKnowledge(exercise.prompt.en, {
      currentLesson: lessons[0].id,
    })[0].id,
    `learning-exercise-${exercise.id}`,
  );
  assert.equal(referenceAnswer(question.prompt).topic, "Тапсырманы нақтылау");
  assert.ok(
    referenceAnswer(questions[0].prompt).reply.includes(
      questions[0].options[questions[0].answer],
    ),
  );
});
