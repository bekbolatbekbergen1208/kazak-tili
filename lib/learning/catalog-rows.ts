import { courses, lessons } from "./content";
export function learningCatalogRows() {
  return {
    qd_courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
    })),
    qd_sections: courses.flatMap((c) =>
      c.sections.map((s, position) => ({
        id: s.id,
        course_id: c.id,
        position,
        title: s.title,
      })),
    ),
    qd_lessons: courses.flatMap((c) =>
      c.sections.flatMap((s) =>
        s.lessonIds.map((id, position) => {
          const l = lessons.find((l) => l.id === id)!;
          return {
            id,
            section_id: s.id,
            book_id: l.bookId ?? null,
            position,
            title: l.title,
            kind: l.kind,
            content: l,
          };
        }),
      ),
    ),
    qd_exercises: lessons.flatMap((l) =>
      l.exercises.map((e, position) => ({
        id: e.id,
        lesson_id: l.id,
        position,
        content: e,
      })),
    ),
    qd_exercise_options: lessons.flatMap((l) =>
      l.exercises.flatMap((e) =>
        (e.options ?? []).map((o) => ({
          exercise_id: e.id,
          id: o.id,
          content: o,
        })),
      ),
    ),
  };
}
