import type { LearningState } from "../learning/types";
import { getCollection } from "../characters/state";
import { initialBones, simulate } from "./physics";
import { questionFor, nationalGames, crystalPrices } from "./catalog";
import type {
  NationalProgress,
  NationalAction,
  RewardEntry,
  Stat,
} from "./types";
export function freshNational(): NationalProgress {
  return {
    crystals: 0,
    stats: {},
    session: null,
    results: [],
    rewards: [],
    daily: {},
    settings: { sound: false, music: false, light: false, onboarded: false },
  };
}
export function national(s: LearningState) {
  return s.progress.national ?? freshNational();
}
export function statsFor(s: LearningState): Record<Stat, number> {
  return (
    national(s).stats[getCollection(s).selectedId] ?? {
      strength: 0,
      accuracy: 0,
      knowledge: 0,
    }
  );
}
export function awardNational(s: LearningState, entry: RewardEntry) {
  const n = (s.progress.national ??= freshNational());
  if (n.rewards.some((r) => r.id === entry.id)) return;
  n.rewards.push(entry);
  n.crystals += entry.crystals;
  s.progress.xp += entry.xp;
  s.progress.coins += entry.coins;
  s.progress.xpTransactions.push({
    id: entry.id,
    amount: entry.xp,
    reason: entry.title,
    date: entry.date,
  });
  s.progress.coinTransactions.push({
    id: entry.id,
    amount: entry.coins,
    reason: entry.title,
    date: entry.date,
  });
}
export function applyNational(s: LearningState, a: NationalAction, now: Date) {
  const n = (s.progress.national ??= freshNational()),
    date = now.toISOString(),
    day = date.slice(0, 10),
    daily = (n.daily[day] ??= { games: 0, correct: 0, claimed: [] });
  if (a.type === "national-settings") {
    if (
      !a.settings ||
      Object.values(a.settings).some((v) => typeof v !== "boolean") ||
      ["sound", "music", "light", "onboarded"].some(
        (k) => typeof a.settings[k as keyof typeof a.settings] !== "boolean",
      )
    )
      throw Error("Invalid settings");
    n.settings = {
      sound: a.settings.sound,
      music: a.settings.music,
      light: a.settings.light,
      onboarded: a.settings.onboarded,
    };
    return;
  }
  if (a.type === "national-buy") {
    const cost = Object.hasOwn(crystalPrices, a.itemId)
      ? crystalPrices[a.itemId]
      : 0;
    if (!cost || n.crystals < cost || s.progress.inventory.includes(a.itemId))
      throw Error("Purchase unavailable");
    n.crystals -= cost;
    s.progress.inventory.push(a.itemId);
    n.rewards.push({
      id: `crystal-buy-${a.itemId}`,
      title: "Дүкен",
      xp: 0,
      coins: 0,
      crystals: -cost,
      date,
    });
    return;
  }
  if (a.type === "national-upgrade") {
    if (!["strength", "accuracy", "knowledge"].includes(a.stat))
      throw Error("Invalid stat");
    const stats = (n.stats[getCollection(s).selectedId] ??= {
        strength: 0,
        accuracy: 0,
        knowledge: 0,
      }),
      cost = (stats[a.stat] + 1) * 3;
    if (stats[a.stat] >= 5 || n.crystals < cost)
      throw Error("Insufficient crystals");
    n.crystals -= cost;
    stats[a.stat]++;
    n.rewards.push({
      id: `upgrade-${getCollection(s).selectedId}-${a.stat}-${stats[a.stat]}`,
      title: "Кейіпкерді дамыту",
      xp: 0,
      coins: 0,
      crystals: -cost,
      date,
    });
    return;
  }
  if (a.type === "national-daily") {
    const ready =
      a.quest === "play"
        ? daily.games >= 2
        : a.quest === "words"
          ? daily.correct >= 5
          : a.quest === "lesson"
            ? Object.values(s.progress.lessons).some(
                (l) => l.completedAt?.slice(0, 10) === day,
              )
            : false;
    if (!ready || daily.claimed.includes(a.quest))
      throw Error("Quest unavailable");
    daily.claimed.push(a.quest);
    awardNational(s, {
      id: `national-daily-${day}-${a.quest}`,
      title: "Күнделікті тапсырма",
      xp: 15,
      coins: 25,
      crystals: 1,
      date,
    });
    return;
  }
  if (a.type === "national-start") {
    const game = nationalGames.find((g) => g.id === a.kind);
    if (!game || 1 + Math.floor(s.progress.xp / 200) < game.level)
      throw Error("Game locked");
    if (n.session && !n.session.finished) throw Error("Finish current game");
    // A server timestamp and monotonic result count identify each session; clients never choose reward IDs.
    n.session = {
      id: `${now.getTime()}-${n.results.length}`,
      kind: a.kind,
      startedAt: date,
      questionAt: date,
      turn: 0,
      answered: false,
      bonus: false,
      correct: 0,
      combo: 0,
      score: 0,
      rope: 0,
      bones: initialBones(),
      finished: false,
    };
    return;
  }
  const session = n.session;
  if (
    !session ||
    session.finished ||
    a.sessionId !== session.id ||
    a.turn !== session.turn
  )
    throw Error("Stale game action");
  if (a.type === "national-answer") {
    if (
      session.answered ||
      !Number.isInteger(a.answer) ||
      a.answer < -1 ||
      a.answer > 2
    )
      throw Error("Invalid answer");
    const elapsed = Math.max(0, now.getTime() - Date.parse(session.questionAt));
    if (a.answer === -1 && elapsed < 15000) throw Error("Timer still running");
    const correct =
      a.answer === questionFor(session.id, session.turn).answer &&
      (session.kind === "asyk" || elapsed <= 15000);
    session.answered = true;
    session.bonus = correct;
    session.combo = correct ? session.combo + 1 : 0;
    if (correct) {
      session.correct++;
      daily.correct++;
    }
    if (session.kind === "arqan") {
      session.rope += correct
        ? 18 +
          Math.min(session.combo, 3) * 3 +
          (elapsed < 6000 ? 5 : 0) +
          statsFor(s).strength
        : -23;
      session.score += correct ? 10 + Math.min(session.combo, 3) * 2 : 0;
      session.turn++;
      session.questionAt = date;
      session.answered = false;
      session.finished = Math.abs(session.rope) >= 100 || session.turn >= 12;
    }
  } else if (a.type === "national-shot") {
    if (
      session.kind !== "asyk" ||
      !session.answered ||
      !Number.isFinite(a.dx) ||
      !Number.isFinite(a.dy) ||
      Math.hypot(a.dx, a.dy) > 121 ||
      Math.hypot(a.dx, a.dy) < 8 ||
      a.dy >= 0
    )
      throw Error("Invalid shot");
    const before = session.bones.filter((b) => b.out).length,
      next = simulate(session.bones, a.dx, a.dy, session.bonus);
    const removed = next.filter(
      (b) => b.out && !session.bones.find((old) => old.id === b.id)?.out,
    );
    session.score +=
      removed.reduce((sum, b) => sum + (b.special ? 25 : 10), 0) +
      Math.max(0, removed.length - 1) * 5;
    session.bones = next;
    session.turn++;
    session.answered = false;
    session.questionAt = date;
    session.finished =
      session.turn >= 5 || before + removed.length === next.length;
  }
  if (session.finished) {
    const won =
      session.kind === "asyk"
        ? session.bones.every((b) => b.out)
        : session.rope > 0;
    // Only the first three completed games per UTC day pay currency; practice remains unlimited.
    const paid = daily.games < 3;
    daily.games++;
    const reward = {
      id: `game-${session.id}`,
      title: session.kind === "asyk" ? "Асық ату" : "Арқан тартыс",
      xp: paid
        ? 20 + session.correct * (2 + statsFor(s).knowledge) + (won ? 20 : 0)
        : 0,
      coins: paid ? (won ? 50 : 20) : 0,
      crystals: paid && won ? 2 : 0,
      date,
    };
    awardNational(s, reward);
    n.results.push({
      id: session.id,
      kind: session.kind,
      score: session.score,
      won,
      correct: session.correct,
      date,
      reward,
    });
  }
}
