import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProgressWriter } from "@/utils/supabase/admin";
import { isSameOrigin } from "@/utils/request-origin";
import {
  beginner,
  getQuestion,
  publicQuestion,
  startAttempt,
  submitAnswer,
} from "@/lib/q-level/engine";
import type { Attempt, Result } from "@/lib/q-level/types";
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });
function reviewFor(a: Attempt | null) {
  return a?.completed
    ? a.answers.map((answer) => {
        const question = getQuestion({ ...a, questionId: answer.questionId });
        return {
          question: question?.question ?? answer.questionId,
          answer: answer.value,
          correct: answer.correct,
          explanation: question?.explanation ?? "Бағалау күтілуде.",
        };
      })
    : [];
}
function view(a: Attempt | null, demo = false) {
  return a
    ? {
        review: reviewFor(a),
        attempt: {
          ...a,
          answers: a.answers.map((x) => ({
            ...x,
            value: a.completed ? x.value : "",
            correct: a.completed || demo ? x.correct : null,
          })),
        },
        question: a.completed
          ? null
          : getQuestion(a)
            ? publicQuestion(getQuestion(a)!)
            : null,
      }
    : { attempt: null, question: null };
}
export async function GET() {
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return fail("Аккаунтқа кіріңіз немесе демо режимін таңдаңыз.", 401);
  const [attempts, history, leaders, completed] = await Promise.all([
    db
      .from("q_level_attempts")
      .select("state")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .maybeSingle(),
    db
      .from("q_level_history")
      .select("result")
      .eq("user_id", user.id)
      .order("test_date", { ascending: true })
      .limit(200),
    db.rpc("q_level_public_leaderboard"),
    db
      .from("q_level_attempts")
      .select("state")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (attempts.error || history.error || leaders.error)
    return fail(
      "Q-Level дерекқорын баптау қажет. Жаңа Supabase миграциясын қолданыңыз.",
      503,
    );
  return NextResponse.json({
    ...view(attempts.data?.state ?? null),
    review: reviewFor(completed.data?.state ?? null),
    history: history.data.map((x) => x.result),
    leaders: leaders.data,
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return fail("Invalid origin", 403);
  let b;
  try {
    const raw = await req.text();
    if (raw.length > 100000) throw Error();
    b = JSON.parse(raw);
  } catch {
    return fail("Сұрау дұрыс емес.");
  }
  if (
    !["start", "answer", "audio", "beginner", "visibility"].includes(b.action)
  )
    return fail("Әрекет табылмады.");
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  const demo = b.demo === true;
  if (!user && !demo) return fail("Аккаунтқа кіріңіз.", 401);
  const writer = demo ? null : createProgressWriter();
  if (!demo && !writer)
    return fail("Q-Level сақтау үшін сервердің Supabase кілтін баптаңыз.", 503);
  let a: Attempt | null = null,
    revision = 0,
    history: Result[] = [],
    lessons = 0,
    excluded: string[] = [];
  if (demo) {
    a = b.attempt ?? null;
    if (
      a &&
      (!Array.isArray(a.answers) ||
        a.answers.length > 22 ||
        !["quick", "full"].includes(a.type))
    )
      return fail("Демо тестті қайта бастаңыз.");
  } else {
    const [active, h, learning, prior] = await Promise.all([
      db
        .from("q_level_attempts")
        .select("state,revision")
        .eq("user_id", user!.id)
        .is("completed_at", null)
        .maybeSingle(),
      db
        .from("q_level_history")
        .select("result")
        .eq("user_id", user!.id)
        .order("test_date", { ascending: true }),
      db
        .from("qd_learning_states")
        .select("state")
        .eq("user_id", user!.id)
        .maybeSingle(),
      db
        .from("q_level_attempts")
        .select("state")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(2),
    ]);
    if (active.error || h.error)
      return fail("Q-Level миграциясын қолданыңыз.", 503);
    a = active.data?.state ?? null;
    revision = active.data?.revision ?? 0;
    history = (h.data ?? []).map((x) => x.result);
    lessons = Object.values(
      learning.data?.state?.progress?.lessons ?? {},
    ).filter((x) => !!(x as { completedAt?: string }).completedAt).length;
    excluded = (prior.data ?? []).flatMap((x) =>
      (x.state as Attempt).answers.map((y) => y.questionId),
    );
  }
  try {
    if (b.action === "visibility") {
      if (demo) return fail("Демо нәтижелер рейтингке жіберілмейді.");
      const r = history.at(-1);
      if (!r) return fail("Алдымен тест тапсырыңыз.");
      const alias =
        typeof b.alias === "string" ? b.alias.trim().slice(0, 24) : "";
      if (alias.length < 2) return fail("Бөлісу үшін лақап ат енгізіңіз.");
      const base = (days: number) =>
        history.find((x) => Date.parse(x.date) >= Date.now() - days * 86400000)
          ?.score ?? r.score;
      const { error } = await writer!
        .from("q_level_leaderboard_snapshots")
        .upsert({
          user_id: user!.id,
          display_name: alias,
          visible: b.visible === true,
          weekly_growth: Math.max(0, r.score - base(7)),
          monthly_growth: Math.max(0, r.score - base(30)),
          current_score: r.score,
          level: r.level,
          period: new Date().toISOString().slice(0, 10),
        });
      if (error) return fail("Рейтингке сақтау орындалмады.", 503);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "beginner") {
      const result = beginner();
      if (!demo) {
        if (history.length)
          return fail(
            "Деңгейіңіз анықталған. Оны өзгерту үшін тест тапсырыңыз.",
          );
        if (a) return fail("Белсенді тестті алдымен аяқтаңыз.");
        const { error } = await writer!.rpc("q_level_beginner", {
          p_user: user!.id,
          p_result: result,
        });
        if (error) return fail("Нәтиже сақталмады. Бетті жаңартыңыз.", 409);
      }
      return NextResponse.json({ result, ...view(null, demo) });
    }
    if (b.action === "start") {
      if (a) return NextResponse.json({ ...view(a, demo), resumed: true });
      if (!["quick", "full"].includes(b.type))
        return fail("Тест түрін таңдаңыз.");
      if (!demo && b.type === "full") {
        const last = history.filter((x) => x.type === "full").at(-1);
        if (last && Date.now() - Date.parse(last.date) < 7 * 86400000)
          return fail(
            "Толық тестті 7 күннен кейін қайталаңыз. Әзірге Quick Check қолжетімді.",
            429,
          );
      }
      a = startAttempt(b.type, lessons, excluded);
      if (!demo) {
        const { error } = await writer!
          .from("q_level_attempts")
          .insert({ id: a.id, user_id: user!.id, test_type: a.type, state: a });
        if (error)
          return fail("Тестті бастау мүмкін болмады. Бетті жаңартыңыз.", 409);
      }
      return NextResponse.json(view(a, demo));
    }
    if (!a) return fail("Белсенді тест табылмады.");
    if (b.questionId !== a.questionId)
      return fail("Сұрақ өзгерген. Бетті жаңартыңыз.", 409);
    if (b.action === "audio") {
      const q = getQuestion(a);
      if (q?.skill !== "listening") return fail("Аудио сұрақ емес.");
      return NextResponse.json({
        audioUrl: q.audio_url ?? null,
        speechText: q.text_content,
      });
    }
    const elapsed = Math.max(0, (Date.now() - Date.parse(a.updatedAt)) / 1000);
    const updated = submitAnswer(
      a,
      b.value,
      elapsed,
      history.at(-1)?.score ?? null,
      excluded,
    );
    if (!demo) {
      const { error } = await writer!.rpc("q_level_save", {
        p_user: user!.id,
        p_state: updated,
        p_revision: revision,
        p_result: updated.result ?? null,
      });
      if (error)
        return fail("Жауап сақталмады. Бетті жаңартып, жалғастырыңыз.", 409);
    }
    return NextResponse.json({
      ...view(updated, demo),
      result: updated.result ?? null,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Тестті өңдеу қатесі.");
  }
}
