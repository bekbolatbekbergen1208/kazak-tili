"use client";
import Link from "next/link";
import { useState } from "react";
import { books, exerciseById } from "@/lib/learning/content";
import {
  accessible,
  isCorrect,
  leagueFor,
  levelFor,
  weeklyXP,
} from "@/lib/learning/state";
import { useLearning } from "./provider";
import { ExerciseView } from "./exercise";
import { Companion } from "./frame";
export function BookCatalog() {
  const { state, t } = useLearning(),
    lang = state.profile.language;
  return (
    <div className="page">
      <span className="pill">📚 QazaqDos</span>
      <h1>{t("Произведения и идеи", "Stories and ideas")}</h1>
      <Companion context="books" />
      <p>
        {t(
          "Краткие пересказы и самостоятельно составленные учебные задания.",
          "Short summaries and original learning exercises.",
        )}
      </p>
      <div className="qd-grid two">
        {books.map((book, i) => (
          <article className="panel qd-book" key={book.id}>
            <div className={`qd-book-cover cover-${i}`}>
              📖<span>{book.title}</span>
              <small>{book.author}</small>
            </div>
            <h2>{book.title}</h2>
            <p>{book.summary[lang]}</p>
            <h3>{t("Герои", "Characters")}</h3>
            {book.characters.map((c) => (
              <p key={c.name}>
                <b>{c.name}</b> — {c.description[lang]}
              </p>
            ))}
            <details>
              <summary>
                {t("События и новые слова", "Events and new words")}
              </summary>
              <ol>
                {book.events.map((e, i) => (
                  <li key={i}>{e[lang]}</li>
                ))}
              </ol>
              {book.vocabulary.map((v) => (
                <p key={v.kk}>
                  <b lang="kk">{v.kk}</b> — {v.translation[lang]}
                </p>
              ))}
            </details>
            <div className="qd-actions">
              <Link
                className="btn primary"
                href={`/learn/books-${i === 0 ? "1" : "3"}`}
              >
                {t("Урок по произведению", "Story lesson")}
              </Link>
              {accessible(state, book.quiz.lessonId) ? (
                <Link
                  className="btn ghost"
                  href={`/learn/${book.quiz.lessonId}`}
                >
                  {t("Пройти тест", "Take the quiz")}
                </Link>
              ) : (
                <small>
                  {t(
                    "Тест откроется после предыдущих уроков раздела.",
                    "The quiz unlocks after the preceding lessons.",
                  )}
                </small>
              )}
            </div>
            <a href={book.source} target="_blank" rel="noreferrer">
              {t("Об авторе и произведениях", "About the author and works")} ↗
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
export function Review() {
  const { state, t, dispatch, busy } = useLearning(),
    [active, setActive] = useState<string | null>(null),
    [feedback, setFeedback] = useState<{ answer: string; correct: boolean }>(),
    [retry, setRetry] = useState(0);
  const mistakes = Object.values(state.progress.mistakes).filter(
      (m) => !m.resolved,
    ),
    ex = active ? exerciseById(active) : undefined;
  return (
    <div className="page qd-lesson">
      <h1>{t("Сложное станет знакомым", "Make the difficult familiar")}</h1>
      <p>
        {t(
          "За каждую исправленную ошибку: +5 XP и 1 монета.",
          "Each resolved mistake earns 5 XP and 1 coin.",
        )}
      </p>
      {ex ? (
        <>
          <ExerciseView
            key={`${ex.id}-${retry}`}
            exercise={ex}
            feedback={feedback}
            disabled={busy}
            onSubmit={async (answer) => {
              const next = await dispatch({
                type: "review",
                exerciseId: ex.id,
                answer,
              });
              if (next) setFeedback({ answer, correct: isCorrect(ex, answer) });
            }}
          />
          {feedback && (
            <button
              className="btn primary"
              onClick={() => {
                if (feedback.correct) setActive(null);
                else setRetry(retry + 1);
                setFeedback(undefined);
              }}
            >
              {feedback.correct
                ? t("К списку", "Back to list")
                : t("Ещё раз", "Try again")}
            </button>
          )}
        </>
      ) : mistakes.length ? (
        <div className="qd-grid two">
          {mistakes.map((m) => (
            <button
              className="qd-option"
              key={m.exerciseId}
              onClick={() => setActive(m.exerciseId)}
            >
              <b>{exerciseById(m.exerciseId)?.example}</b>
              <small>
                {t("Разобрать и повторить", "Understand and review")} →
              </small>
            </button>
          ))}
        </div>
      ) : (
        <section className="panel">
          <Companion
            mood="sleep"
            text={t(
              "Всё спокойно: ошибок для повторения пока нет.",
              "All clear: no mistakes to review yet.",
            )}
          />
          <Link className="btn primary" href="/learn/map">
            {t("Продолжить маршрут", "Continue your path")}
          </Link>
        </section>
      )}
    </div>
  );
}
export function Ranking() {
  const { state, t } = useLearning(),
    xp = weeklyXP(state),
    list = [
      { nickname: "Самал", avatar: "🌿", xp: 340, level: 4, demo: true },
      { nickname: "Арман", avatar: "🦊", xp: 180, level: 2, demo: true },
      { nickname: "Айша", avatar: "🌟", xp: 90, level: 2, demo: true },
      {
        nickname: state.profile.nickname,
        avatar: state.profile.avatar,
        xp,
        level: levelFor(state.progress.xp),
        demo: false,
      },
    ].sort((a, b) => b.xp - a.xp),
    place = list.findIndex((x) => !x.demo) + 1;
  return (
    <div className="page">
      <span className="pill">
        {t("ДЕМОНСТРАЦИОННЫЙ РЕЙТИНГ", "DEMONSTRATION RANKING")}
      </span>
      <h1>
        {leagueFor(xp)} · {t("Недельная лига", "Weekly league")}
      </h1>
      <p>
        {t("Ваше место", "Your place")}: {place}.{" "}
        {t(
          "Ваш XP настоящий, остальные участники вымышлены.",
          "Your XP reflects your progress; the other participants are fictional.",
        )}
      </p>
      <div className="qd-leagues">
        {["Қола", "Күміс", "Алтын", "Гауһар"].map((l, i) => (
          <span className={leagueFor(xp) === l ? "active" : ""} key={l}>
            {l}
            <small>{[0, 200, 500, 1000][i]}+ XP</small>
          </span>
        ))}
      </div>
      <section className="panel">
        {list.map((s, i) => (
          <div
            className={`rankRow ${s.demo ? "" : "me"}`}
            key={`${s.nickname}-${i}`}
          >
            <b>{i + 1}</b>
            <span>{s.avatar}</span>
            <div>
              <strong>
                {s.nickname} {s.demo ? "· demo" : ""}
              </strong>
              <small>
                {t("Уровень", "Level")} {s.level}
              </small>
            </div>
            <em>{s.xp} XP</em>
          </div>
        ))}
      </section>
    </div>
  );
}
