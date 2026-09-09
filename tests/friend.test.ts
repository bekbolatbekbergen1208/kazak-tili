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
test("Responses request keeps key server-side, carries context, and extracts actual output", async () => {
  const mock: typeof fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer test-only-key",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.equal(body.model, "test-model");
    assert.equal(body.input[0].content, "Септік туралы айт");
    assert.equal(body.input.at(-1).content, "Мысал келтір");
    assert.match(body.instructions, /Досша/);
    assert.match(body.instructions, /ru/);
    assert.ok(init?.signal);
    return Response.json({
      status: "completed",
      output: [
        { type: "reasoning", summary: [] },
        {
          type: "message",
          content: [{ type: "output_text", text: "Барыс септік: мектепке." }],
        },
      ],
    });
  };
  const answer = await requestDossha({
    key: "test-only-key",
    model: "test-model",
    message: "Мысал келтір",
    language: "ru",
    history: [{ role: "user", content: "Септік туралы айт" }],
    fetcher: mock,
  });
  assert.equal(answer, "Барыс септік: мектепке.");
});
test("provider failures never masquerade as successful canned answers", async () => {
  const args = {
    key: "test-only-key",
    model: "test-model",
    message: "Сәлем",
    language: "kk",
    history: [],
  };
  await assert.rejects(
    requestDossha({
      ...args,
      fetcher: async () => new Response("rate limited", { status: 429 }),
    }),
    /AI_BUSY/,
  );
  await assert.rejects(
    requestDossha({
      ...args,
      fetcher: async () => Response.json({ output: [] }),
    }),
    /AI_UNAVAILABLE/,
  );
  await assert.rejects(
    requestDossha({
      ...args,
      fetcher: async () =>
        Response.json({
          status: "incomplete",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "Partial" }],
            },
          ],
        }),
    }),
    /AI_UNAVAILABLE/,
  );
});
