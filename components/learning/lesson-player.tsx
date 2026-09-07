"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { books, lessonById } from "@/lib/learning/content";
import { accessible, isCorrect, nextLesson } from "@/lib/learning/state";
import { useLearning } from "./provider";
import { Companion } from "./frame";
import { ExerciseView } from "./exercise";
export default function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { state, t, dispatch, busy } = useLearning(),
    lesson = lessonById(lessonId),
    [index, setIndex] = useState(0),
    [retry, setRetry] = useState(0),
    [feedback, setFeedback] = useState<{ answer: string; correct: boolean }>(),
    [started, setStarted] = useState(false);
  const lp = state.progress.lessons[lessonId],
    book = books.find((b) => b.id === lesson?.bookId);
  useEffect(() => {
    if (lp && !started && lesson) {
      const next = lesson.exercises.findIndex(
        (e) => !lp.answers[e.id] || !isCorrect(e, lp.answers[e.id]),
      );
      setIndex(next < 0 ? lesson.exercises.length : next);
      setStarted(true);
    }
  }, [lp, lesson, started]);
  if (!lesson)
    return (
      <div className="page">
        <h1>{t("Урок не найден", "Lesson not found")}</h1>
        <Link href="/learn/map">{t("Вернуться к карте", "Back to map")}</Link>
      </div>
    );
  if (!accessible(state, lessonId))
    return (
      <div className="page">
        <h1>{t("Этот урок пока закрыт", "This lesson is locked")}</h1>
        <p>
          {t(
            "Сначала завершите предыдущий урок.",
            "Complete the previous lesson first.",
          )}
        </p>
        <Link className="btn primary" href="/learn/map">
          {t("Открыть карту", "Open map")}
        </Link>
      </div>
    );
  const completed = !!lp?.completedAt;
  if (completed)
    return (
      <div className="page qd-result">
        <span className="qd-confetti">✦ 🎉 ✦</span>
        <Companion
          mood="celebration"
          text={t("Жарайсың! Вы справились.", "Жарайсың! You did it.")}
        />
        <h1>{t("Урок завершён!", "Lesson complete!")}</h1>
        <h2>{lesson.title[state.profile.language]}</h2>
        <p>
          {lp.correct}/{lesson.exercises.length}{" "}
          {t("верно с первой попытки", "correct on the first try")} ·{" "}
          {lp.status === "perfect"
            ? t("Идеально ★", "Perfect ★")
            : t("Все задания освоены", "All exercises mastered")}
        </p>
        <p>
          {t(
            "XP, монеты и достижения сохранены. Повторное открытие урока не начисляет награды заново.",
            "XP, coins and achievements are saved. Reopening a lesson does not grant duplicate rewards.",
          )}
        </p>
        <div className="qd-actions">
          <Link
            className="btn primary"
            href={
              nextLesson(state) === lessonId
                ? "/learn/map"
                : `/learn/${nextLesson(state)}`
            }
          >
            {nextLesson(state) === lessonId
              ? t("Маршрут завершён · к карте", "Path complete · view map")
              : t("Следующий урок", "Next lesson")}
          </Link>
          <Link className="btn ghost" href="/learn">
            {t("На главную", "Dashboard")}
          </Link>
          <Link className="btn ghost" href="/learn/review">
            {t("Повторить ошибки", "Review mistakes")}
          </Link>
        </div>
      </div>
    );
  if (!lp)
    return (
      <div className="page qd-lesson">
        <span className="pill">5 {t("заданий", "exercises")} · A1</span>
        <h1>{lesson.title[state.profile.language]}</h1>
        <Companion mood="greeting" />
        <p>
          {t(
            "Можно прерваться в любой момент: проверенные ответы сохраняются.",
            "You can pause anytime: checked answers are saved.",
          )}
        </p>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void dispatch({ type: "start", lessonId })}
        >
          {t("Начать урок", "Start lesson")}
        </button>
      </div>
    );
  const exercise = lesson.exercises[index];
  async function answer(value: string) {
    if (!exercise) return;
    const next = await dispatch({
      type: "answer",
      lessonId,
      exerciseId: exercise.id,
      answer: value,
    });
    if (next)
      setFeedback({ answer: value, correct: isCorrect(exercise, value) });
  }
  return (
    <div className="page qd-lesson">
      <div className="sectionHead">
        <Link href="/learn/map">← {t("Карта", "Map")}</Link>
        <span>
          {Math.min(index + 1, lesson.exercises.length)} /{" "}
          {lesson.exercises.length}
        </span>
      </div>
      <progress value={index} max={lesson.exercises.length} />
      <h1>{lesson.title[state.profile.language]}</h1>
      {book && (
        <details className="panel qd-book-summary" open>
          <summary>
            {t("Прочитать краткое содержание", "Read the summary")} ·{" "}
            {book.title}
          </summary>
          <p>{book.summary[state.profile.language]}</p>
          <p>
            {book.characters
              .map(
                (c) => `${c.name} — ${c.description[state.profile.language]}`,
              )
              .join(" ")}
          </p>
        </details>
      )}
      <Companion
        mood={feedback ? (feedback.correct ? "joy" : "support") : "thinking"}
        text={
          feedback
            ? feedback.correct
              ? t("Тамаша! Продолжайте.", "Тамаша! Keep going.")
              : t(
                  "Ошибки помогают учиться. Попробуем ещё раз.",
                  "Mistakes help us learn. Let’s try again.",
                )
            : t("Не торопитесь. Я рядом.", "Take your time. I’m here.")
        }
      />
      {exercise ? (
        <>
          <ExerciseView
            key={`${exercise.id}-${retry}`}
            exercise={exercise}
            onSubmit={(v) => void answer(v)}
            feedback={feedback}
            disabled={busy}
          />
          {feedback && (
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => {
                if (feedback.correct) setIndex(index + 1);
                else setRetry(retry + 1);
                setFeedback(undefined);
              }}
            >
              {feedback.correct
                ? t("Далее", "Next")
                : t("Попробовать ещё раз", "Try again")}
            </button>
          )}
        </>
      ) : (
        <section className="panel">
          <h2>{t("Все задания выполнены", "All exercises complete")}</h2>
          <p>
            {t(
              "Завершите урок, чтобы получить награды и открыть следующий шаг.",
              "Finish the lesson to collect your rewards and unlock the next step.",
            )}
          </p>
          <button
            disabled={busy}
            className="btn primary"
            onClick={() => void dispatch({ type: "finish", lessonId })}
          >
            {busy
              ? t("Сохраняем…", "Saving…")
              : t("Завершить и получить награду", "Finish and collect rewards")}
          </button>
        </section>
      )}
    </div>
  );
}
