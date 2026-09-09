import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  boundedHistory,
  parseChat,
  requestDossha,
  type ChatMessage,
} from "@/lib/friend/chat";
import { referenceAnswer } from "@/lib/friend/knowledge";
import { isSameOrigin } from "@/utils/request-origin";
const limits = new Map<string, { timestamps: number[]; busy: boolean }>();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
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
  return json({
    mode: process.env.OPENAI_API_KEY && user ? "ai" : "reference",
    signedIn: !!user,
    history: saved?.data?.messages ?? [],
    persistence: !!user && !saved?.error,
    aiConfigured: !!process.env.OPENAI_API_KEY,
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  let input;
  try {
    const raw = await req.text();
    if (raw.length > 40000) throw Error();
    input = parseChat(JSON.parse(raw));
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
  const key = process.env.OPENAI_API_KEY;
  const live = !!key && !!user;
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
    const reference = referenceAnswer(input.message, input.history);
    const reply = live
      ? await requestDossha({
          key: key!,
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          ...input,
          context: reference.topic ? reference.reply : undefined,
        })
      : reference.reply;
    const history: ChatMessage[] = boundedHistory([
      ...input.history,
      { role: "user", content: input.message },
      { role: "assistant", content: reply },
    ]);
    const saved = user
      ? await db.from("qd_friend_conversations").upsert(
          {
            user_id: user.id,
            messages: history,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      : null;
    return json({
      reply,
      mode: live ? "ai" : "reference",
      saved: !!user && !saved?.error,
      history,
      notice: !live
        ? key && !user
          ? "Еркін AI чаты үшін аккаунтпен кір. Қазір анықтамалық режимі жұмыс істейді."
          : "Анықтамалық режимі: еркін AI жауаптары әлі қосылмаған."
        : undefined,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.message === "AI_BUSY"
            ? "Досшаға қазір сұрақ көп. Біраздан кейін қайта жібер."
            : "Досша жауап бере алмады. Хабарламаң енгізу өрісіне қайтарылады — қайта жіберіп көр.",
      },
      503,
    );
  } finally {
    if (limit) limit.busy = false;
  }
}
