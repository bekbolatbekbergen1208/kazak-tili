import type { LearningState } from "../learning/types";
import { awardNational } from "./state";
import {
  createWorld,
  replayWorld,
  type WorldInput,
  type WorldSession,
} from "./world-engine";
import { worldGame, type WorldKind } from "./world-catalog";
export type WorldProgress = {
  serial: number;
  session: WorldSession | null;
  records: Partial<
    Record<
      WorldKind,
      {
        best: number;
        completed: number;
        wins: number;
        words: string[];
        badge: boolean;
      }
    >
  >;
};
export type WorldAction =
  | { type: "village-start"; kind: WorldKind }
  | { type: "village-save"; sessionId: string; events: WorldInput[] };
export const freshWorld = (): WorldProgress => ({
  serial: 0,
  session: null,
  records: {},
});
export function applyWorld(s: LearningState, a: WorldAction, now: Date) {
  const w = (s.progress.village ??= freshWorld());
  if (a.type === "village-start") {
    if (!worldGame(a.kind)) throw Error("Ойын табылмады");
    if (w.session && !w.session.finished)
      throw Error("Алдыңғы ойынды аяқта немесе тоқтат");
    w.serial++;
    w.session = createWorld(
      a.kind,
      `${now.getTime()}-v${w.serial}`,
      now.getTime() >>> 0,
      now.toISOString(),
    );
    return;
  }
  const current = w.session;
  if (!current || current.id !== a.sessionId)
    throw Error("Ойын сессиясы ескірген");
  if (current.claimed) return;
  if (
    !Array.isArray(a.events) ||
    a.events.length < current.events.length ||
    current.events.some(
      (v, i) => JSON.stringify(v) !== JSON.stringify(a.events[i]),
    )
  )
    throw Error("Сақталған жүрістерді өзгертуге болмайды");
  const result = replayWorld(current, a.events);
  if (result.lastAt > now.getTime() - Date.parse(current.startedAt) + 1500)
    throw Error("Ойын уақыты сәйкес емес");
  w.session = result;
  if (!result.finished) return;
  result.claimed = true;
  const g = worldGame(result.kind)!;
  const record = (w.records[result.kind] ??= {
    best: 0,
    completed: 0,
    wins: 0,
    words: [],
    badge: false,
  });
  const retired = a.events.at(-1)?.key === "retire";
  if (!retired) {
    record.completed++;
    record.best = Math.max(record.best, result.score);
    if (result.won) record.wins++;
    record.words = [...g.words];
    record.badge = record.wins > 0;
  }
  // One fixed first-victory reward per game, replay/practice never farms balances.
  if (result.won)
    awardNational(s, {
      id: `village-first-${g.id}`,
      title: g.name,
      xp: 30,
      coins: 20,
      crystals: 1,
      date: now.toISOString(),
    });
}
