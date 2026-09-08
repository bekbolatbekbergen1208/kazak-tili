import { applyTravel } from "../travel/state";
import type { TravelAction } from "../travel/types";
import {
  achievements,
  courses,
  exerciseById,
  lessonById,
  quests,
} from "./content";
import { characterShop, coinRewards } from "../characters/config";
import {
  awardAchievementCoins,
  awardLegendary,
  equipItem,
  freshCollection,
  getCollection,
  hydrateCharacters,
  selectCharacter,
  unequipItem,
} from "../characters/state";
import type {
  Exercise,
  LearningAction,
  LearningState,
  UserProfile,
  UserQuestProgress,
} from "./types";
export function initialState(): LearningState {
  return {
    profile: {
      nickname: "Дос",
      language: "ru",
      goal: "tourism",
      onboarded: false,
      animations: true,
      avatar: "🌱",
      theme: "default",
    },
    progress: {
      version: 1,
      xp: 0,
      coins: 0,
      correctAnswers: 0,
      combo: 0,
      lessons: {},
      mistakes: {},
      achievements: [],
      quests: {},
      xpTransactions: [],
      coinTransactions: [],
      streak: { current: 0, best: 0, lastDay: null, days: [] },
      inventory: [],
      characters: freshCollection(),
    },
  };
}
export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
export const levelFor = (xp: number) => 1 + Math.floor(xp / 200);
export const leagueFor = (xp: number) =>
  xp >= 1000 ? "Гауһар" : xp >= 500 ? "Алтын" : xp >= 200 ? "Күміс" : "Қола";
export function weekStart(now = new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return dayKey(d);
}
export function weeklyXP(s: LearningState, now = new Date()) {
  return s.progress.xpTransactions
    .filter((t) => t.date.slice(0, 10) >= weekStart(now))
    .reduce((a, t) => a + t.amount, 0);
}
export const emptyQuest = (): UserQuestProgress => ({
  lessons: 0,
  words: 0,
  combo: 0,
  reviews: 0,
  dialogues: 0,
  claimed: [],
});
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[.,!?«»“”]/g, "")
    .trim()
    .replace(/\s+/g, " ");
export function isCorrect(e: Exercise, answer: string) {
  return e.kind === "open"
    ? answer.trim().length >= 12
    : normalize(answer) === normalize(e.answer);
}
export function validateProfile(p: UserProfile) {
  if (
    !p ||
    typeof p.nickname !== "string" ||
    p.nickname.trim().length < 2 ||
    p.nickname.trim().length > 24 ||
    !["ru", "en"].includes(p.language) ||
    !courses.some((c) => c.id === p.goal) ||
    typeof p.onboarded !== "boolean" ||
    typeof p.animations !== "boolean" ||
    !["🌱", "🦊", "🦉", "🌟"].includes(p.avatar) ||
    !["default", "mint"].includes(p.theme)
  )
    throw new Error("Invalid profile");
}
export function accessible(s: LearningState, lessonId: string) {
  const l = lessonById(lessonId);
  if (!l) return false;
  const ids = courses
      .find((c) => c.id === l.goal)!
      .sections.flatMap((x) => x.lessonIds),
    i = ids.indexOf(lessonId);
  return (
    i === 0 ||
    ["completed", "perfect"].includes(s.progress.lessons[ids[i - 1]]?.status)
  );
}
export function nextLesson(s: LearningState) {
  const ids = courses
    .find((c) => c.id === s.profile.goal)!
    .sections.flatMap((x) => x.lessonIds);
  return (
    ids.find(
      (id) =>
        !["completed", "perfect"].includes(s.progress.lessons[id]?.status),
    ) ?? ids[ids.length - 1]
  );
}
export function applyAction(
  input: LearningState,
  action: LearningAction,
  now = new Date(),
): LearningState {
  const s = hydrateCharacters(input, now),
    p = s.progress,
    today = dayKey(now),
    stamp = now.toISOString();
  const reward = (id: string, xp: number, coins: number, reason: string) => {
    if (p.xpTransactions.some((t) => t.id === id)) return;
    p.xp += xp;
    p.coins += coins;
    p.xpTransactions.push({ id, amount: xp, date: stamp, reason });
    p.coinTransactions.push({ id, amount: coins, date: stamp, reason });
  };
  const q = (p.quests[today] ??= emptyQuest());
  awardLegendary(s, stamp);
  if (action.type === "profile") {
    validateProfile(action.profile);
    if (action.profile.theme === "mint" && !p.inventory.includes("mint"))
      throw new Error("Theme not owned");
    s.profile = { ...action.profile, nickname: action.profile.nickname.trim() };
    if (s.profile.theme === "mint")
      getCollection(s).globalEquipped.theme = "mint";
    else delete getCollection(s).globalEquipped.theme;
    return s;
  }
  if (!s.profile.onboarded) throw new Error("Complete onboarding first");
  if (action.type === "select-character") {
    selectCharacter(s, action.characterId);
    return s;
  }
  if (action.type === "reveal-character") {
    if (typeof action.select !== "boolean") throw new Error("Invalid reveal");
    const previous = getCollection(s).selectedId;
    selectCharacter(s, action.characterId);
    if (!action.select) getCollection(s).selectedId = previous;
    if (!getCollection(s).announcedIds.includes(action.characterId))
      getCollection(s).announcedIds.push(action.characterId);
    return s;
  }
  if (action.type === "equip") {
    equipItem(s, action.characterId, action.itemId);
    return s;
  }
  if (action.type === "unequip") {
    unequipItem(s, action.characterId, action.slot);
    return s;
  }
  if (action.type === "buy") {
    const item = characterShop.find((i) => i.id === action.itemId);
    if (!item || p.coins < item.price || p.inventory.includes(item.id))
      throw new Error("Purchase unavailable");
    p.coins -= item.price;
    p.inventory.push(item.id);
    p.coinTransactions.push({
      id: `buy-${item.id}`,
      amount: -item.price,
      date: stamp,
      reason: "shop",
    });
    return s;
  }
  if (action.type === "claim") {
    const quest = quests.find((x) => x.id === action.questId);
    if (
      !quest ||
      q[quest.metric] < quest.target ||
      q.claimed.includes(quest.id)
    )
      throw new Error("Quest not available");
    q.claimed.push(quest.id);
    reward(
      `quest-${today}-${quest.id}`,
      quest.reward,
      coinRewards.dailyQuest,
      "quest",
    );
  }
  if (
    action.type === "start" ||
    action.type === "answer" ||
    action.type === "finish"
  ) {
    const lesson = lessonById(action.lessonId);
    if (!lesson || !accessible(s, lesson.id)) throw new Error("Lesson locked");
    const lp = (p.lessons[lesson.id] ??= {
      status: "started",
      answers: {},
      firstAnswers: {},
      correct: 0,
    });
    if (action.type === "answer") {
      if (lp.status !== "started") return s;
      const ex = lesson.exercises.find((e) => e.id === action.exerciseId);
      if (
        !ex ||
        typeof action.answer !== "string" ||
        action.answer.length > 2000
      )
        throw new Error("Invalid answer");
      if (lp.answers[ex.id] !== undefined && isCorrect(ex, lp.answers[ex.id]))
        return s;
      const ok = isCorrect(ex, action.answer),
        first = lp.firstAnswers[ex.id] === undefined;
      lp.answers[ex.id] = action.answer;
      if (first) lp.firstAnswers[ex.id] = action.answer;
      if (ok) {
        if (first) {
          p.correctAnswers++;
          p.combo++;
          q.combo = Math.max(q.combo, p.combo);
          q.words++;
          reward(`answer-${ex.id}`, 10, coinRewards.answer, "answer");
        } else {
          p.combo = 0;
        }
        if (ex.kind === "dialogue") q.dialogues++;
      } else {
        p.combo = 0;
        p.mistakes[ex.id] = {
          exerciseId: ex.id,
          lessonId: lesson.id,
          count: (p.mistakes[ex.id]?.count ?? 0) + 1,
          resolved: false,
        };
      }
    }
    if (action.type === "finish") {
      if (lp.status !== "started") return s;
      if (
        !lesson.exercises.every(
          (e) =>
            lp.answers[e.id] !== undefined && isCorrect(e, lp.answers[e.id]),
        )
      )
        throw new Error("Finish all exercises first");
      const correct = lesson.exercises.filter((e) =>
          isCorrect(e, lp.firstAnswers[e.id] ?? ""),
        ).length,
        perfect = correct === lesson.exercises.length;
      lp.status = perfect ? "perfect" : "completed";
      lp.correct = correct;
      lp.completedAt = stamp;
      q.lessons++;
      reward(
        `finish-${lesson.id}`,
        30 + (perfect ? 20 : 0) + (lesson.kind === "test" ? 20 : 0),
        coinRewards.lesson + (perfect ? coinRewards.perfect : 0),
        "lesson",
      );
      if (p.streak.lastDay !== today) {
        const yesterday = dayKey(new Date(now.getTime() - 86400000));
        p.streak.current =
          p.streak.lastDay === yesterday ? p.streak.current + 1 : 1;
        p.streak.best = Math.max(p.streak.best, p.streak.current);
        p.streak.lastDay = today;
        p.streak.days.push(today);
        reward(`return-${today}`, 5, coinRewards.activeDay, "daily-return");
      }
      const section = courses
        .flatMap((c) => c.sections)
        .find((x) => x.id === lesson.sectionId)!;
      if (
        section.lessonIds.every((id) =>
          ["completed", "perfect"].includes(p.lessons[id]?.status),
        )
      )
        reward(`section-${section.id}`, 50, coinRewards.section, "section");
    }
  }
  if (action.type === "review") {
    const m = p.mistakes[action.exerciseId],
      e = exerciseById(action.exerciseId);
    if (!m || !e || m.resolved) throw new Error("Mistake unavailable");
    if (isCorrect(e, action.answer)) {
      m.resolved = true;
      q.reviews++;
      reward(`review-${e.id}`, 5, coinRewards.review, "review");
    } else m.count++;
  }
  if (action.type.startsWith("travel-"))
    applyTravel(s, action as TravelAction, stamp, reward);
  const complete = (id: string) =>
    ["completed", "perfect"].includes(p.lessons[id]?.status);
  for (
    let level = levelFor(input.progress.xp) + 1;
    level <= levelFor(p.xp);
    level++
  ) {
    reward(`level-${level}`, 0, coinRewards.level, "level");
  }
  const earned: Record<string, boolean> = {
    first: Object.values(p.lessons).some((l) => l.completedAt),
    hundred: p.correctAnswers >= 100,
    week: p.streak.best >= 7,
    perfect: Object.values(p.lessons).some((l) => l.status === "perfect"),
    section: courses.some((c) =>
      c.sections.some((x) => x.lessonIds.every(complete)),
    ),
    thousand: p.xp >= 1000,
    tourism: courses[0].sections.every((x) => x.lessonIds.every(complete)),
    daily: courses[3].sections.every((x) => x.lessonIds.every(complete)),
    books: complete("books-2") && complete("books-4"),
  };
  achievements.forEach((a) => {
    if (earned[a.id] && !p.achievements.some((x) => x.achievementId === a.id)) {
      p.achievements.push({ achievementId: a.id, date: stamp });
      awardAchievementCoins(s, a.id, stamp);
    }
  });
  awardLegendary(s, stamp);
  return hydrateCharacters(s, now);
}
