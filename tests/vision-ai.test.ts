import test from "node:test";
import assert from "node:assert/strict";
import {
  parseVisionResult,
  requestVision,
  validateVisionImage,
} from "../lib/vision/recognize";
import { createVisionLimiter } from "../lib/vision/limit";
import { boundedJson } from "../utils/bounded-body";
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9QAAAABJRU5ErkJggg==";
const object = {
  id: null,
  kk: "домбыра",
  ru: "домбра",
  en: "dombra",
  plural: "домбыралар",
  example: "Мен домбыра тартамын.",
  description: "Екі ішекті аспап.",
  confidence: 0.9,
};
const result = {
  quality: "clear",
  summary: "Үстелде домбыра мен кітап тұр.",
  tip: "",
  objects: [object, { ...object, id: "book", kk: "қате атау" }],
};
test("vision recognizes outside the catalog and keeps catalog vocabulary authoritative", () => {
  const parsed = parseVisionResult(result);
  assert.equal(parsed.word, null);
  assert.equal(parsed.objects[0].kk, "домбыра");
  assert.equal(parsed.objects[1].kk, "кітап");
  assert.deepEqual(parsed.alternatives, [{ id: "book", kk: "кітап" }]);
  assert.equal(
    parseVisionResult({ ...result, quality: "blurry" }).confidence,
    0.65,
  );
  assert.deepEqual(
    parseVisionResult({ ...result, quality: "no_objects" }).objects,
    [],
  );
});
test("vision rejects malformed and forged model output, deduplicates objects", () => {
  for (const bad of [
    null,
    {},
    { ...result, quality: "perfect" },
    { ...result, objects: Array(7).fill(object) },
    ...[
      { confidence: "1" },
      { confidence: 2 },
      { confidence: NaN },
      { id: "forged" },
      { kk: "" },
      { example: "x".repeat(601) },
    ].map((override) => ({ ...result, objects: [{ ...object, ...override }] })),
  ])
    assert.throws(() => parseVisionResult(bad));
  assert.equal(
    parseVisionResult({ ...result, objects: [object, object] }).objects.length,
    1,
  );
});
test("image input rejects URLs, disguised files, invalid base64 and excessive size", () => {
  assert.equal(validateVisionImage(image), image);
  for (const bad of [
    null,
    "https://example.com/image.png",
    image.replace("png", "jpeg"),
    "data:image/png;base64,aGVsbG8=",
    image + "!",
    "x".repeat(4_500_001),
  ])
    assert.throws(() => validateVisionImage(bad));
});
test("vision can use a configured local AI endpoint", async () => {
  process.env.QAZAQDOS_AI_BASE_URL = "http://127.0.0.1:11434/v1";
  const response = await requestVision({
    key: "",
    model: "local-vision",
    image,
    fetcher: async (url, init) => {
      assert.equal(url, "http://127.0.0.1:11434/api/chat");
      const b = JSON.parse(String(init?.body));
      assert.equal(b.model, "local-vision");
      assert.equal(b.stream, false);
      assert.equal(b.messages[1].images[0], image.split(",")[1]);
      assert.match(b.messages[0].content, /Catalog/);
      assert.ok(init?.signal);
      return Response.json({
        message: { content: JSON.stringify(result) },
      });
    },
  });
  assert.equal(response.objects.length, 2);
  delete process.env.QAZAQDOS_AI_BASE_URL;
});
test("vision degrades safely when the model returns malformed JSON", async () => {
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
  const response = await requestVision({
    key: "",
    model: "gemma3:4b",
    image,
    fetcher: async () => Response.json({ message: { content: "not-json" } }),
  });
  assert.equal(response.quality, "uncertain");
  assert.deepEqual(response.objects, []);
  delete process.env.OLLAMA_BASE_URL;
});
test("vision budget prevents concurrent calls and enforces minute/hour windows", () => {
  const acquire = createVisionLimiter();
  const release = acquire("user", 0)!;
  assert.equal(acquire("user", 1), null);
  release();
  for (let i = 1; i < 6; i++) acquire("user", i)!();
  assert.equal(acquire("user", 6), null);
  assert.ok(acquire("another-user", 6));
  for (let i = 6; i < 40; i++) acquire("user", i * 60001)!();
  assert.equal(acquire("user", 40 * 60001), null);
  assert.ok(acquire("user", 3600001));
});
test("bounded body enforces streamed bytes without trusting Content-Length", async () => {
  const req = (body: string) =>
    new Request("http://localhost", { method: "POST", body });
  assert.deepEqual(await boundedJson(req('{"message":"сәлем"}'), 100), {
    message: "сәлем",
  });
  await assert.rejects(
    boundedJson(req('{"message":"сәлем"}'), 10),
    /BODY_TOO_LARGE/,
  );
  await assert.rejects(boundedJson(req("not-json"), 100));
});
