import test from "node:test";
import assert from "node:assert/strict";
import { wordAt } from "../lib/translation/words";

test("Kazakh words retain their inflection and exclude punctuation", () => {
  const word = "Кітаптарды";
  const text = `«${word}» оқы.`;
  assert.deepEqual(wordAt(text, 4), { word, start: 1, end: 1 + word.length });
  assert.equal(wordAt(text, 1 + word.length), null);
  assert.equal(wordAt(text, 2 + word.length), null);
});
test("word lookup handles Latin accents, combining marks and non-space scripts", () => {
  assert.equal(wordAt("café!", 2)?.word, "café");
  assert.equal(wordAt("cafe\u0301!", 4)?.word, "cafe\u0301");
  assert.ok(wordAt("你好世界", 0)?.word);
  assert.equal(wordAt("", 0), null);
  assert.equal(wordAt("Hello", 5), null);
});
