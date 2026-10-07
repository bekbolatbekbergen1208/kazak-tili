import { courses, lessons, legacyLessons } from "../content";
import { editorialLessons, editorialBatches } from "./index";
import { isCorrect, normalize } from "../state";
import { regions } from "../../travel/catalog";
export function validateContent() {
  const errors: string[] = [];
  const ids = new Set<string>(),
    slugs = new Set<string>(),
    exerciseIds = new Set<string>();
  for (const l of lessons) {
    if (ids.has(l.id)) errors.push(`Duplicate lesson: ${l.id}`);
    ids.add(l.id);
    const slug = l.slug ?? l.id;
    if (slugs.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    slugs.add(slug);
    if (l.status && l.status !== "published")
      errors.push(`Unpublished learner lesson: ${l.id}`);
    if (!l.title.ru || !l.exercises.length)
      errors.push(`Empty lesson: ${l.id}`);
    if (l.objective) {
      if (
        !l.level ||
        !l.introduction ||
        !l.explanation ||
        !l.minutes ||
        !l.vocabulary ||
        l.vocabulary.length < 5 ||
        l.vocabulary.length > 8 ||
        l.exercises.length < 4 ||
        !l.exercises.some((e) => e.kind === "open")
      )
        errors.push(`Incomplete editorial lesson: ${l.id}`);
      for (const w of l.vocabulary ?? [])
        if (!w.kk || !w.ru || !w.en || !w.meaning || !w.example)
          errors.push(`Missing word data: ${l.id}`);
    }
    for (const e of l.exercises) {
      if (exerciseIds.has(e.id)) errors.push(`Duplicate task: ${e.id}`);
      exerciseIds.add(e.id);
      if (
        !e.prompt.ru ||
        !e.answer ||
        !e.explanation.ru ||
        !isCorrect(e, e.answer)
      )
        errors.push(`Invalid task answer: ${e.id}`);
      if (
        e.options &&
        e.kind !== "order" &&
        !e.options.some((o) => o.id === e.answer)
      )
        errors.push(`Answer absent from choices: ${e.id}`);
      if (
        e.kind === "order" &&
        e.answer.split(" ").some((id) => !e.options?.some((o) => o.id === id))
      )
        errors.push(`Invalid event order: ${e.id}`);
      if (e.kind === "sentence" || e.kind === "correction") {
        const words = (e.words ?? []).map(normalize).sort(),
          answer = normalize(e.answer).split(" ").sort();
        if (JSON.stringify(words) !== JSON.stringify(answer))
          errors.push(`Cannot build sentence: ${e.id}`);
      }
      for (const a of e.acceptedAnswers ?? [])
        if (!isCorrect(e, a))
          errors.push(`Rejected valid alternative: ${e.id}`);
    }
    if (
      l.regionId &&
      !regions.some((r) => r.id === l.regionId && r.slug === l.regionId)
    )
      errors.push(`Broken region link: ${l.id}`);
    for (const id of l.prerequisites ?? [])
      if (!lessons.some((x) => x.id === id))
        errors.push(`Missing prerequisite: ${l.id} -> ${id}`);
  }
  for (const c of courses)
    for (const s of c.sections) {
      if (!s.lessonIds.length) errors.push(`Empty module: ${s.id}`);
      for (const id of s.lessonIds)
        if (
          !lessons.some(
            (l) => l.id === id && l.goal === c.id && l.sectionId === s.id,
          )
        )
          errors.push(`Broken module: ${s.id} -> ${id}`);
    }
  for (const l of lessons)
    if (
      !courses.some((c) =>
        c.sections.some(
          (s) => s.id === l.sectionId && s.lessonIds.includes(l.id),
        ),
      )
    )
      errors.push(`Unlisted lesson: ${l.id}`);
  function visit(id: string, path: string[]) {
    if (path.includes(id)) {
      errors.push(`Prerequisite cycle: ${id}`);
      return;
    }
    const l = lessons.find((l) => l.id === id);
    for (const p of l?.prerequisites ?? []) visit(p, [...path, id]);
  }
  for (const l of lessons) visit(l.id, []);
  const texts = editorialLessons.map((l) => normalize(l.introduction ?? ""));
  if (new Set(texts).size !== texts.length)
    errors.push("Repeated editorial passage");
  return {
    errors,
    legacy: legacyLessons.length,
    newLessons: editorialLessons.length,
    lessons: lessons.length,
    exercises: exerciseIds.size,
    batches: editorialBatches.map((b) => ({
      id: b.id,
      lessons: b.rows.length,
    })),
    modules: courses.reduce((n, c) => n + c.sections.length, 0),
  };
}
