"use client";
import { useState } from "react";
import type { HistoryTask } from "@/lib/history/types";
import { shuffled } from "@/lib/books/state";
import { cityProgress } from "@/lib/history/state";
import { useLearning } from "@/components/learning/provider";
import { Dossha } from "./shared";
import { HistoryArt } from "./art";

export function HistoryTaskGame({
  task,
  cityId,
  onClose,
}: {
  task: HistoryTask;
  cityId: string;
  onClose: () => void;
}) {
  const { state, dispatch, busy } = useLearning(),
    [options] = useState(() => shuffled(task.options));
  const [answer, setAnswer] = useState(""),
    [parts, setParts] = useState<string[]>([]),
    [piece, setPiece] = useState(""),
    [feedback, setFeedback] = useState("");
  const solved = cityProgress(state, cityId).tasks.includes(task.id),
    isOrder = task.kind === "timeline" || task.kind === "route",
    isSlots = task.kind === "match" || task.kind === "build";
  const serialized = isOrder || isSlots ? JSON.stringify(parts) : answer;
  const complete = isOrder
    ? parts.length === (task.kind === "route" ? 3 : task.options.length)
    : isSlots
      ? task.labels!.every((_, i) => parts[i])
      : !!answer;
  async function check() {
    const next = await dispatch({
      type: "history-answer",
      cityId,
      taskId: task.id,
      answer: serialized,
    });
    if (next)
      setFeedback(
        cityProgress(next, cityId).tasks.includes(task.id)
          ? "Дұрыс! Тамаша байқадың."
          : "Тағы ойланып көр. Ұпайың кемімейді.",
      );
  }
  return (
    <div className="hs-task">
      <p>{task.prompt}</p>
      {task.person && <p className="hs-person">◈ {task.person}</p>}
      {isOrder ? (
        <>
          <div
            className={task.kind === "route" ? "hs-route-path" : "hs-timeline"}
            aria-label="Таңдалған рет"
          >
            {parts.length ? (
              parts.map((p, i) => (
                <span key={p}>
                  {i + 1}. {p}
                </span>
              ))
            ) : (
              <p>
                {task.kind === "route"
                  ? "Қақпадан базарға дейін үш аялдама таңда."
                  : "Алғашқы оқиғадан баста."}
              </p>
            )}
          </div>
          <div className="hs-options">
            {options.map((o) => (
              <button
                key={o}
                disabled={solved || parts.includes(o)}
                onClick={() => {
                  setParts((p) => [...p, o]);
                  setFeedback("");
                }}
              >
                {o} +
              </button>
            ))}
          </div>
          <button
            className="hs-button hs-soft"
            disabled={solved}
            onClick={() => {
              setParts([]);
              setFeedback("");
            }}
          >
            Ретті тазалау
          </button>
        </>
      ) : isSlots ? (
        <>
          {task.kind === "build" && (
            <>
              <div className="hs-build-preview">
                <HistoryArt kind={cityId === "taraz" ? "tile" : "dome"} />
                <span>Оқу үлгісі</span>
              </div>
              <p>Бөлшекті таңда, содан кейін оның орнын бас.</p>
              <div className="hs-options">
                {options.map((o) => (
                  <button
                    key={o}
                    disabled={solved}
                    aria-pressed={piece === o}
                    onClick={() => setPiece(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}
          <div
            className={`hs-slots ${task.kind === "build" ? "hs-build-slots" : ""}`}
          >
            {task.labels!.map((label, i) => (
              <label key={label}>
                <strong>{label}</strong>
                {task.kind === "match" ? (
                  <select
                    aria-label={label}
                    disabled={solved}
                    value={parts[i] ?? ""}
                    onChange={(e) => {
                      const next = [...parts];
                      next[i] = e.target.value;
                      setParts(next);
                      setFeedback("");
                    }}
                  >
                    <option value="">Сәйкестігін таңда</option>
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    aria-label={`${label}: ${parts[i] || "бос"}`}
                    disabled={solved || !piece}
                    onClick={() => {
                      const next = [...parts];
                      next[i] = piece;
                      setParts(next);
                      setFeedback("");
                    }}
                  >
                    {parts[i] || "+ Бөлшек қой"}
                  </button>
                )}
              </label>
            ))}
          </div>
        </>
      ) : (
        <div className="hs-options">
          {options.map((o) => (
            <button
              key={o}
              disabled={solved}
              aria-pressed={answer === o}
              onClick={() => {
                setAnswer(o);
                setFeedback("");
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {feedback && (
        <p className={solved ? "hs-success" : "hs-hint"} role="status">
          {feedback}
        </p>
      )}
      <Dossha>
        {solved
          ? task.explanation
          : feedback || cityProgress(state, cityId).mistakes[task.id]
            ? task.hint
            : "Байқаған деректеріңді еске түсір. Асықпай таңда — қателессең, бірге қайта қараймыз."}
      </Dossha>
      {solved ? (
        <>
          <p className="hs-success">
            ✓ Тапсырма аяқталды · +15 XP · +3 🪙
            {["route", "build"].includes(task.kind) ? " · +1 💎" : ""}
          </p>
          <button className="hs-button" onClick={onClose}>
            Қалаға оралу
          </button>
        </>
      ) : (
        <button
          className="hs-button"
          disabled={busy || !complete}
          onClick={() => void check()}
        >
          {busy ? "Тексеріліп жатыр…" : "Жауапты тексеру"}
        </button>
      )}
    </div>
  );
}
