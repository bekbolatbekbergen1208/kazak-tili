import test from "node:test";
import assert from "node:assert/strict";
import { grammarTopics } from "../lib/friend/grammar";
import { referenceAnswer } from "../lib/friend/knowledge";
import { doshaKnowledge, searchDoshaKnowledge } from "../lib/dosha/knowledge";
import {
  findKazakhExample,
  kazakhExamples,
} from "../lib/dosha/kazakh-examples";

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
