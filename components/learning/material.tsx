"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/learning/types";
import { useLanguage } from "@/components/literary/provider";
export function LessonMaterial({ lesson }: { lesson: Lesson }) {
  const language = useLanguage(),
    [word, setWord] = useState(0);
  if (!lesson.introduction || !lesson.vocabulary) return null;
  const w = lesson.vocabulary[word],
    id = w.id ?? `content:${w.kk.toLocaleLowerCase("kk-KZ")}`;
  return (
    <section className="qd-content-material">
      <div className="qd-content-facts">
        <span>
          {lesson.level} · {lesson.topic}
        </span>
        <span>
          {lesson.minutes} минут · {lesson.exercises.length} тапсырма
        </span>
      </div>
      <h2>Оқу мақсаты</h2>
      <p>{lesson.objective}</p>
      <p className="qd-content-prereq">
        Алғышарт:{" "}
        {lesson.prerequisites?.length
          ? lesson.prerequisites.map((id) => (
              <Link key={id} href={`/learn/${id}`}>
                Алдыңғы сабақ →
              </Link>
            ))
          : "Осы модульді сөздіктің көмегімен бастай аласың."}
      </p>
      <article className="qd-content-text">
        <h3>Оқы да, жағдайды түсін</h3>
        <p>{lesson.introduction}</p>
      </article>
      <div className="qd-content-word-tabs">
        {lesson.vocabulary.map((entry, i) => (
          <button
            key={entry.kk}
            className={word === i ? "active" : ""}
            onClick={() => setWord(i)}
          >
            {entry.kk}
          </button>
        ))}
      </div>
      <article className="qd-content-word">
        <b>{w.kk}</b>
        <p>{w.meaning}</p>
        <small>
          RU: {w.ru} · EN: {w.en}
        </small>
        <blockquote>{w.example}</blockquote>
        <button
          className="btn ghost"
          disabled={
            !language.ready ||
            language.busy ||
            !!language.state.vocabulary[id] ||
            (!language.demo && !language.signedIn)
          }
          onClick={() =>
            void language.dispatch({
              type: "save-word",
              wordId: id,
              source: "lesson",
            })
          }
        >
          {language.state.vocabulary[id]
            ? "✓ Сөздікке сақталды"
            : "Менің сөздеріме қосу"}
        </button>
        {language.error && <p role="alert">{language.error}</p>}
      </article>
      <details className="qd-content-explanation" open>
        <summary>Сөйлем үлгісін түсін</summary>
        <p>{lesson.explanation}</p>
        <div>
          {lesson.dialogue?.map((line, i) => (
            <p key={i}>
              <b>{line.speaker}:</b> {line.text}
            </p>
          ))}
        </div>
      </details>
      <p className="qd-content-review">
        Қайталауға арналған сөздер: {lesson.reviewWords?.join(" · ")}
      </p>
      {lesson.regionId && (
        <Link className="btn ghost" href={`/kazakhstan/${lesson.regionId}`}>
          Өңірдің мәдени контекстін ашу →
        </Link>
      )}
    </section>
  );
}
export function LessonHint({
  lessonId,
  exerciseId,
  lastAnswer,
}: {
  lessonId: string;
  exerciseId: string;
  lastAnswer?: string;
}) {
  const [busy, setBusy] = useState(false),
    [reply, setReply] = useState(""),
    [error, setError] = useState("");
  async function ask() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: lastAnswer
            ? `Менің жауабым: ${lastAnswer.slice(0, 1200)}. Қалай жақсартуға болатынын бағыттап түсіндір.`
            : "Осы тапсырманы түсінуге бағыт берші, дайын жауапты бірден айтпа.",
          history: [],
          language: "kk",
          lessonSupport: { lessonId, exerciseId },
        }),
      });
      const b = await res.json();
      if (!res.ok || typeof b.reply !== "string")
        throw Error(
          "Досша қазір жауап бермеді. Сабақтағы түсіндірмені оқып, жалғастыра аласың.",
        );
      setReply(b.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Досша көмегі ашылмады.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="qd-content-hint">
      <button className="btn ghost" disabled={busy} onClick={() => void ask()}>
        {busy ? "Досша ойланып жатыр…" : "Досшадан бағыт сұрау"}
      </button>
      {reply && <p role="status">{reply}</p>}
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
