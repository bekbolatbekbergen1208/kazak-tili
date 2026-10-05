import assert from "node:assert/strict";
import test from "node:test";
import { literaryDnaGuidance } from "../lib/literary/dna-mixer";

test("Literary DNA activates for suitable B1+ language tasks without exposing author names", () => {
  const guidance = literaryDnaGuidance(
    "B1 деңгейінде теңізді көркем сипатта",
    "B1",
    "literary",
  );
  assert.match(guidance, /Literary DNA guidance/);
  assert.match(guidance, /сөздік байлық|нақты сипаттау/);
  assert.doesNotMatch(
    guidance,
    /Әуезов|Мүсірепов|Нұршайықов|Мағауин|Абай жолы|Ұлпан|Шақан-Шері/,
  );
});

test("Literary DNA stays off for beginners and unrelated technical questions", () => {
  assert.equal(
    literaryDnaGuidance("Теңізді сипатта", "A1", "simple"),
    "",
  );
  assert.equal(
    literaryDnaGuidance("Arduino-да пин не үшін керек?", "B1", "friendly"),
    "",
  );
});

test("Literary DNA keeps B1 guidance milder than C1", () => {
  const b1 = literaryDnaGuidance(
    "Табиғатты көркем сипатта",
    "B1",
    "literary",
  );
  const c1 = literaryDnaGuidance(
    "Табиғатты көркем сипатта",
    "C1",
    "literary",
  );
  const maxValue = (text: string) =>
    Math.max(...[...text.matchAll(/=(0\.\d+|1\.00)/g)].map((m) => Number(m[1])));
  assert.ok(maxValue(b1) <= 0.62);
  assert.ok(maxValue(c1) >= maxValue(b1));
});
