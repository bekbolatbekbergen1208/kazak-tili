import { learningMemoryContext } from "./memory";
import { requestLocalChat } from "@/lib/ai/local";
import type { DoshaUserContext } from "@/lib/dosha/knowledge";
import { dosshaInstructions } from "@/lib/dosha/prompt";
import {
  parseWriting,
  writingInstructions,
  type WritingRequest,
} from "@/lib/dosha/writing";

export { dosshaInstructions } from "@/lib/dosha/prompt";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export function parseChat(body: unknown): {
  message: string;
  history: ChatMessage[];
  language: string;
  context: DoshaUserContext;
  writing?: WritingRequest;
} {
  if (!body || typeof body !== "object") throw Error("Invalid message");
  const b = body as Record<string, unknown>;
  if (
    typeof b.message !== "string" ||
    !b.message.trim() ||
    b.message.length > 2000
  )
    throw Error("Invalid message");
  const history = b.history ?? [];
  if (!Array.isArray(history) || history.length > 20)
    throw Error("Invalid history");
  for (const m of history)
    if (
      !m ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      m.content.length > 7000
    )
      throw Error("Invalid history");
  if (history.reduce((sum, m) => sum + m.content.length, 0) > 24000)
    throw Error("History too long");
  const rawContext =
    b.context && typeof b.context === "object"
      ? (b.context as Record<string, unknown>)
      : {};
  const context: DoshaUserContext = {};
  if (typeof rawContext.level === "string")
    context.level = rawContext.level.slice(0, 20);
  if (
    typeof rawContext.currentLesson === "number" &&
    Number.isInteger(rawContext.currentLesson) &&
    rawContext.currentLesson >= 1 &&
    rawContext.currentLesson <= 1000
  )
    context.currentLesson = rawContext.currentLesson;
  if (
    typeof rawContext.currentLesson === "string" &&
    /^(tourism|work|study|daily|books)-[a-z0-9-]{1,80}$/.test(
      rawContext.currentLesson,
    )
  )
    context.currentLesson = rawContext.currentLesson;
  for (const key of [
    "currentRegion",
    "selectedTrack",
    "preferredLanguage",
  ] as const)
    if (typeof rawContext[key] === "string")
      context[key] = rawContext[key].slice(0, 80);
  if (typeof rawContext.xp === "number" && Number.isInteger(rawContext.xp))
    context.xp = Math.max(0, Math.min(rawContext.xp, 10_000_000));
  if (Array.isArray(rawContext.recentlyCompletedLessons))
    context.recentlyCompletedLessons = rawContext.recentlyCompletedLessons
      .filter((item): item is string => typeof item === "string")
      .slice(0, 10)
      .map((item) => item.slice(0, 80));
  return {
    message: b.message.trim(),
    history: history.map(({ role, content }) => ({ role, content })),
    language:
      typeof b.language === "string" &&
      ["kk", "ru", "en", "zh", "es", "de", "fr"].includes(b.language)
        ? b.language
        : "kk",
    context,
    writing: parseWriting(b.writing),
  };
}
export function boundedHistory(messages: ChatMessage[], max = 20) {
  const result: ChatMessage[] = [];
  let length = 0;
  for (const message of messages.slice(-max).reverse()) {
    if (length + message.content.length > 24000) break;
    result.unshift(message);
    length += message.content.length;
  }
  return result;
}
export async function requestDossha({
  key: _key,
  model,
  history,
  message,
  language,
  context,
  writing,
  memory,
  signal,
  fetcher = fetch,
}: {
  key: string;
  model: string;
  history: ChatMessage[];
  message: string;
  language: string;
  context?: string;
  writing?: WritingRequest;
  memory?: unknown;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}) {
  const reply = await requestLocalChat({
    model,
    fetcher,
    signal,
    maxTokens: 2400,
    messages: [
      {
        role: "system",
        content: `${dosshaInstructions}\nТүсіндіру тілінің таңдауы: ${language}.${writing ? `\n${writingInstructions(writing)}` : ""}${context ? `\nҚосымша тексерілген контекст:\n${context}` : ""}`,
      },
      ...(learningMemoryContext(memory)
        ? [{ role: "user" as const, content: learningMemoryContext(memory) }]
        : []),
      ...boundedHistory(history),
      { role: "user", content: message },
    ],
  });
  return reply.slice(0, 7000);
}
