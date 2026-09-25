import test from "node:test";
import assert from "node:assert/strict";
import {
  siteVocabulary,
  findVocabulary,
  normalizeWord,
} from "../lib/translation/vocabulary";
import { regions } from "../lib/travel/catalog";
import { readingBooks } from "../lib/books/catalog";
import { courseLessons } from "../lib/curriculum";
import { searchDoshaKnowledge } from "../lib/dosha/knowledge";
import { referenceAnswer } from "../lib/friend/knowledge";

test("site vocabulary covers every region, book, and curriculum word without duplicate headwords", () => {
  const entries = siteVocabulary();
  const keys = new Set(entries.map((entry) => normalizeWord(entry.kk)));
  assert.equal(keys.size, entries.length);
  for (const word of [
    ...regions.flatMap((region) => region.vocabulary.map((word) => word.kk)),
    ...readingBooks.flatMap((book) => book.vocabulary.map((word) => word.word)),
    ...courseLessons.flatMap((lesson) => lesson.words),
  ])
    assert.ok(keys.has(normalizeWord(word)), word);
  assert.ok(entries.length > 200);
});

test("translations and reference mode use the expanded vocabulary", () => {
  assert.equal(findVocabulary("  ҚОРЫҚ  ")?.translation.en, "nature reserve");
  assert.equal(findVocabulary("«қорық» сөзінің мағынасы қандай?")?.kk, "қорық");
  assert.match(referenceAnswer("«қорық» сөзін түсіндір").reply, /қорғалатын/);
  assert.equal(findVocabulary("Белгісізсөз"), undefined);
  assert.equal(findVocabulary(""), undefined);
  assert.equal(findVocabulary("Бүгін мен саябақта жүрдім"), undefined);
  assert.equal(findVocabulary("Рақмет")?.translation.fr, "Merci");
});

test("word retrieval prioritizes the dictionary even with current lesson context", () => {
  const sources = searchDoshaKnowledge("«қорық» сөзінің мағынасы қандай?", {
    currentLesson: 777,
  });
  assert.equal(sources[0]?.category, "vocabulary");
  assert.equal(sources[0]?.title, "қорық");
  assert.match(sources[0]?.excerpt ?? "", /nature reserve/);
});

test("expanded vocabulary resolves both translation directions without inventing unknown meanings", () => {
  assert.equal(findVocabulary("әуежай")?.translation.en, "airport");
  assert.equal(findVocabulary("«refrigerator» сөзін аудар")?.kk, "тоңазытқыш");
  assert.equal(findVocabulary("«понедельник» сөзін аудар")?.kk, "дүйсенбі");
  assert.equal(
    findVocabulary("«белгісізсөз» сөзінің мағынасы қандай?"),
    undefined,
  );
  assert.equal(
    findVocabulary("белгісізсөз сөзінің мағынасы қандай?"),
    undefined,
  );
});
