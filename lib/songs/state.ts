import type { LearningState } from "../learning/types";
import { songLesson, songTopics, songWord } from "./content";
import type { SongAction, SongProgress, SongRecord, SongTask } from "./types";
import { speechTokens, validTimings } from "./practice";
export const songsOf = (s: LearningState): SongProgress =>
  s.progress.songs ?? { lessons: {}, reviews: {} };
export const freshSong = (): SongRecord => ({
  stage: 0,
  contentVersion: 2,
  seen: [],
  answers: {},
  checks: [],
  xp: 0,
});
export const normal = (s: string) =>
  s
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("kk-KZ")
    .replace(/[.!?]+$/u, "")
    .replace(/\s+/g, " ");
export function taskCorrect(t: SongTask, a: unknown): boolean {
  if (Array.isArray(t.answer))
    return (
      Array.isArray(a) &&
      a.length === t.answer.length &&
      a.every(
        (v, i) =>
          typeof v === "string" &&
          normal(v) === normal((t.answer as string[])[i]),
      )
    );
  return typeof a === "string" && normal(a) === normal(t.answer);
}
export const availableTasks = (id: string) => {
  const l = songLesson(id)!;
  return l.tasks.filter(
    (t) => t.kind !== "listening" || (!!l.audio && l.mediaStatus === "ready"),
  );
};
export function enoughWriting(text: string, lessonId: string) {
  const l = songLesson(lessonId)!;
  const sentences = text
    .trim()
    .split(/[.!?]+/)
    .filter((x) => (x.match(/\p{L}+/gu)?.length ?? 0) >= 2);
  return (
    sentences.length >= 2 &&
    sentences.length <= 3 &&
    l.words.some((w) =>
      w.forms.some((f) =>
        new RegExp(
          `(^|[^\\p{L}])${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`,
          "iu",
        ).test(text),
      ),
    )
  );
}
export function applySong(
  s: LearningState,
  a: SongAction,
  now: Date,
  reward: (id: string, xp: number, coins: number, reason: string) => void,
) {
  const p = (s.progress.songs ??= { lessons: {}, reviews: {} });
  if (a.type === "song-level") {
    if (!["A1", "A2", "B1"].includes(a.level)) throw Error("Деңгейді таңда.");
    p.level = a.level;
    return;
  }
  if (a.type === "song-draft") {
    if (
      !songTopics.includes(a.topic) ||
      typeof a.text !== "string" ||
      a.text.length > 1200
    )
      throw Error("Тақырып пен қысқа мәтін керек.");
    p.draft = { topic: a.topic, text: a.text.trim() };
    return;
  }
  if (a.type === "song-review") {
    const r = p.reviews[a.wordId],
      w = songWord(a.wordId);
    if (!r || !w || typeof a.answer !== "string" || a.answer.length > 100)
      throw Error("Қайталау сөзі табылмады.");
    if (Date.parse(r.dueAt) > now.getTime())
      throw Error("Қайталау уақыты әлі келген жоқ.");
    r.attempts++;
    const correct = normal(a.answer) === normal(w.base);
    if (correct) r.correct++;
    r.lastCorrect = correct;
    r.lastReviewedAt = now.toISOString();
    r.dueAt = new Date(
      now.getTime() + (correct ? 86400000 : 600000),
    ).toISOString();
    return;
  }
  const l = songLesson(a.lessonId);
  if (!l) throw Error("Ән сабағы табылмады.");
  p.lastLessonId = l.id;
  if (a.type === "song-start") {
    p.lessons[l.id] ??= freshSong();
    p.lessons[l.id].updatedAt = now.toISOString();
    return;
  }
  if (a.type === "song-mode-answer" || a.type === "song-mode-complete")
    p.lessons[l.id] ??= freshSong();
  const r = p.lessons[l.id];
  if (!r) throw Error("Алдымен сабақты баста.");
  r.updatedAt = now.toISOString();
  if (a.type === "song-mode-answer") {
    const task = l.wordFind?.find((t) => t.id === a.taskId);
    if (
      !validTimings(l) ||
      !task ||
      typeof a.answer !== "string" ||
      a.answer.length > 100
    )
      throw Error("Бұл тыңдалым тапсырмасы әлі қолжетімсіз.");
    const mode = ((r.modes ??= {}).find ??= { answers: {}, xp: 0 });
    const correct =
      speechTokens(a.answer).join(" ") === speechTokens(task.answer).join(" ");
    mode.answers[task.id] = {
      answer: a.answer,
      correct,
      attempts: (mode.answers[task.id]?.attempts ?? 0) + 1,
    };
    if (!correct && task.wordId) {
      p.reviews[task.wordId] ??= {
        wordId: task.wordId,
        dueAt: now.toISOString(),
        attempts: 0,
        correct: 0,
      };
      p.reviews[task.wordId].lastCorrect = false;
      p.reviews[task.wordId].dueAt = now.toISOString();
    }
    return;
  }
  if (a.type === "song-mode-complete") {
    if (!["find", "karaoke", "speak"].includes(a.mode))
      throw Error("Режим табылмады.");
    const modes = (r.modes ??= {});
    if (modes[a.mode]?.completedAt && a.mode !== "speak") return;
    if (a.mode === "find") {
      if (
        !validTimings(l) ||
        !l.wordFind?.length ||
        l.wordFind.some((t) => !modes.find?.answers[t.id]?.correct)
      )
        throw Error("Сөз табу тапсырмаларын аяқта.");
      modes.find!.completedAt = now.toISOString();
      modes.find!.xp = 10;
    } else if (a.mode === "karaoke") {
      if (!l.audio || l.mediaStatus !== "ready")
        throw Error("Караоке аудиосы әзірленіп жатыр.");
      modes.karaoke = { completedAt: now.toISOString(), xp: 5 };
    } else {
      if (
        !l.excerpts?.some((e) => e.id === a.excerptId) ||
        typeof a.text !== "string" ||
        a.text.length > 700 ||
        speechTokens(a.text).length < 2 ||
        !["manual", "stt"].includes(a.source ?? "") ||
        (a.confidence !== undefined &&
          (!Number.isFinite(a.confidence) ||
            a.confidence < 0 ||
            a.confidence > 1))
      )
        throw Error("Айту жаттығуын мәтінмен белгіле.");
      modes.speak = {
        completedAt: modes.speak?.completedAt ?? now.toISOString(),
        xp: 5,
        last: {
          excerptId: a.excerptId!,
          text: a.text,
          source: a.source!,
          confidence: a.confidence,
        },
      };
    }
    reward(
      `song-mode-${l.id}-${a.mode}`,
      a.mode === "find" ? 10 : 5,
      0,
      `Ән жаттығуы · ${a.mode}`,
    );
    return;
  }
  if (a.type === "song-word") {
    if (!l.words.some((w) => w.id === a.wordId))
      throw Error("Сөз осы сабақта жоқ.");
    if (!r.seen.includes(a.wordId)) r.seen.push(a.wordId);
    return;
  }
  if (a.type === "song-answer") {
    if (r.stage < 2) throw Error("Алдымен сөздермен таныс.");
    const t = availableTasks(l.id).find((t) => t.id === a.taskId);
    if (!t) throw Error("Бұл тапсырма қолжетімсіз.");
    const answer = a.answer;
    if (typeof answer !== "string" && !Array.isArray(answer))
      throw Error("Жауап жарамсыз.");
    if (
      typeof answer === "string"
        ? answer.length > 200
        : Array.isArray(answer) &&
          (answer.length > 10 ||
            answer.some((v) => typeof v !== "string" || v.length > 100))
    )
      throw Error("Жауап тым ұзын.");
    const correct = taskCorrect(t, answer);
    r.answers[t.id] = {
      answer,
      correct,
      attempts: (r.answers[t.id]?.attempts ?? 0) + 1,
    };
    if (!correct)
      for (const id of t.wordIds) {
        p.reviews[id] ??= {
          wordId: id,
          dueAt: now.toISOString(),
          attempts: 0,
          correct: 0,
        };
        p.reviews[id].lastCorrect = false;
        p.reviews[id].dueAt = now.toISOString();
      }
    return;
  }
  if (a.type === "song-speech") {
    if (
      r.stage < 3 ||
      typeof a.text !== "string" ||
      a.text.trim().length < 3 ||
      a.text.length > 700
    )
      throw Error("Жаттығуда айтқан сөйлеміңді жаз.");
    r.speech = a.text.trim();
    return;
  }
  if (a.type === "song-writing") {
    if (
      r.stage < 4 ||
      typeof a.text !== "string" ||
      a.text.length > 1800 ||
      !enoughWriting(a.text, l.id)
    )
      throw Error(
        "Сабақтағы бір сөзді қолданып, өзің туралы 2–3 толық сөйлем жаз.",
      );
    r.writing = a.text.trim();
    return;
  }
  if (a.type === "song-check") {
    if (!Number.isInteger(a.index) || a.index < 0)
      throw Error("Тексеру сұрағы жарамсыз.");
    const c = l.checks[a.index];
    if (r.stage !== 5 || !c || !c.options.includes(a.answer))
      throw Error("Тексеру жауабы жарамсыз.");
    if (c.answer === a.answer) {
      if (!r.checks.includes(a.index)) r.checks.push(a.index);
    } else {
      r.checks = r.checks.filter((i) => i !== a.index);
      const w = l.words[a.index];
      p.reviews[w.id] ??= {
        wordId: w.id,
        dueAt: now.toISOString(),
        attempts: 0,
        correct: 0,
      };
      p.reviews[w.id].lastCorrect = false;
      p.reviews[w.id].dueAt = now.toISOString();
    }
    return;
  }
  if (a.type === "song-next") {
    if (r.stage === 0) r.stage = 1;
    else if (r.stage === 1) {
      if (l.words.some((w) => !r.seen.includes(w.id)))
        throw Error("Барлық негізгі сөзді ашып оқы.");
      r.stage = 2;
    } else if (r.stage === 2) {
      if (
        availableTasks(l.id)
          .filter((t) => r.contentVersion === 2 || t.id !== "read")
          .some((t) => !r.answers[t.id]?.correct)
      )
        throw Error("Ойын тапсырмаларын дұрыс орында.");
      r.stage = 3;
    } else if (r.stage === 3) {
      if (!r.speech)
        throw Error("Айту жаттығуын орында немесе мәтінмен жаттық.");
      r.stage = 4;
    } else if (r.stage === 4) {
      if (!r.writing) throw Error("Өз сөйлемдеріңді сақта.");
      r.stage = 5;
    } else throw Error("Қорытынды тексеруді аяқта.");
    return;
  }
  if (a.type === "song-finish") {
    if (r.completedAt) return;
    if (
      r.stage !== 5 ||
      l.checks.some((_, i) => !r.checks.includes(i)) ||
      !r.writing ||
      !r.speech ||
      availableTasks(l.id)
        .filter((t) => r.contentVersion === 2 || t.id !== "read")
        .some((t) => !r.answers[t.id]?.correct)
    )
      throw Error("Алты кезең мен қысқа тексеруді аяқта.");
    r.completedAt = now.toISOString();
    r.xp = 20;
    reward(`song-${l.id}`, 20, 0, `Әнмен үйрен · ${l.title}`);
    return;
  }
  throw Error("Белгісіз ән әрекеті.");
}

export function songWordStatus(s: LearningState, lessonId: string) {
  const l = songLesson(lessonId)!;
  const p = songsOf(s),
    r = p.lessons[lessonId];
  const correctWords = new Set(
    availableTasks(lessonId)
      .filter((t) => r?.answers[t.id]?.correct)
      .flatMap((t) => t.wordIds),
  );
  for (const i of r?.checks ?? [])
    if (l.words[i]) correctWords.add(l.words[i].id);
  const needsReview = l.words.filter(
    (w) =>
      p.reviews[w.id] &&
      (p.reviews[w.id].lastCorrect === false ||
        (p.reviews[w.id].lastCorrect === undefined &&
          p.reviews[w.id].correct === 0)),
  );
  const difficult = new Set(needsReview.map((w) => w.id));
  return {
    practiced: l.words.filter(
      (w) => correctWords.has(w.id) && !difficult.has(w.id),
    ),
    needsReview,
    readOnly: l.words.filter(
      (w) => !correctWords.has(w.id) && !difficult.has(w.id),
    ),
  };
}
