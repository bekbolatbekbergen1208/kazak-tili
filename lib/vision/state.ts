import type { LearningState } from "../learning/types";
import { awardNational } from "../national/state";
import {
  acceptableVisionAnswer,
  visionCategories,
  visionWord,
  visionWords,
} from "./words";
import type { VisionAction, VisionProgress } from "./types";
export const visionOf = (s: LearningState): VisionProgress =>
  s.progress.vision ?? { words: {}, days: [], badges: [] };
export function applyVision(s: LearningState, a: VisionAction, now: Date) {
  const w = visionWord(a.wordId);
  if (!w) throw Error("Белгісіз сөз");
  const v = (s.progress.vision ??= { words: {}, days: [], badges: [] }),
    stamp = now.toISOString(),
    day = stamp.slice(0, 10);
  const rec = (v.words[w.id] ??= { foundAt: stamp, tasks: [] });
  if (a.type === "vision-found") return;
  if (!acceptableVisionAnswer(w, a.task, a.answer))
    throw Error("Жауапты толықтыр");
  if (!rec.tasks.includes(a.task)) {
    rec.tasks.push(a.task);
    rec.sentence = a.answer;
    if (!v.days.includes(day)) v.days.push(day);
    awardNational(s, {
      id: `vision-${w.id}-${a.task}`,
      title: `Досша Vision · ${w.kk}`,
      xp: w.xp,
      coins: 2,
      crystals: 0,
      date: stamp,
    });
  }
  for (const category of visionCategories) {
    const all = visionWords.filter((x) => x.category === category);
    if (
      all.length &&
      all.every((x) => v.words[x.id]?.tasks.length) &&
      !v.badges.includes(category)
    )
      v.badges.push(category);
  }
}
