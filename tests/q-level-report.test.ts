import test from "node:test";
import assert from "node:assert/strict";
import { beginner } from "../lib/q-level/engine";
import { resultDocument } from "../lib/q-level/report";
test("result document preserves unassessed skills and escapes user content", () => {
  const result = beginner(); result.feedback = ['<script>alert("x")</script>'];
  const html = resultDocument(result);
  assert.ok(html.includes("Бағаланбаған"));
  assert.ok(html.includes("ресми тіл сертификаты емес"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes(result.id));
});
