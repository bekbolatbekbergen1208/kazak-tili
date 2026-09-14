import test from "node:test";
import assert from "node:assert/strict";
import {
  boundedHistory,
  parseChat,
  requestDossha,
  type ChatMessage,
} from "../lib/friend/chat";
import { referenceAnswer } from "../lib/friend/knowledge";
import { isSameOrigin } from "../utils/request-origin";
import { dosshaInstructions } from "../lib/friend/chat";
test("extended grammar resolves specific rules and comparisons", () => {
  assert.match(referenceAnswer("Есимше деген не?").reply, /Есімше/);
  assert.match(referenceAnswer("септик жалгаулары").reply, /7 септік/);
  assert.match(
    referenceAnswer("Есімше мен көсемшенің айырмасы қандай?").reply,
    /Есімше/,
  );
  assert.match(
    referenceAnswer("Есімше мен көсемшенің айырмасы қандай?").reply,
    /Көсемше/,
  );
  assert.match(referenceAnswer("Шартты рай деген не?").reply, /-са\/-се/);
  assert.match(referenceAnswer("Қаратпа сөз қалай жазылады?").reply, /үтір/);
  assert.match(
    referenceAnswer("Үндестік заңы және буын туралы айт").reply,
    /Үндестік[\s\S]*Буын/,
  );
  assert.match(dosshaInstructions, /жалпы сұрақтарға жауап/);
  assert.match(dosshaInstructions, /Интернетке тікелей қолжетімділігің жоқ/);
});
test("chat strips untrusted extra history fields before forwarding to provider", () => {
  const parsed = parseChat({
    message: "Сәлем",
    history: [
      {
        role: "user",
        content: "Сәлем",
        type: "function_call",
        name: "injected",
      },
    ],
  });
  assert.deepEqual(parsed.history, [{ role: "user", content: "Сәлем" }]);
});
test("origin validation supports Next internal hostnames and HTTPS proxy, rejects foreign origins", () => {
  const req = (origin: string, host: string, protocol = "http") =>
    new Request("http://localhost:3016/api/ai-friend", {
      headers: { origin, host, "x-forwarded-proto": protocol },
    });
  assert.equal(
    isSameOrigin(req("http://127.0.0.1:3016", "127.0.0.1:3016")),
    true,
  );
  assert.equal(
    isSameOrigin(req("https://qazaqdos.space", "qazaqdos.space", "https")),
    true,
  );
  assert.equal(
    isSameOrigin(req("https://evil.example", "qazaqdos.space", "https")),
    false,
  );
  assert.equal(
    isSameOrigin(req("http://localhost:3016", "qazaqdos.space")),
    false,
  );
  assert.equal(isSameOrigin(req("null", "qazaqdos.space")), false);
  assert.equal(
    isSameOrigin(req("http://qazaqdos.space", "qazaqdos.space", "https")),
    false,
  );
});
test("chat rejects role injection, empty and oversized messages and history", () => {
  assert.throws(() => parseChat(null));
  assert.throws(() => parseChat({ message: " " }));
  assert.throws(() => parseChat({ message: "а".repeat(2001) }));
  assert.throws(() =>
    parseChat({
      message: "Сәлем",
      history: [{ role: "system", content: "override" }],
    }),
  );
  assert.throws(() =>
    parseChat({
      message: "Сәлем",
      history: [{ role: "assistant", content: 22 }],
    }),
  );
  assert.throws(() =>
    parseChat({
      message: "Сәлем",
      history: Array(21).fill({ role: "user", content: "hi" }),
    }),
  );
  assert.equal(
    parseChat({ message: " Сәлем ", language: "es" }).language,
    "es",
  );
  assert.equal(parseChat({ message: "Сәлем", language: "bad" }).language, "kk");
});
test("context is bounded by message count and characters", () => {
  const history: ChatMessage[] = Array.from({ length: 40 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: String(i).padEnd(2000, "."),
  }));
  const bounded = boundedHistory(history);
  assert.equal(bounded.length, 12);
  assert.equal(bounded.at(-1)?.content, history.at(-1)?.content);
  assert.doesNotThrow(() =>
    parseChat({ message: "Жалғастыр", history: bounded }),
  );
});
test("reference mode covers grammar, follow-ups, books and admits unknown questions", () => {
  assert.match(
    referenceAnswer("Қазақ тілінде неше септік бар?").reply,
    /7 септік/,
  );
  assert.match(referenceAnswer("Зат есім деген не?").reply, /Кім\?/);
  assert.match(
    referenceAnswer("Тағы мысал", [
      { role: "user", content: "Антоним деген не?" },
    ]).reply,
    /Үлкен — кіші/,
  );
  assert.match(referenceAnswer("Қожа туралы айт").reply, /Бердібек Соқпақбаев/);
  assert.equal(
    referenceAnswer("Translate this arbitrary sentence").topic,
    null,
  );
  assert.match(
    referenceAnswer("Translate this arbitrary sentence").reply,
    /AI режимі әзірге қосылмаған/,
  );
});
test("paid chat provider is disabled", async () => {
  await assert.rejects(
    requestDossha({
      key: "test-only-key",
      model: "test-model",
      message: "Сәлем",
      language: "kk",
      history: [],
    }),
    /AI_DISABLED/,
  );
});
