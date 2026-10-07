"use client";
import { useEffect, useState } from "react";
import type { SongTask } from "@/lib/songs/types";
import { taskCorrect } from "@/lib/songs/state";
export function SongGame({
  task,
  saved,
  busy,
  onAnswer,
}: {
  task: SongTask;
  saved?: { answer: string | string[]; correct: boolean };
  busy: boolean;
  onAnswer: (a: string | string[]) => Promise<boolean>;
}) {
  const [answer, setAnswer] = useState<string | string[]>(
      task.kind === "match"
        ? task.pairs!.map(() => "")
        : task.kind === "order"
          ? []
          : "",
    ),
    [result, setResult] = useState<boolean | null>(saved?.correct ?? null);
  useEffect(() => {
    setAnswer(
      saved?.answer ??
        (task.kind === "match"
          ? task.pairs!.map(() => "")
          : task.kind === "order"
            ? []
            : ""),
    );
    setResult(saved?.correct ?? null);
  }, [saved, task]);
  const disabled = busy || saved?.correct === true;
  return (
    <article className="song-game">
      <span className="overline">
        {task.kind === "gap"
          ? "БОС ОРЫН"
          : task.kind === "order"
            ? "СӨЙЛЕМ ҚҰРА"
            : task.kind === "match"
              ? "СӘЙКЕСТЕНДІР"
              : task.kind === "comprehension"
                ? "МӘТІНДІ ТҮСІН"
                : "ТЫҢДАП ТАП"}
      </span>
      <h3>{task.prompt}</h3>
      {task.kind === "match" ? (
        <div className="song-matches">
          {task.pairs!.map((p, i) => (
            <label key={p.word}>
              <b>{p.word}</b>
              <select
                disabled={disabled}
                value={Array.isArray(answer) ? answer[i] : ""}
                onChange={(e) => {
                  const arr = [...(answer as string[])];
                  arr[i] = e.target.value;
                  setAnswer(arr);
                  setResult(null);
                }}
                aria-label={`${p.word} мағынасы`}
              >
                <option value="">Мағынасын таңда</option>
                {task.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : task.kind === "order" ? (
        <>
          <div className="song-sentence" aria-label="Құрастырылған сөйлем">
            {(answer as string[]).join(" ") || "Сөздерді ретімен бас"}
          </div>
          <div className="song-actions">
            {task.options.map((o, i) => (
              <button
                key={i}
                className="btn ghost"
                disabled={
                  disabled ||
                  (answer as string[]).filter((v) => v === o).length >=
                    task.options.filter((v) => v === o).length
                }
                onClick={() => {
                  setAnswer([...(answer as string[]), o]);
                  setResult(null);
                }}
              >
                {o}
              </button>
            ))}
            <button
              className="btn ghost"
              disabled={disabled}
              onClick={() => {
                setAnswer([]);
                setResult(null);
              }}
            >
              Тазарту
            </button>
          </div>
        </>
      ) : (
        <fieldset className="song-options">
          <legend className="song-sr-only">Жауап нұсқалары</legend>
          {task.options.map((o) => (
            <label key={o} className={answer === o ? "selected" : ""}>
              <input
                type="radio"
                name={`song-${task.id}`}
                disabled={disabled}
                checked={answer === o}
                onChange={() => {
                  setAnswer(o);
                  setResult(null);
                }}
              />
              {o}
            </label>
          ))}
        </fieldset>
      )}
      <button
        className="btn primary"
        disabled={
          disabled ||
          !answer.length ||
          (Array.isArray(answer) && answer.some((a) => !a))
        }
        onClick={async () => {
          if (await onAnswer(answer)) setResult(taskCorrect(task, answer));
        }}
      >
        Жауапты тексеру
      </button>
      {result !== null && (
        <p
          role="status"
          className={`song-feedback ${result ? "correct" : "wrong"}`}
        >
          <b>{result ? "✓ Дұрыс!" : "↻ Қайта байқап көр."}</b>{" "}
          {task.explanation}
          {!result && " Қиын сөз қайталау тізіміне қосылды."}
        </p>
      )}
    </article>
  );
}
