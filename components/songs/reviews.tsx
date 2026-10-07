"use client";
import { useEffect, useState } from "react";
import { songsOf, normal } from "@/lib/songs/state";
import { songLesson, songWord } from "@/lib/songs/content";
import { useLearning } from "@/components/learning/provider";
export function SongReviews({ lessonId }: { lessonId?: string }) {
  const l = useLearning(),
    reviews = Object.values(songsOf(l.state).reviews).filter(
      (r) =>
        !lessonId || songLesson(lessonId)?.words.some((w) => w.id === r.wordId),
    );
  const [answer, setAnswer] = useState<Record<string, string>>({}),
    [feedback, setFeedback] = useState<Record<string, string>>({});
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  if (!reviews.length)
    return (
      <p className="song-note">✓ Қазір қате жауаптан қосылған сөздер жоқ.</p>
    );
  return (
    <section className="song-review">
      <h3>Қайталау қажет сөздер</h3>
      <p>
        Қате жауаптағы сөздер осында сақталады. Дұрыс жауаптан кейін келесі
        қайталау — бір күннен соң. Бұл әрекет XP қоспайды.
      </p>
      {reviews.map((r) => {
        const w = songWord(r.wordId)!;
        const due = Date.parse(r.dueAt) <= Math.max(clock, Date.now());
        return (
          <div className="song-review-word" key={r.wordId}>
            <label>
              <b>
                {w.ru} · {w.en}
              </b>
              <span>Қазақша бастапқы тұлғасын жаз</span>
              <input
                aria-label={`${w.id} қайталау`}
                value={answer[r.wordId] ?? ""}
                disabled={!due || l.busy}
                onChange={(e) =>
                  setAnswer({ ...answer, [r.wordId]: e.target.value })
                }
              />
            </label>
            <button
              className="btn ghost"
              disabled={!due || l.busy || !answer[r.wordId]?.trim()}
              onClick={async () => {
                const result = await l.dispatch({
                  type: "song-review",
                  wordId: r.wordId,
                  answer: answer[r.wordId],
                });
                if (result)
                  setFeedback({
                    ...feedback,
                    [r.wordId]:
                      normal(answer[r.wordId]) === normal(w.base)
                        ? "✓ Дұрыс! Ертең тағы қайталаймыз."
                        : `↻ Дұрыс сөз: ${w.base}. ${w.example}`,
                  });
              }}
            >
              Қайталауды тексеру
            </button>
            {r.lastReviewedAt && (
              <p className="song-note">
                {r.lastCorrect
                  ? "✓ Соңғы қайталау: дұрыс жауап"
                  : "↻ Соңғы қайталау: қайта жаттығу қажет"}{" "}
                · {r.correct}/{r.attempts} дұрыс жауап
              </p>
            )}
            {!due && (
              <small>
                Келесі қайталау:{" "}
                {new Date(r.dueAt).toLocaleString("kk-KZ", {
                  timeZone: "Asia/Aqtau",
                })}
              </small>
            )}
            {feedback[r.wordId] && <p role="status">{feedback[r.wordId]}</p>}
          </div>
        );
      })}
    </section>
  );
}
