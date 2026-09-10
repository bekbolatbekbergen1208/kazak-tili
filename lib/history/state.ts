import type { LearningState } from "../learning/types";
import { awardNational } from "../national/state";
import { shuffled } from "../books/state";
import {
  historyCities,
  historyCity,
  historyTaskAnswer,
  historianRanks,
} from "./catalog";
import type {
  HistoryAction,
  HistoryCityProgress,
  HistoryProgress,
} from "./types";

export const HISTORY_SECONDS = 90;
export const historyProgress = (s: LearningState): HistoryProgress =>
  s.progress.history ?? { cities: {}, night: false };
export const emptyCity = (): HistoryCityProgress => ({
  visited: false,
  intro: false,
  position: { x: 12, y: 85 },
  discovered: [],
  tasks: [],
  mistakes: {},
});
export const cityProgress = (s: LearningState, id: string) =>
  historyProgress(s).cities[id] ?? emptyCity();
export const cityOpen = (s: LearningState, id: string) => {
  const c = historyCity(id);
  return (
    !!c?.ready && (!c.previous || !!cityProgress(s, c.previous).completedAt)
  );
};
export const cityPercent = (s: LearningState, id: string) => {
  const c = historyCity(id),
    p = cityProgress(s, id);
  return !c?.ready
    ? 0
    : Math.round(
        (100 *
          (Number(p.intro) +
            p.discovered.length +
            p.tasks.length +
            Number(!!p.completedAt))) /
          (c.objects.length + c.tasks.length + 2),
      );
};
export const historyRank = (s: LearningState) => {
  const count = historyCities.filter(
    (c) => cityProgress(s, c.id).completedAt,
  ).length;
  return {
    count,
    index: count >= 10 ? 4 : Math.min(count, 3),
    title: historianRanks[count >= 10 ? 4 : Math.min(count, 3)],
  };
};
export function applyHistory(s: LearningState, a: HistoryAction, now: Date) {
  const h = (s.progress.history ??= { cities: {}, night: false });
  if (a.type === "history-night") {
    if (typeof a.night !== "boolean") throw Error("Күн-түн күйі жарамсыз");
    h.night = a.night;
    return;
  }
  const c = historyCity(a.cityId);
  if (!c || !cityOpen(s, c.id))
    throw Error("Алдыңғы қаланы аяқта. Бұл бағыт әлі ашылмады.");
  const p = (h.cities[c.id] ??= emptyCity()),
    stamp = now.toISOString();
  const reward = (id: string, xp: number, coins: number, crystals = 0) =>
    awardNational(s, {
      id: `history-${c.id}-${id}`,
      title: `Тарих · ${c.name}`,
      xp,
      coins,
      crystals,
      date: stamp,
    });
  if (a.type === "history-visit") {
    p.visited = true;
    h.lastCity = c.id;
    return;
  }
  if (!p.visited) throw Error("Алдымен қалаға кір");
  if (a.type === "history-position") {
    if (!a.point || !Number.isFinite(a.point.x) || !Number.isFinite(a.point.y))
      throw Error("Орны жарамсыз");
    p.position = {
      x: Math.max(5, Math.min(95, a.point.x)),
      y: Math.max(15, Math.min(90, a.point.y)),
    };
    return;
  }
  if (a.type === "history-intro") {
    p.intro = true;
    return;
  }
  if (!p.intro) throw Error("Досшаның таныстыруын аяқта");
  if (a.type === "history-discover") {
    const object = c.objects.find((o) => o.id === a.objectId);
    if (!object) throw Error("Нысан табылмады");
    if (!p.discovered.includes(object.id)) {
      p.discovered.push(object.id);
      reward(`object-${object.id}`, 5, 1);
    }
    p.position = { x: object.point.x, y: Math.min(90, object.point.y + 12) };
    return;
  }
  if (p.discovered.length !== c.objects.length)
    throw Error("Алдымен барлық нысанды зертте");
  if (a.type === "history-answer") {
    const task = c.tasks.find((t) => t.id === a.taskId);
    if (!task || typeof a.answer !== "string" || a.answer.length > 3000)
      throw Error("Тапсырма жарамсыз");
    if (p.tasks.includes(task.id)) return;
    if (historyTaskAnswer(task, a.answer)) {
      p.tasks.push(task.id);
      reward(
        `task-${task.id}`,
        15,
        3,
        task.kind === "build" || task.kind === "route" ? 1 : 0,
      );
    } else p.mistakes[task.id] = (p.mistakes[task.id] ?? 0) + 1;
    return;
  }
  if (p.tasks.length !== c.tasks.length)
    throw Error("Алдымен барлық тапсырманы аяқта");
  if (a.type === "history-final-start") {
    if (p.completedAt || (p.final && !p.final.finishedAt)) return;
    let targets = shuffled(c.objects.map((o) => o.id)).slice(0, 3);
    if (targets.join() === p.final?.targets.join())
      targets = [...targets.slice(1), targets[0]];
    p.final = { startedAt: stamp, targets, found: [] };
    return;
  }
  const f = p.final;
  if (!f || f.finishedAt) throw Error("Белсенді іздеу жоқ");
  const expired =
    now.getTime() >= Date.parse(f.startedAt) + HISTORY_SECONDS * 1000;
  if (a.type === "history-final-find") {
    if (expired) throw Error("Уақыт аяқталды. Қайта байқап көр!");
    if (!c.objects.some((o) => o.id === a.objectId))
      throw Error("Нысан табылмады");
    if (f.targets[f.found.length] === a.objectId) f.found.push(a.objectId);
    return;
  }
  if (a.type !== "history-final-finish") throw Error("Әрекет жарамсыз");
  if (!expired && f.found.length !== f.targets.length)
    throw Error("Іздеуді аяқта");
  f.finishedAt = stamp;
  f.passed = !expired && f.found.length === f.targets.length;
  if (f.passed && !p.completedAt) {
    p.completedAt = stamp;
    reward("complete", c.reward.xp, c.reward.coins, c.reward.crystals);
    if (c.reward.itemId && !s.progress.inventory.includes(c.reward.itemId))
      s.progress.inventory.push(c.reward.itemId);
  }
}
