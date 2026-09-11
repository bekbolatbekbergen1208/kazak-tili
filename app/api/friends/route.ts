import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createProgressWriter } from "@/utils/supabase/admin";
import { isSameOrigin } from "@/utils/request-origin";
import type { LearningState } from "@/lib/learning/types";
import {
  friendLevel,
  learningDays,
  missionStats,
  safeMessages,
  sharedDays,
  sharedStreak,
} from "@/lib/friends/system";
const out = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "private, no-store" },
    }),
  uuid = /^[a-f0-9-]{36}$/i,
  code = /^[A-Z0-9]{8}$/;
async function route(req: Request, mutate: boolean) {
  if (mutate && !isSameOrigin(req))
    return out({ error: "Жарамсыз сұрау." }, 403);
  const auth = createClient(await cookies()),
    {
      data: { user },
    } = await auth.auth.getUser();
  if (!user)
    return out({ error: "Достық байланыс үшін аккаунтпен кіру қажет." }, 401);
  const db = createProgressWriter();
  if (!db) return out({ error: "Достық backend-і әлі бапталмаған." }, 503);
  let profile = (
    await db
      .from("qd_friend_profiles")
      .select("friend_code,username,timezone")
      .eq("user_id", user.id)
      .maybeSingle()
  ).data;
  let body: Record<string, unknown> = {};
  if (mutate) {
    try {
      const raw = await req.text();
      if (raw.length > 1000) throw Error();
      body = JSON.parse(raw);
    } catch {
      return out({ error: "Сұрау жарамсыз." }, 400);
    }
    const type = body.type;
    if (type === "enable") {
      if (!profile) {
        for (let i = 0; i < 4 && !profile; i++) {
          const friend_code = randomBytes(5)
            .toString("hex")
            .slice(0, 8)
            .toUpperCase();
          const saved = await db
            .from("qd_friend_profiles")
            .insert({
              user_id: user.id,
              friend_code,
              timezone:
                typeof body.timezone === "string"
                  ? body.timezone.slice(0, 64)
                  : "Asia/Almaty",
            })
            .select("friend_code,username,timezone")
            .single();
          if (!saved.error) profile = saved.data;
        }
      }
      if (!profile)
        return out({ error: "Дос кодын жасау мүмкін болмады." }, 503);
    } else if (type === "username") {
      const username =
        typeof body.username === "string"
          ? body.username.trim().toLowerCase()
          : "";
      if (!/^[a-z0-9_]{3,24}$/.test(username))
        return out(
          { error: "Атау 3–24 латын әрпі, сан немесе _ болсын." },
          400,
        );
      const saved = await db
        .from("qd_friend_profiles")
        .update({ username })
        .eq("user_id", user.id);
      if (saved.error)
        return out(
          { error: "Бұл атау бос емес немесе сақтау мүмкін болмады." },
          409,
        );
    } else if (type === "request") {
      const query = typeof body.query === "string" ? body.query.trim() : "";
      const lookup = code.test(query.toUpperCase())
        ? db
            .from("qd_friend_profiles")
            .select("user_id")
            .eq("friend_code", query.toUpperCase())
        : db
            .from("qd_friend_profiles")
            .select("user_id")
            .eq("username", query.toLowerCase());
      const target = (await lookup.maybeSingle()).data?.user_id;
      if (!target || target === user.id)
        return out(
          { error: "Дос табылмады немесе өзіңді қоса алмайсың." },
          400,
        );
      const [a, b] = [user.id, target].sort();
      const existing = await db
        .from("qd_friendships")
        .select("user_a")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (existing.data)
        return out({ error: "Бұл оқушы достарыңның ішінде бар." }, 409);
      const blocked = await db
        .from("qd_friendships")
        .select("blocked_by")
        .eq("user_a", a)
        .eq("user_b", b)
        .not("blocked_by", "is", null)
        .maybeSingle();
      if (blocked.data) return out({ error: "Сұрау жіберу мүмкін емес." }, 403);
      const saved = await db
        .from("qd_friend_requests")
        .insert({ sender_id: user.id, receiver_id: target });
      if (saved.error)
        return out(
          { error: "Қайталанған сұрау немесе сұрауды сақтау мүмкін болмады." },
          409,
        );
    } else if (type === "respond") {
      if (
        typeof body.requestId !== "string" ||
        !uuid.test(body.requestId) ||
        !["accepted", "declined"].includes(String(body.decision))
      )
        return out({ error: "Жауап жарамсыз." }, 400);
      const request = (
        await db
          .from("qd_friend_requests")
          .select("sender_id,receiver_id,status")
          .eq("id", body.requestId)
          .eq("receiver_id", user.id)
          .single()
      ).data;
      if (!request || request.status !== "pending")
        return out({ error: "Сұрау табылмады." }, 404);
      await db
        .from("qd_friend_requests")
        .update({
          status: body.decision,
          responded_at: new Date().toISOString(),
        })
        .eq("id", body.requestId);
      if (body.decision === "accepted") {
        const [a, b] = [request.sender_id, user.id].sort();
        await db
          .from("qd_friendships")
          .upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b" });
      }
    } else if (["remove", "block"].includes(String(type))) {
      if (typeof body.friendId !== "string" || !uuid.test(body.friendId))
        return out({ error: "Дос жарамсыз." }, 400);
      const [a, b] = [user.id, body.friendId].sort();
      if (type === "block")
        await db
          .from("qd_friendships")
          .upsert(
            { user_a: a, user_b: b, blocked_by: user.id },
            { onConflict: "user_a,user_b" },
          );
      else
        await db
          .from("qd_friendships")
          .delete()
          .eq("user_a", a)
          .eq("user_b", b);
    } else if (type === "freeze") {
      if (typeof body.friendId !== "string" || !uuid.test(body.friendId))
        return out({ error: "Дос жарамсыз." }, 400);
      const [a, b] = [user.id, body.friendId].sort(),
        today = new Date(),
        day = today.getUTCDay();
      today.setUTCDate(today.getUTCDate() - ((day + 6) % 7));
      const week = today.toISOString().slice(0, 10);
      const row = await db
        .from("qd_friendships")
        .select("streak_freeze_week")
        .eq("user_a", a)
        .eq("user_b", b)
        .is("blocked_by", null)
        .maybeSingle();
      if (!row.data) return out({ error: "Достық белсенді емес." }, 403);
      if (row.data.streak_freeze_week === week)
        return out({ error: "Осы аптадағы сақтау қолданылып қойды." }, 409);
      const saved = await db
        .from("qd_friendships")
        .update({ streak_freeze_week: week })
        .eq("user_a", a)
        .eq("user_b", b);
      if (saved.error)
        return out({ error: "Серияны сақтау мүмкін болмады." }, 503);
    } else if (type === "message") {
      if (
        typeof body.friendId !== "string" ||
        !uuid.test(body.friendId) ||
        !safeMessages.includes(String(body.message))
      )
        return out({ error: "Тек дайын қауіпсіз хабарламаны таңда." }, 400);
      const [a, b] = [user.id, body.friendId].sort(),
        day = new Date().toISOString().slice(0, 10);
      const friendship = (
        await db
          .from("qd_friendships")
          .select("user_a")
          .eq("user_a", a)
          .eq("user_b", b)
          .is("blocked_by", null)
          .maybeSingle()
      ).data;
      if (!friendship) return out({ error: "Достық белсенді емес." }, 403);
      const id = `message:${a}:${b}:${day}:${safeMessages.indexOf(String(body.message))}`;
      const inserted = await db.from("qd_friend_events").upsert(
        {
          id,
          user_a: a,
          user_b: b,
          kind: "safe-message",
          points: 2,
          metadata: { sender: user.id, message: body.message },
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (inserted.error) return out({ error: "Хабарлама жіберілмеді." }, 503);
    } else return out({ error: "Әрекет белгісіз." }, 400);
  }
  profile = (
    await db
      .from("qd_friend_profiles")
      .select("friend_code,username,timezone")
      .eq("user_id", user.id)
      .maybeSingle()
  ).data;
  if (!profile) return out({ enabled: false });
  const requests = await db
    .from("qd_friend_requests")
    .select("id,sender_id,receiver_id,status,created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq("status", "pending")
    .limit(30);
  const links = await db
    .from("qd_friendships")
    .select("user_a,user_b,bond_points,joined_at,blocked_by,streak_freeze_week")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .is("blocked_by", null)
    .limit(50);
  const ids = [
    user.id,
    ...(links.data ?? []).map((x) =>
      x.user_a === user.id ? x.user_b : x.user_a,
    ),
    ...(requests.data ?? []).map((x) =>
      x.sender_id === user.id ? x.receiver_id : x.sender_id,
    ),
  ];
  const [profiles, states] = await Promise.all([
    db.from("qd_friend_profiles").select("user_id,username").in("user_id", ids),
    db.from("qd_learning_states").select("user_id,state").in("user_id", ids),
  ]);
  const state = (id: string) =>
      (states.data?.find((x) => x.user_id === id)?.state ??
        null) as LearningState | null,
    name = (id: string) =>
      profiles.data?.find((x) => x.user_id === id)?.username ?? "Оқу серігі",
    mine = state(user.id);
  const automatic = (links.data ?? []).flatMap((link) => {
    const id = link.user_a === user.id ? link.user_b : link.user_a,
      their = state(id);
    if (!mine || !their) return [];
    const days = sharedDays(mine, their, profile!.timezone),
      missions = missionStats(mine, their);
    return [
      ...days.map((day) => ({
        id: `shared-day:${link.user_a}:${link.user_b}:${day}`,
        user_a: link.user_a,
        user_b: link.user_b,
        kind: "shared-day",
        points: 5,
        metadata: { day },
      })),
      ...missions
        .filter((m) => m.complete)
        .map((m) => ({
          id: `mission:${link.user_a}:${link.user_b}:${m.id}`,
          user_a: link.user_a,
          user_b: link.user_b,
          kind: "mission",
          points: 20,
          metadata: { missionId: m.id },
        })),
    ];
  });
  if (automatic.length)
    await db.from("qd_friend_events").upsert(automatic, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
  const events = await db
    .from("qd_friend_events")
    .select("id,user_a,user_b,kind,points,created_at,metadata")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: true })
    .limit(500);
  const friends = (links.data ?? []).map((link) => {
    const id = link.user_a === user.id ? link.user_b : link.user_a,
      their = state(id),
      pair = (events.data ?? []).filter(
        (e) => e.user_a === link.user_a && e.user_b === link.user_b,
      ),
      points = link.bond_points + pair.reduce((n, e) => n + e.points, 0),
      days = mine && their ? sharedDays(mine, their, profile!.timezone) : [],
      week = (() => {
        const d = new Date(),
          w = d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - ((w + 6) % 7));
        return d.toISOString().slice(0, 10);
      })(),
      freezeUsed = link.streak_freeze_week === week,
      streak = sharedStreak(days, new Date(), freezeUsed),
      missions = mine && their ? missionStats(mine, their) : [];
    return {
      id,
      username: name(id),
      points,
      level: friendLevel(points),
      days: days.length,
      streak,
      missions,
      teamTasks: missions.filter((m) => m.complete).length,
      freezeUsed,
      lastMessage:
        pair.filter((e) => e.kind === "safe-message").at(-1)?.metadata ?? null,
    };
  });
  return out({
    enabled: true,
    code: profile.friend_code,
    username: profile.username,
    timezone: profile.timezone,
    invitePath: `/learn/friends?invite=${profile.friend_code}`,
    requests: (requests.data ?? []).map((r) => ({
      ...r,
      otherName: name(r.sender_id === user.id ? r.receiver_id : r.sender_id),
      incoming: r.receiver_id === user.id,
    })),
    friends,
  });
}
export const GET = (r: Request) => route(r, false);
export const POST = (r: Request) => route(r, true);
