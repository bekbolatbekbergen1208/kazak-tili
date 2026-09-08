import type { LearningState } from "../learning/types";
import type { TravelAction, TravelProgress, RegionProgress } from "./types";
import { coreSections } from "./types";
import { regionById, regions } from "./catalog";
export const emptyTravel = (): TravelProgress => ({
  regions: {},
  settings: { sound: false, animation: "full", follow: true, introSeen: false },
  achievements: [],
  announced: [],
});
export const emptyRegion = (): RegionProgress => ({
  visited: false,
  sectionsViewed: [],
  objectsExplored: [],
  vocabularyLearned: [],
  gameResults: {},
  quizBestScore: 0,
  correctIds: [],
  xpEarned: 0,
  stampUnlocked: false,
});
export const travelOf = (s: LearningState) =>
  s.progress.travel ?? emptyTravel();
export const travelXP = (s: LearningState) =>
  s.progress.xpTransactions
    .filter((t) => t.id.startsWith("travel:"))
    .reduce((a, t) => a + t.amount, 0);
export const travelTitle = (xp: number) =>
  xp >= 1800
    ? "QazaqDos елшісі"
    : xp >= 1000
      ? "Ұлы дала зерттеушісі"
      : xp >= 500
        ? "Қазақстан білгірі"
        : xp >= 200
          ? "Өлке зерттеушісі"
          : "Жас саяхатшы";
export const travelAchievements: Record<string, string> = {
  first: "Алғашқы қадам",
  caspian: "Каспий зерттеушісі",
  history: "Тарих білгірі",
  nature: "Табиғат зерттеушісі",
  words: "Сөз шебері",
  all: "Ұлы саяхатшы",
  perfect: "Қазақстан білгірі",
};
const same = (a: string, b: string) =>
  a.normalize("NFKC").trim().toLocaleLowerCase() ===
  b.normalize("NFKC").trim().toLocaleLowerCase();
export function applyTravel(
  s: LearningState,
  a: TravelAction,
  stamp: string,
  reward: (id: string, xp: number, coins: number, reason: string) => void,
) {
  const t = (s.progress.travel ??= emptyTravel());
  if (a.type === "travel-settings") {
    const v = a.settings;
    if (
      !v ||
      !["full", "light", "off"].includes(v.animation) ||
      [v.sound, v.follow, v.introSeen].some((x) => typeof x !== "boolean")
    )
      throw Error("Invalid settings");
    t.settings = {
      sound: v.sound,
      follow: v.follow,
      introSeen: v.introSeen,
      animation: v.animation,
    };
    return;
  }
  if (a.type === "travel-camera") {
    if (
      !a.center ||
      ![a.center.x, a.center.y, a.zoom].every(Number.isFinite) ||
      a.zoom < 1 ||
      a.zoom > 4 ||
      a.center.x < 0 ||
      a.center.x > 1000 ||
      a.center.y < 0 ||
      a.center.y > 549
    )
      throw Error("Invalid camera");
    t.camera = { center: { x: a.center.x, y: a.center.y }, zoom: a.zoom };
    return;
  }
  if (a.type === "travel-announce") {
    if (
      !t.achievements.includes(a.id) &&
      !(a.id.startsWith("stamp:") && t.regions[a.id.slice(6)]?.stampUnlocked)
    )
      throw Error("Unknown achievement");
    if (!t.announced.includes(a.id)) t.announced.push(a.id);
    return;
  }
  const r = regionById(a.regionId);
  if (!r) throw Error("Unknown region");
  const p = (t.regions[r.id] ??= emptyRegion());
  const give = (key: string, xp: number, coins = 0) => {
    const id = `travel:${r.id}:${key}`;
    if (!s.progress.xpTransactions.some((x) => x.id === id)) {
      reward(id, xp, coins, "travel");
      p.xpEarned += xp;
    }
  };
  const correct = (id: string) => {
    if (!p.correctIds.includes(id)) {
      p.correctIds.push(id);
      s.progress.correctAnswers++;
    }
  };
  if (a.type === "travel-visit") {
    p.visited = true;
    t.lastRegion = r.id;
    give("visit", 10);
  } else if (!p.visited) throw Error("Visit region first");
  if (a.type === "travel-section") {
    if (!coreSections.includes(a.sectionId as (typeof coreSections)[number]))
      throw Error("Unknown section");
    if (!p.sectionsViewed.includes(a.sectionId))
      p.sectionsViewed.push(a.sectionId);
  }
  if (a.type === "travel-object") {
    if (
      !r.mapObjects.some((o) => o.id === a.objectId) &&
      !r.animals.some((o) => o.id === a.objectId)
    )
      throw Error("Unknown object");
    if (!p.objectsExplored.includes(a.objectId))
      p.objectsExplored.push(a.objectId);
  }
  if (a.type === "travel-word") {
    const w = r.vocabulary.find((w) => w.id === a.wordId);
    if (!w || typeof a.answer !== "string" || a.answer.length > 100)
      throw Error("Unknown word");
    if (same(a.answer, w.ru) || same(a.answer, w.en)) {
      if (!p.vocabularyLearned.includes(w.id)) p.vocabularyLearned.push(w.id);
      correct(`word:${w.id}`);
    }
  }
  if (a.type === "travel-game") {
    if (
      !["quiz", "matching", "sentence"].includes(a.game) ||
      !Array.isArray(a.answers) ||
      a.answers.length > 20 ||
      a.answers.some((x) => typeof x !== "string" || x.length > 200)
    )
      throw Error("Invalid answers");
    if (a.game === "quiz") {
      if (
        a.answers.length !== r.games.quiz.length ||
        a.answers.some((x, i) => !r.games.quiz[i].options.includes(x))
      )
        throw Error("Incomplete quiz");
      const score = a.answers.filter((x, i) =>
        same(x, r.games.quiz[i].answer),
      ).length;
      a.answers.forEach((x, i) => {
        if (same(x, r.games.quiz[i].answer)) correct(`quiz:${i}`);
      });
      p.quizBestScore = Math.max(p.quizBestScore, score);
      p.gameResults.quiz = p.quizBestScore;
      give("quiz", 30);
      if (score === r.games.quiz.length) give("perfect", 20);
    } else if (a.game === "matching") {
      if (a.answers.length !== r.games.matching.length)
        throw Error("Incomplete matching");
      const score = a.answers.filter(
        (x, i) => x === r.games.matching[i],
      ).length;
      p.gameResults.matching = Math.max(p.gameResults.matching ?? 0, score);
      a.answers.forEach((x, i) => {
        if (x === r.games.matching[i]) correct(`matching:${i}`);
      });
    } else {
      const ok = a.answers.join(" ") === r.games.sentence.join(" ");
      if (ok) {
        p.gameResults.sentence = 1;
        correct("sentence");
      }
    }
  }
  const sections = coreSections.every((x) => p.sectionsViewed.includes(x));
  if (sections && r.contentStatus === "ready") give("sections", 20);
  const vocab = r.vocabulary.every((x) => p.vocabularyLearned.includes(x.id));
  if (vocab) give("vocabulary", 15);
  if (
    r.contentStatus === "ready" &&
    sections &&
    vocab &&
    p.quizBestScore >= 4 &&
    p.gameResults.matching === r.games.matching.length &&
    p.gameResults.sentence === 1
  ) {
    p.stampUnlocked = true;
    p.completedAt ??= stamp;
    give("complete", 100, 30);
  }
  const done = (id: string) => !!t.regions[id]?.stampUnlocked;
  const uniqueWords = new Set(
    Object.values(t.regions).flatMap((x) => x.vocabularyLearned),
  );
  const animalCount = regions.reduce(
    (sum, reg) =>
      sum +
      reg.animals.filter((an) =>
        t.regions[reg.id]?.objectsExplored.includes(an.id),
      ).length,
    0,
  );
  const histories = regions.reduce(
    (sum, reg) =>
      sum +
      reg.games.quiz.filter(
        (q, i) =>
          q.topic === "history" &&
          t.regions[reg.id]?.correctIds.includes(`quiz:${i}`),
      ).length,
    0,
  );
  const earned: Record<string, boolean> = {
    first: Object.values(t.regions).some((x) => x.visited),
    caspian: done("mangystau") && done("atyrau"),
    words: uniqueWords.size >= 100,
    nature: animalCount >= 20,
    history: histories >= 5,
    all: regions.every((r) => done(r.id)),
    perfect: regions.every((r) => t.regions[r.id]?.quizBestScore === 5),
  };
  for (const [id, yes] of Object.entries(earned))
    if (yes && !t.achievements.includes(id)) t.achievements.push(id);
}
