import test from "node:test";
import assert from "node:assert/strict";
import { vocabularyTrainingRows } from "../training/vocabulary-rows";
import { expandedVocabulary } from "../lib/translation/expanded";
import { normalizeWord, siteVocabulary } from "../lib/translation/vocabulary";

test("new vocabulary has complete translations, unique headwords, and original examples", () => {
  assert.ok(expandedVocabulary.length >= 300);
  assert.equal(
    new Set(expandedVocabulary.map((word) => normalizeWord(word.kk))).size,
    expandedVocabulary.length,
  );
  for (const word of expandedVocabulary) {
    assert.ok(word.translation.ru && word.translation.en && word.example);
    assert.ok(
      siteVocabulary().some(
        (entry) => normalizeWord(entry.kk) === normalizeWord(word.kk),
      ),
    );
  }
});

test("word training has both directions, real examples, and a shared split group", () => {
  const rows = vocabularyTrainingRows();
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  const airport = rows.filter((row) => row.group === "vocabulary-әуежай");
  assert.equal(airport.length, 5);
  assert.equal(
    airport.find((row) => row.id.endsWith("translate-en"))?.messages[2].content,
    "airport",
  );
  assert.equal(
    airport.find((row) => row.id.endsWith("from-en"))?.messages[2].content,
    "әуежай",
  );
  assert.match(
    airport.find((row) => row.id.endsWith("example"))?.messages[2].content ??
      "",
    /әуежайға/,
  );
  for (const row of rows)
    assert.ok(row.messages.every((message) => message.content.trim()));
});
