"use client";
import { useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { shuffled, validTask } from "@/lib/books/state";
import type { ReadingBook, ReadingTask } from "@/lib/books/types";

export function BookTask({
  book,
  task,
  saved,
  onDone,
}: {
  book: ReadingBook;
  task: ReadingTask;
  saved?: string;
  onDone: () => void;
}) {
  const { dispatch, busy } = useLearning();
  const [options] = useState(() => shuffled(task.options ?? []));
  const [answer, setAnswer] = useState(saved ?? "");
  const [order, setOrder] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>(
    book.vocabulary.map(() => ""),
  );
  const [fields, setFields] = useState<string[]>(() => {
    try {
      const value = JSON.parse(saved ?? "[]");
      return task.kind === "map" && value.length === 4
        ? value
        : ["", "", "", ""];
    } catch {
      return ["", "", "", ""];
    }
  });
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);
  const value =
    task.kind === "order"
      ? JSON.stringify(order)
      : task.kind === "match"
        ? JSON.stringify(matches)
        : task.kind === "map"
          ? JSON.stringify(fields)
          : answer;
  async function check() {
    if (!validTask(task, value)) {
      setFeedback(
        ["map", "ending", "opinion"].includes(task.kind)
          ? "Жауабыңды толықтыр: тапсырмадағы өрістер мен сөйлем санына қойылған талапты тексер."
          : `Әлі де ойлан. ${task.explanation}`,
      );
      return;
    }
    const next = await dispatch({
      type: "book-answer",
      bookId: book.id,
      taskId: task.id,
      answer: value,
    });
    if (next) {
      setDone(true);
      setFeedback(task.explanation);
    }
  }
  return (
    <section className="panel bw-task" aria-labelledby="task-title">
      <span className="bw-eyebrow">ОҚЫҒАНЫҢДЫ БЕКІТ</span>
      <h2 id="task-title">{task.title}</h2>
      <p>{task.prompt}</p>
      <fieldset disabled={busy || done} className="bw-task-fields">
        <legend className="sr-only">Жауап енгізу</legend>
        {task.kind === "order" ? (
          <>
            <ol className="bw-order">
              {order.map((text, i) => (
                <li key={text}>
                  <span>{i + 1}</span>
                  <button
                    onClick={() => setOrder(order.filter((x) => x !== text))}
                    aria-label={`${text}: ретінен алып тастау`}
                  >
                    {text} ×
                  </button>
                </li>
              ))}
            </ol>
            <div className="bw-options">
              {options
                .filter((x) => !order.includes(x))
                .map((text) => (
                  <button
                    key={text}
                    className="bw-option"
                    onClick={() => setOrder([...order, text])}
                  >
                    {text} +
                  </button>
                ))}
            </div>
            <button className="bw-text-link" onClick={() => setOrder([])}>
              Ретін қайта бастау
            </button>
          </>
        ) : task.kind === "match" ? (
          <div className="bw-form">
            {book.vocabulary.map((v, i) => (
              <label key={v.word}>
                {v.word}
                <select
                  value={matches[i]}
                  onChange={(e) =>
                    setMatches(
                      matches.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                >
                  <option value="">Мағынасын таңда</option>
                  {options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : task.kind === "map" ? (
          <div className="bw-form">
            {["Мінезі", "Мақсаты", "Әрекеті", "Басқалармен байланысы"].map(
              (label, i) => (
                <label key={label}>
                  {label}
                  <textarea
                    maxLength={700}
                    rows={2}
                    value={fields[i]}
                    onChange={(e) =>
                      setFields(
                        fields.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    placeholder="Кемінде 12 таңба…"
                  />
                </label>
              ),
            )}
          </div>
        ) : task.kind === "ending" || task.kind === "opinion" ? (
          <label className="bw-writing">
            Сенің жауабың
            <textarea
              rows={6}
              maxLength={4000}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                task.kind === "ending"
                  ? "3–5 толық сөйлем жаз…"
                  : "Менің ойымша… Себебі…"
              }
            />
            <small>{answer.length} / 4000 · жібергенде сақталады</small>
          </label>
        ) : (
          <div
            className="bw-options"
            role="radiogroup"
            aria-label="Жауап нұсқалары"
          >
            {options.map((o) => (
              <label
                className={`bw-option ${answer === o ? "selected" : ""}`}
                key={o}
              >
                <input
                  type="radio"
                  name={task.id}
                  checked={answer === o}
                  onChange={() => setAnswer(o)}
                />
                {o}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {feedback && (
        <div role="status" className={`bw-feedback ${done ? "success" : ""}`}>
          <b>{done ? "✓ Сақталды" : "Тағы байқап көр"}</b>
          <p>{feedback}</p>
          {done && (
            <small>
              {saved
                ? "Қайта орындау: марапат бұрын берілген."
                : "+10 XP · 🪙 2 · 💎 1"}
            </small>
          )}
        </div>
      )}
      {done ? (
        <button className="btn primary" onClick={onDone}>
          Тапсырмаларға оралу →
        </button>
      ) : (
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void check()}
        >
          {busy
            ? "Сақталуда…"
            : ["map", "ending", "opinion"].includes(task.kind)
              ? "Жауапты сақтау"
              : "Жауапты тексеру"}
        </button>
      )}
    </section>
  );
}
