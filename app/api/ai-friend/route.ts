import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  boundedHistory,
  parseChat,
  requestDossha,
  type ChatMessage,
} from "@/lib/friend/chat";
import { readLearningMemory, updateLearningMemory } from "@/lib/friend/memory";
import { referenceAnswer } from "@/lib/friend/knowledge";
import { localAiConfigured } from "@/lib/ai/local";
import { isSameOrigin } from "@/utils/request-origin";
import { boundedJson } from "@/utils/bounded-body";
const limits = new Map<string, { timestamps: number[]; busy: boolean }>();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const chatModel = () => process.env.QAZAQDOS_CHAT_MODEL;
export async function GET() {
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  const saved = user
    ? await db
        .from("qd_friend_conversations")
        .select("messages")
        .eq("user_id", user.id)
        .maybeSingle()
    : null;
  const configured = localAiConfigured(chatModel());
  return json({
    mode: configured && user ? "ai" : "reference",
    signedIn: !!user,
    history: saved?.data?.messages ?? [],
    persistence: !!user && !saved?.error,
    aiConfigured: configured,
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  let input;
  try {
    input = parseChat(await boundedJson(req, 160000));
  } catch {
    return json(
      {
        error:
          "Хабарлама 1–2000 таңбадан тұруы керек. Сұрағыңды қысқартып көр.",
      },
      400,
    );
  }
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  const model = chatModel();
  const live = localAiConfigured(model) && !!user;
  const now = Date.now();
  // Single-process limits for the existing PM2 deployment. Use a shared store
  // before deploying multiple instances of the chat server.
  for (const [id, entry] of limits)
    if (!entry.busy && entry.timestamps.every((t) => t < now - 3600000))
      limits.delete(id);
  const limit = user
    ? (limits.get(user.id) ?? { timestamps: [], busy: false })
    : null;
  if (limit) {
    limit.timestamps = limit.timestamps.filter((t) => t > now - 3600000);
    if (
      limit.busy ||
      limit.timestamps.filter((t) => t > now - 60000).length >= 12 ||
      limit.timestamps.length >= 100
    )
      return json(
        {
          error:
            "Сәл күте тұр: хабарлама шегіне жеттің. Біраздан кейін қайта жібер.",
        },
        429,
      );
    if (limits.size >= 10000 && !limits.has(user!.id))
      return json(
        { error: "Досшаға қазір сұрау көп. Кейінірек қайталап көр." },
        429,
      );
    limit.timestamps.push(now);
    limit.busy = true;
    limits.set(user!.id, limit);
  }
  try {
    const previous = user
      ? await db
          .from("qd_friend_conversations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
      : null;
    const memory = readLearningMemory(previous?.data?.learning_memory);
    if (!input.history.length && previous?.data?.messages) {
      try {
        input.history = parseChat({
          message: input.message,
          history: previous.data.messages,
        }).history;
      } catch {
        /* Ignore invalid stored history. */
      }
    }
    const reference = referenceAnswer(input.message, input.history);
    const reply = live
      ? await requestDossha({
          key: "",
          model: model!,
          ...input,
          memory,
          signal: req.signal,
          context: reference.topic ? reference.reply : undefined,
        })
      : reference.reply;
    const history: ChatMessage[] = boundedHistory([
      ...input.history,
      { role: "user", content: input.message },
      { role: "assistant", content: reply },
    ]);
    const record = user
      ? {
          user_id: user.id,
          messages: history,
          updated_at: new Date().toISOString(),
        }
      : null;
    let saved = record
      ? await db.from("qd_friend_conversations").upsert(
          {
            ...record,
            learning_memory: updateLearningMemory(memory, input.message),
          },
          { onConflict: "user_id" },
        )
      : null;
    const memorySaved = !!user && !saved?.error;
    // Keep saving conversations on installations awaiting the memory migration.
    if (
      record &&
      saved?.error &&
      ["42703", "PGRST204"].includes(saved.error.code)
    ) {
      saved = await db
        .from("qd_friend_conversations")
        .upsert(record, { onConflict: "user_id" });
    }
    return json({
      reply,
      mode: live ? "ai" : "reference",
      saved: !!user && !saved?.error,
      memorySaved,
      history,
      notice: live
        ? undefined
        : "Анықтамалық режимі: өз серверіңдегі AI тек аккаунтпен кіргенде қосылады.",
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.message === "AI_BUSY"
            ? "Досшаға қазір сұрау көп. Біраздан кейін қайта жібер."
            : "Досша жауап бере алмады. Хабарламаң енгізу өрісіне қайтарылады — қайта жіберіп көр.",
      },
      503,
    );
  } finally {
    if (limit) limit.busy = false;
  }
}
