import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { boundedJson } from "@/utils/bounded-body";
import { isSameOrigin } from "@/utils/request-origin";
import { createAdminClient, isDosshaTeacher } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

async function auth() {
  const db = createClient(await cookies());
  const { data } = await db.auth.getUser();
  return { db, user: data.user };
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const { db, user } = await auth();
  if (!user) return json({ error: "Алдымен аккаунтқа кір." }, 401);
  let body: Record<string, unknown>;
  try {
    body = (await boundedJson(req, 12000)) as Record<string, unknown>;
  } catch {
    return json({ error: "Жарамсыз дерек." }, 400);
  }
  if (
    typeof body.id !== "string" ||
    !["helpful", "unhelpful"].includes(String(body.rating))
  )
    return json({ error: "Бағалау жарамсыз." }, 400);
  const rating = body.rating as "helpful" | "unhelpful";
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
  const result = await db
    .from("qd_dossha_feedback")
    .update({
      rating,
      learner_note: note || null,
      status: rating === "unhelpful" ? "review" : "rated",
    })
    .eq("id", body.id)
    .eq("user_id", user.id);
  if (result.error)
    return json({ error: "Бағалауды сақтау мүмкін болмады." }, 503);
  return json({ saved: true });
}

export async function GET() {
  const { user } = await auth();
  if (!user || !isDosshaTeacher(user))
    return json({ error: "Рұқсат жоқ." }, 403);
  const admin = createAdminClient();
  if (!admin) return json({ error: "Сервер кілті бапталмаған." }, 503);
  const result = await admin
    .from("qd_dossha_feedback")
    .select(
      "id,question,answer,rating,learner_note,status,teacher_correction,created_at",
    )
    .in("status", ["review", "corrected"])
    .order("created_at", { ascending: false })
    .limit(100);
  return result.error
    ? json({ error: "Кезекті жүктеу мүмкін болмады." }, 503)
    : json({ items: result.data });
}

export async function PATCH(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const { user } = await auth();
  if (!user || !isDosshaTeacher(user))
    return json({ error: "Рұқсат жоқ." }, 403);
  const admin = createAdminClient();
  if (!admin) return json({ error: "Сервер кілті бапталмаған." }, 503);
  let body: Record<string, unknown>;
  try {
    body = (await boundedJson(req, 16000)) as Record<string, unknown>;
  } catch {
    return json({ error: "Жарамсыз дерек." }, 400);
  }
  const id = typeof body.id === "string" ? body.id : "";
  const correction =
    typeof body.correction === "string" ? body.correction.trim() : "";
  if (!id || correction.length < 3 || correction.length > 5000)
    return json({ error: "Дұрыс жауап 3–5000 таңба болуы керек." }, 400);
  const found = await admin
    .from("qd_dossha_feedback")
    .select("question")
    .eq("id", id)
    .eq("status", "review")
    .maybeSingle();
  if (found.error || !found.data)
    return json({ error: "Жауап табылмады." }, 404);
  const knowledge = await admin.from("qd_dossha_knowledge").insert({
    source_feedback_id: id,
    question: found.data.question,
    answer: correction,
    approved_by: user.id,
  });
  if (knowledge.error) return json({ error: "Білім қорына қосылмады." }, 503);
  const updated = await admin
    .from("qd_dossha_feedback")
    .update({
      status: "corrected",
      teacher_correction: correction,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  return updated.error
    ? json({ error: "Күйді жаңарту мүмкін болмады." }, 503)
    : json({ saved: true });
}
