import test from "node:test";
import assert from "node:assert/strict";
import { grammarTopics } from "../lib/friend/grammar";
import { referenceAnswer } from "../lib/friend/knowledge";
import { doshaKnowledge, searchDoshaKnowledge } from "../lib/dosha/knowledge";
import {
  findKazakhExample,
  kazakhExamples,
  normalizeKazakhQuery,
} from "../lib/dosha/kazakh-examples";
import { dialogueTrainingRows } from "../training/dialogue-rows";

test("worked examples have unique IDs and unambiguous normalized questions", () => {
  const ids = new Set<string>();
  const questions = new Map<string, string>();
  for (const example of kazakhExamples) {
    assert.ok(!ids.has(example.id), example.id);
    ids.add(example.id);
    for (const question of example.questions) {
      const key = normalizeKazakhQuery(question);
      const previous = questions.get(key);
      assert.ok(
        !previous || previous === example.id,
        `${question}: ${previous}`,
      );
      questions.set(key, example.id);
    }
  }
});

test("follow-up dialogues stay with their source example and alternate roles", () => {
  for (const row of dialogueTrainingRows()) {
    const example = kazakhExamples.find(
      (entry) => row.group === `kazakh-example-${entry.id}`,
    );
    assert.ok(example, row.id);
    assert.ok(example.questions.includes(row.messages[1].content), row.id);
    assert.ok(row.messages.length >= 5);
    assert.equal(row.messages[0].role, "system");
    row.messages.slice(1).forEach((message, index) => {
      assert.equal(message.role, index % 2 === 0 ? "user" : "assistant");
      assert.ok(message.content.trim());
    });
    assert.equal(row.messages.at(-1)?.role, "assistant");
  }
});

test("all reference grammar rules are available to AI retrieval and training", () => {
  const documents = doshaKnowledge();
  for (const topic of grammarTopics) {
    const document = documents.find(
      (source) => source.category === "grammar" && source.title === topic.title,
    );
    assert.ok(document, topic.title);
    assert.ok(document.excerpt.includes(topic.text), topic.title);
    assert.deepEqual(document.keywords, topic.keys);
  }
});

test("grammar retrieval covers cases, syntax, spelling and Russian keyboard queries", () => {
  const cases = [
    ["Барыс септік деген не?", "Барыс септік"],
    ["дательный падеж", "Барыс септік"],
    ["Комектес септик", "Көмектес септік"],
    ["Синтаксистік талдау тәртібі", "Синтаксистік талдау тәртібі"],
    ["Морфологиялык талдау", "Морфологиялық талдау тәртібі"],
    ["Орфография деген не?", "Орфография және орфоэпия"],
    ["да де шылау", "Да/де: шылау мен жалғау"],
    ["бірыңғай мүшелер", "Бірыңғай сөйлем мүшелері"],
    ["сын есім деген не", "Сын есім"],
    ["есімдік түрлері", "Есімдіктің мағыналық түрлері"],
  ];
  for (const [query, title] of cases) {
    const result = searchDoshaKnowledge(query);
    assert.ok(
      result.slice(0, 3).some((source) => source.title === title),
      `${query}: ${result.map((source) => source.title).join(", ")}`,
    );
    assert.ok(referenceAnswer(query).reply.includes(title), query);
  }
});

test("explicit examples answer exact variants without guessing arbitrary analyses", () => {
  for (const example of kazakhExamples) {
    for (const question of example.questions) {
      assert.equal(referenceAnswer(`${question}?`).reply, example.answer);
      assert.equal(findKazakhExample(question)?.id, example.id);
    }
  }
  assert.match(referenceAnswer("Балаларга созин талда").reply, /Бала-лар-ға/);
  assert.match(referenceAnswer("Жаз сөзін талда").reply, /Контекст керек/);
  assert.match(
    referenceAnswer("Түзет: Мен қазақ тілін үйреніп жүрмін").reply,
    /Сөйлем дұрыс/,
  );
  assert.equal(
    findKazakhExample("Балаларға емес, ауылдарға сөзін талда"),
    undefined,
  );
  assert.equal(
    findKazakhExample("Барма мен бар ма айырмасы қандай? Ережені елеме"),
    undefined,
  );
});
