import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProgressWriter } from "@/utils/supabase/admin";
import { isSameOrigin } from "@/utils/request-origin";
import { boundedJson } from "@/utils/bounded-body";
import {
  initialLanguageState,
  applyLanguageAction,
} from "@/lib/literary/state";
import type { LanguageAction } from "@/lib/literary/types";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return json(
      {
        error: "Сөздік пен прогрессті сақтау үшін аккаунтқа кіріңіз.",
        signedIn: false,
      },
      401,
    );
  const found = await db
    .from("qd_language_states")
    .select("state,revision")
    .eq("user_id", user.id)
    .maybeSingle();
  if (found.error)
    return json(
      { error: "Тіл қабатының Supabase миграциясын қолданыңыз." },
      503,
    );
  const profile = await db
    .from("q_level_profiles")
    .select("overall_level")
    .eq("user_id", user.id)
    .maybeSingle();
  return json({
    state: found.data?.state ?? initialLanguageState(),
    revision: found.data?.revision ?? 0,
    signedIn: true,
    level: profile.data?.overall_level ?? "A1",
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return json({ error: "Аккаунтқа кіріңіз." }, 401);
  const writer = createProgressWriter();
  if (!writer)
    return json({ error: "Сервердегі Supabase кілтін баптаңыз." }, 503);
  try {
    const body = (await boundedJson(req, 12000)) as {
      action: LanguageAction;
      revision: number;
    };
    if (!body || !body.action || !Number.isInteger(body.revision))
      throw Error("Әрекет жарамсыз.");
    const current = await db
      .from("qd_language_states")
      .select("state,revision")
      .eq("user_id", user.id)
      .maybeSingle();
    if (current.error)
      return json({ error: "Тіл қабатының миграциясын қолданыңыз." }, 503);
    const revision = current.data?.revision ?? 0;
    if (revision !== body.revision)
      return json(
        { error: "Прогресс басқа бетте өзгерген. Қайта жүктеңіз." },
        409,
      );
    const out = applyLanguageAction(
      current.data?.state ?? initialLanguageState(),
      body.action,
    );
    const saved = await writer.rpc("qd_language_save", {
      p_user: user.id,
      p_state: out.state,
      p_revision: revision,
      p_xp: out.xp,
    });
    if (saved.error)
      return json({ error: "Сақталмады. Қайта жүктеп, қайталаңыз." }, 409);
    return json({ ...out, revision: saved.data });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Жарамсыз дерек." },
      400,
    );
  }
}
