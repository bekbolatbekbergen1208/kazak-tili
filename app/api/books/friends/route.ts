import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProgressWriter } from "@/utils/supabase/admin";
import { readingBooks } from "@/lib/books/catalog";
import type { LearningState } from "@/lib/learning/types";
import { isSameOrigin } from "@/utils/request-origin";

const error = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });
async function handle(req: Request, mutate: boolean) {
  if (mutate && !isSameOrigin(req)) return error("Invalid origin", 403);
  const auth = createClient(await cookies());
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return error("Аккаунтпен кіру қажет.", 401);
  const db = createProgressWriter();
  if (!db)
    return error(
      "Достар лигасы әлі бапталмаған. Жеке оқу бөліміне орала аласың.",
      503,
    );
  const member = await db
    .from("qd_reading_members")
    .select("invite_code")
    .eq("user_id", user.id)
    .maybeSingle();
  if (member.error)
    return error(
      "Достар лигасы әзірге қолжетімсіз. Кейінірек қайталап көр.",
      503,
    );
  let code = member.data?.invite_code ?? null;
  if (mutate) {
    let body;
    try {
      const raw = await req.text();
      if (raw.length > 500) throw Error();
      body = JSON.parse(raw);
      if (!body || typeof body.type !== "string") throw Error();
    } catch {
      return error("Жарамсыз сұрау.");
    }
    if (body.type === "enable") {
      if (!code) {
        const created = await db
          .from("qd_reading_members")
          .upsert(
            { user_id: user.id, invite_code: randomBytes(6).toString("hex") },
            { onConflict: "user_id", ignoreDuplicates: true },
          );
        if (created.error) return error("Кодты жасау мүмкін болмады.", 503);
        const fresh = await db
          .from("qd_reading_members")
          .select("invite_code")
          .eq("user_id", user.id)
          .single();
        if (fresh.error) return error("Кодты жүктеу мүмкін болмады.", 503);
        code = fresh.data.invite_code;
      }
    } else if (body.type === "join") {
      if (
        !code ||
        typeof body.code !== "string" ||
        !/^[a-f0-9]{12}$/i.test(body.code)
      )
        return error("12 таңбалы шақыру кодын тексер.");
      const friend = await db
        .from("qd_reading_members")
        .select("user_id")
        .eq("invite_code", body.code.toLowerCase())
        .maybeSingle();
      if (friend.error) return error("Байланысты тексеріп, қайталап көр.", 503);
      if (!friend.data || friend.data.user_id === user.id)
        return error("Досыңның жарамды кодын енгіз.");
      for (const id of [user.id, friend.data.user_id]) {
        const count = await db
          .from("qd_reading_friends")
          .select("user_a", { count: "exact", head: true })
          .or(`user_a.eq.${id},user_b.eq.${id}`);
        if (count.error)
          return error("Байланысты тексеріп, қайталап көр.", 503);
        if ((count.count ?? 0) >= 50)
          return error("Лигада 50 досқа дейін қосуға болады.");
      }
      const [a, b] = [user.id, friend.data.user_id].sort();
      const saved = await db
        .from("qd_reading_friends")
        .upsert(
          { user_a: a, user_b: b },
          { onConflict: "user_a,user_b", ignoreDuplicates: true },
        );
      if (saved.error) return error("Досты қосу мүмкін болмады.", 503);
    } else if (body.type === "remove") {
      if (
        typeof body.friendId !== "string" ||
        !/^[a-f0-9-]{36}$/i.test(body.friendId)
      )
        return error("Жарамсыз дос.");
      const [a, b] = [user.id, body.friendId].sort();
      const removed = await db
        .from("qd_reading_friends")
        .delete()
        .eq("user_a", a)
        .eq("user_b", b);
      if (removed.error) return error("Досты алып тастау мүмкін болмады.", 503);
    } else return error("Жарамсыз әрекет.");
  }
  if (!code) return NextResponse.json({ code: null, friends: [] });
  const links = await db
    .from("qd_reading_friends")
    .select("user_a,user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .limit(50);
  if (links.error) return error("Рейтингті жүктеу мүмкін болмады.", 503);
  const ids = [
    user.id,
    ...(links.data ?? []).map((l) =>
      l.user_a === user.id ? l.user_b : l.user_a,
    ),
  ];
  const states = await db
    .from("qd_learning_states")
    .select("user_id,state")
    .in("user_id", ids);
  if (states.error) return error("Рейтингті жүктеу мүмкін болмады.", 503);
  const friends = ids
    .map((id) => {
      const state = states.data?.find((s) => s.user_id === id)?.state as
        LearningState | undefined;
      return {
        id,
        nickname: state?.profile.nickname ?? "Оқырман",
        books: readingBooks.filter(
          (b) => state?.progress.reading?.books[b.id]?.certifiedAt,
        ).length,
        xp: (state?.progress.xpTransactions ?? [])
          .filter((t) => t.id.startsWith("reading-"))
          .reduce((sum, t) => sum + t.amount, 0),
        me: id === user.id,
      };
    })
    .sort(
      (a, b) =>
        b.books - a.books ||
        b.xp - a.xp ||
        a.nickname.localeCompare(b.nickname),
    );
  return NextResponse.json(
    { code, friends },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export const GET = (req: Request) => handle(req, false);
export const POST = (req: Request) => handle(req, true);
