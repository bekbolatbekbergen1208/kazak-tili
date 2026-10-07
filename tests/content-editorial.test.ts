import test from "node:test";
import assert from "node:assert/strict";
import {
  courses,
  lessons,
  legacyLessons,
  lessonById,
  learningContentRevision,
} from "../lib/learning/content";
import { editorialLessons } from "../lib/learning/editorial";
import { validateContent } from "../lib/learning/editorial/validate";
import { visibleLessons } from "../lib/learning/editorial/model";
import {
  initialState,
  applyAction,
  accessible,
  isCorrect,
  nextLesson,
} from "../lib/learning/state";
import {
  doshaKnowledge,
  invalidateDoshaKnowledge,
  searchDoshaKnowledge,
} from "../lib/dosha/knowledge";
import { findWord } from "../lib/literary/words";
import { lessonHelp } from "../lib/learning/editorial/help";
import { regions } from "../lib/travel/catalog";
test("60 complete original lessons, 300 new tasks, all 20 regions, stable legacy IDs and published modules", () => {
  const v = validateContent();
  assert.deepEqual(v.errors, []);
  assert.equal(v.newLessons, 60);
  assert.equal(v.lessons, 105);
  assert.equal(v.exercises, 535);
  assert.equal(legacyLessons.length, 45);
  assert.equal(new Set(editorialLessons.map((l) => l.introduction)).size, 60);
  assert.equal(
    new Set(editorialLessons.filter((l) => l.regionId).map((l) => l.regionId))
      .size,
    20,
  );
  assert.equal(regions.filter((r) => r.contentStatus === "ready").length, 3);
  for (const l of legacyLessons) assert(lessonById(l.id));
  for (const l of editorialLessons) {
    assert(l.vocabulary?.length === 6);
    for (const w of l.vocabulary) assert(findWord(w.id!));
  }
  const l = editorialLessons[0];
  assert(
    !visibleLessons([
      { ...l, status: "draft" },
      { ...l, status: "archived" },
    ]).length,
  );
});
test("editorial lessons use server-owned gates, saved answers, module next step and idempotent XP", () => {
  let s = initialState();
  s.profile.onboarded = true;
  for (const c of courses) {
    for (const section of c.sections.filter((s) =>
      s.id.includes("-content-"),
    )) {
      for (const id of section.lessonIds) {
        const l = lessonById(id)!;
        assert(accessible(s, id));
        s = applyAction(s, { type: "start", lessonId: id });
        assert.throws(() => applyAction(s, { type: "finish", lessonId: id }));
        for (const e of l.exercises)
          s = applyAction(s, {
            type: "answer",
            lessonId: id,
            exerciseId: e.id,
            answer: e.answer,
          });
        s = applyAction(s, { type: "finish", lessonId: id });
        const xp = s.progress.xp;
        s = JSON.parse(JSON.stringify(s));
        s = applyAction(s, { type: "finish", lessonId: id });
        assert.equal(s.progress.xp, xp);
        const following = section.lessonIds[section.lessonIds.indexOf(id) + 1];
        if (following) assert.equal(nextLesson(s, id), following);
      }
    }
  }
  assert.equal(
    Object.values(s.progress.lessons).filter((l) => l.completedAt).length,
    60,
  );
});
test("answers ignore punctuation and whitespace, accept explicit synonyms, and preserve Kazakh letters and meaningful practice constraints", () => {
  const e = lessonById("tourism-content-hotel-room")!.exercises.find((e) =>
    e.id.endsWith("-gap"),
  )!;
  assert(isCorrect(e, "  МА?!  "));
  assert(!isCorrect(e, "ме"));
  const alias = lessonById("tourism-content-kyzylorda-water")?.exercises;
  const gap = lessonById("tourism-content-shymkent-market")!.exercises.find(
    (e) => e.kind === "gap",
  )!;
  assert(isCorrect(gap, "  КИЛОГРАММ. "));
  const open = editorialLessons[0].exercises.at(-1)!;
  assert(!isCorrect(open, "abcdefghijklmno"));
  assert(!isCorrect(open, "Мен мектепте кітап оқимын"));
  assert(isCorrect(open, open.answer));
  assert(alias);
});
test("Dosha indexes newly published text and tasks, refreshes safely, and gives hints before keys", () => {
  invalidateDoshaKnowledge();
  const all = doshaKnowledge();
  for (const l of editorialLessons)
    assert(all.some((s) => s.id === `lesson-${l.id}`));
  const id = "study-content-sensor-observation";
  const hits = searchDoshaKnowledge("датчик көрсеткіші", { currentLesson: id });
  assert(hits.some((h) => h.lessonId === id));
  const l = lessonById(id)!;
  const h = lessonHelp(id, l.exercises[0].id);
  assert(h.context.includes("дайын жауапты айтпай"));
  assert(!h.reference.includes("Жауап:"));
  assert(learningContentRevision.startsWith("learning-"));
  assert.throws(() => lessonHelp("fake", "fake"));
});
