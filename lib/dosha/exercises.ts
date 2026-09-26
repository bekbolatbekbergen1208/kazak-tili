import { lessons } from "../learning/content";
import { courseLessons } from "../curriculum";
import { courseTasks } from "../learning/course-tasks";
import { baseQuestions } from "../learning/intro-questions";
import { readingBooks, tasksFor, battleFor } from "../books/catalog";
import { historyCities } from "../history/catalog";
import { regions } from "../travel/catalog";
import { questions } from "../national/catalog";
import type { Exercise, Localized } from "../learning/types";
import type { KnowledgeSource } from "./knowledge";

const localized = (value: string | Localized) =>
  typeof value === "string" ? value : Object.values(value).join(" / ");

export function exerciseAnswer(exercise: Exercise): string {
  if (exercise.pairs)
    return exercise.pairs
      .map((pair) => `${pair.kk} — ${localized(pair.translation)}`)
      .join("; ");
  if (exercise.kind === "order")
    return exercise.answer
      .split(/[,\s]+/)
      .map((id) => {
        const option = exercise.options?.find((option) => option.id === id);
        return option ? localized(option.text) : id;
      })
      .join(" → ");
  const option = exercise.options?.find(
    (option) => option.id === exercise.answer,
  );
  return option ? localized(option.text) : exercise.answer;
}

type Question = {
  prompt: string;
  answer: string;
  explanation: string;
  options?: string[];
};
function source(
  id: string,
  owner: string,
  question: Question,
  href: string,
  lessonId?: string | number,
): KnowledgeSource {
  return {
    id,
    category: "exercise",
    title: `${owner}: ${question.prompt}`,
    href,
    lessonId,
    question: question.prompt,
    excerpt: [
      question.answer
        ? `Жауап: ${question.answer}`
        : "Шығармашылық тапсырма: жалғыз дұрыс жауабы жоқ. Өз пікіріңді мысалмен дәлелде.",
      `Түсіндірме: ${question.explanation}`,
      question.options?.length
        ? `Нұсқалар: ${question.options.join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function exerciseKnowledge(): KnowledgeSource[] {
  return [
    ...baseQuestions.map((q) =>
      source(
        `intro-question-${q.id}`,
        "Әуежай сабағы",
        { ...q, prompt: q.title },
        "/student/lesson/1",
      ),
    ),
    ...courseLessons.flatMap((lesson) =>
      courseTasks(lesson).map((task, i) =>
        source(
          `course-exercise-${lesson.id}-${i + 1}`,
          `${lesson.id}-сабақ. ${lesson.title}`,
          {
            prompt: [task.title, task.prompt].filter(Boolean).join(": "),
            answer: task.answer,
            explanation: `${task.hint} Үлгі: ${lesson.sentence}. Аудармасы: ${lesson.translation}.`,
            options: task.options,
          },
          `/student/lesson/${lesson.id}`,
          lesson.id,
        ),
      ),
    ),
    ...lessons.flatMap((lesson) =>
      lesson.exercises.map((exercise) =>
        source(
          `learning-exercise-${exercise.id}`,
          localized(lesson.title),
          {
            prompt: localized(exercise.prompt),
            answer: exerciseAnswer(exercise),
            explanation: `${localized(exercise.explanation)} Үлгі: ${exercise.example}`,
            options: exercise.options?.map((option) => localized(option.text)),
          },
          `/learn/${lesson.id}`,
          lesson.id,
        ),
      ),
    ),
    ...readingBooks.flatMap((book) => [
      ...tasksFor(book).map((q) =>
        source(
          `book-task-${book.id}-${q.id}`,
          book.title,
          q,
          `/learn/books/${book.id}`,
        ),
      ),
      ...battleFor(book).map((q) =>
        source(
          `book-battle-${book.id}-${q.id}`,
          book.title,
          q,
          `/learn/books/${book.id}`,
        ),
      ),
    ]),
    ...historyCities.flatMap((city) =>
      city.tasks.map((q) =>
        source(
          `history-task-${city.id}-${q.id}`,
          city.name,
          q,
          `/learn/history/${city.id}`,
        ),
      ),
    ),
    ...regions.flatMap((region) =>
      region.games.quiz.map((q, i) =>
        source(
          `region-quiz-${region.id}-${i}`,
          region.nameKk,
          q,
          `/kazakhstan/${region.slug}`,
        ),
      ),
    ),
    ...questions.map((q, i) =>
      source(
        `national-exercise-${i}`,
        "Ұлттық ойын",
        { ...q, answer: q.options[q.answer] },
        "/learn/national",
      ),
    ),
  ];
}
