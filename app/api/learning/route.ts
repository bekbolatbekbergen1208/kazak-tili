import { createProgressWriter } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { applyAction, initialState } from "@/lib/learning/state";
import type { LearningAction, LearningState } from "@/lib/learning/types";
import { hydrateCharacters } from "@/lib/characters/state";
export async function GET() {
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { data, error } = await db
    .from("qd_learning_states")
    .select("state, revision")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Database setup required. Apply the QazaqDos migration." },
      { status: 503 },
    );
  const fresh = initialState();
  const nickname = user.user_metadata?.nickname;
  if (!data && typeof nickname === "string" && nickname.trim().length >= 2)
    fresh.profile.nickname = nickname.trim().slice(0, 24);
  return NextResponse.json({
    state: hydrateCharacters(data?.state ?? fresh),
    revision: data?.revision ?? 0,
    userId: user.id,
  });
}
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  let body;
  try {
    const raw = await req.text();
    if (raw.length > 12000) throw new Error();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const allowed = [
    "national-buy",
    "national-start",
    "national-answer",
    "national-shot",
    "national-upgrade",
    "national-daily",
    "national-settings",
    "travel-visit",
    "travel-section",
    "travel-object",
    "travel-word",
    "travel-game",
    "travel-settings",
    "travel-camera",
    "travel-announce",
    "profile",
    "start",
    "answer",
    "finish",
    "review",
    "claim",
    "buy",
    "select-character",
    "reveal-character",
    "equip",
    "unequip",
  ];
  if (
    !body.action ||
    !allowed.includes(body.action.type) ||
    !Number.isInteger(body.revision)
  )
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const { data, error } = await db
    .from("qd_learning_states")
    .select("state,revision")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Database setup required. Apply the QazaqDos migration." },
      { status: 503 },
    );
  if ((data?.revision ?? 0) !== body.revision)
    return NextResponse.json(
      { error: "Progress changed in another tab. Reload and try again." },
      { status: 409 },
    );
  let state: LearningState;
  try {
    state = applyAction(
      data?.state ?? initialState(),
      body.action as LearningAction,
    );
  } catch {
    return NextResponse.json(
      {
        error: "This action is not available. Check your answers and progress.",
      },
      { status: 400 },
    );
  }
  const writer = createProgressWriter();
  if (!writer)
    return NextResponse.json(
      {
        error:
          "Saving requires SUPABASE_SECRET_KEY on the server and migrations 006–007.",
      },
      { status: 503 },
    );
  const writeDb = writer ?? db;
  const result = data
    ? await writeDb
        .from("qd_learning_states")
        .update({
          state,
          revision: body.revision + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("revision", body.revision)
        .select("revision")
        .maybeSingle()
    : await writeDb
        .from("qd_learning_states")
        .insert({ user_id: user.id, state, revision: 1 })
        .select("revision")
        .single();
  if (result.error || !result.data)
    return NextResponse.json(
      { error: "Could not save progress. Reload and retry." },
      { status: 409 },
    );
  return NextResponse.json({ state, revision: body.revision + 1 });
}
