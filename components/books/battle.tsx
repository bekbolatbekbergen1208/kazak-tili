"use client";
import { useEffect, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { battleFor } from "@/lib/books/catalog";
import {
  BATTLE_SECONDS,
  PASS_SCORE,
  recordFor,
  shuffled,
} from "@/lib/books/state";
import type { BattleQuestion, ReadingBook } from "@/lib/books/types";

function BattleChoice({
  question,
  onAnswer,
  disabled,
}: {
  question: BattleQuestion;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}) {
  const [options] = useState(() => shuffled(question.options));
  return (
    <>
      <h3>{question.prompt}</h3>
      <div className="bw-options">
        {options.map((o) => (
          <button
            key={o}
            disabled={disabled}
            className="bw-option"
            onClick={() => onAnswer(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}
export function BookBattle({ book }: { book: ReadingBook }) {
  const { state, dispatch, busy } = useLearning();
  const p = recordFor(state, book.id),
    battle = p.battle;
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const seconds = battle
    ? Math.max(
        0,
        Math.ceil(
          (Date.parse(battle.startedAt) + BATTLE_SECONDS * 1000 - now) / 1000,
        ),
      )
    : BATTLE_SECONDS;
  const questions = battleFor(book);
  const nextId = battle?.order.find((id) => !Object.hasOwn(battle.answers, id));
  const question = questions.find((q) => q.id === nextId);
  async function finish() {
    setSubmitting(true);
    await dispatch({ type: "book-battle-finish", bookId: book.id });
    setSubmitting(false);
  }
  // Expiry disables answers immediately; the explicit finish button also allows
  // retrying a failed network save, without resubmitting on every timer tick.
  return (
    <section className="panel bw-battle" aria-labelledby="battle-title">
      <span className="bw-eyebrow">ФІНАЛДЫҚ КІТАП ШАЙҚАСЫ</span>
      <h2 id="battle-title">Біліміңді жарқырат ✨</h2>
      <p>
        10 сұрақ · 3 минут · сертификат үшін {PASS_SCORE}/10. Әр жауап бір рет
        қабылданады. Қайта ашқанда уақыт жалғасады.
      </p>
      {!battle || battle.finishedAt ? (
        <>
          {battle?.finishedAt && (
            <div
              className={`bw-feedback ${battle.score! >= PASS_SCORE ? "success" : ""}`}
              role="status"
            >
              <h3>
                {battle.score! >= PASS_SCORE
                  ? "🏆 Кітап бағындырылды!"
                  : "Жақсы бастама. Қайталап көр!"}
              </h3>
              <strong className="bw-score">{battle.score} / 10</strong>
              <p>
                Ең жақсы нәтиже: {p.bestScore}/10. Ұпай марапаты тек жаңа үздік
                нәтижеге беріледі.
              </p>
              {battle.score! >= PASS_SCORE && (
                <p>
                  Белгіше мен сертификат ашылды. Алғаш аяқтау: +50 XP · 🪙 20 ·
                  💎 5.
                </p>
              )}
              <details>
                <summary>Жауаптарды талдау</summary>
                {questions.map((q) => (
                  <div className="bw-review-answer" key={q.id}>
                    <b>
                      {battle.answers[q.id] === q.answer ? "✓" : "○"} {q.prompt}
                    </b>
                    <p>
                      Сенің жауабың: {battle.answers[q.id] ?? "Жауап берілмеді"}
                    </p>
                    <p>Дұрыс жауап: {q.answer}</p>
                  </div>
                ))}
              </details>
            </div>
          )}
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              setNow(Date.now());
              await dispatch({ type: "book-battle-start", bookId: book.id });
            }}
          >
            {battle ? "Қайта ойнау · жаңа рет" : "Шайқасты бастау"}
          </button>
        </>
      ) : (
        <>
          <div className={`bw-battle-bar ${seconds < 30 ? "urgent" : ""}`}>
            <b role="timer" aria-label="Қалған уақыт">
              ◷ {Math.floor(seconds / 60)}:
              {String(seconds % 60).padStart(2, "0")}
            </b>
            <span>{Object.keys(battle.answers).length} / 10 жауап</span>
          </div>
          <progress
            aria-label="Финалдық тест прогресі"
            value={Object.keys(battle.answers).length}
            max={10}
          />
          {seconds > 0 && question ? (
            <BattleChoice
              key={`${battle.startedAt}-${question.id}`}
              question={question}
              disabled={busy || submitting}
              onAnswer={async (answer) => {
                setSubmitting(true);
                await dispatch({
                  type: "book-battle-answer",
                  bookId: book.id,
                  questionId: question.id,
                  answer,
                });
                setSubmitting(false);
              }}
            />
          ) : (
            <>
              <p role="status">
                {seconds === 0
                  ? "Уақыт аяқталды. Қабылданған жауаптарың бойынша нәтиже есептеледі."
                  : "Барлық жауап қабылданды!"}
              </p>
              <button
                disabled={busy || submitting}
                className="btn primary"
                onClick={() => void finish()}
              >
                {busy ? "Сақталуда…" : "Нәтижені сақтау"}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
