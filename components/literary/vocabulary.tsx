"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "./provider";
import { findWord } from "@/lib/literary/words";
import { languageGrowth } from "@/lib/literary/state";
import { WordCard } from "./word";
export default function Vocabulary() {
  const l = useLanguage(),
    growth = languageGrowth(l.state);
  const [filter, setFilter] = useState("all"),
    [opened, setOpened] = useState(""),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState("");
  const due = Object.values(l.state.vocabulary).filter(
      (x) => Date.parse(x.dueAt) <= Date.now(),
    ),
    active = due.find((x) => x.wordId === opened) ?? due[0],
    word = active ? findWord(active.wordId) : null;
  return (
    <div className="page lit-page">
      <header className="lit-heading">
        <div>
          <span className="overline">КЕЗДЕСТІР → ҚАЙТАЛА → ҚОЛДАН</span>
          <h1>Менің сөз қорым</h1>
          <p>Жаңа сөзді сақта. Уақыты келгенде мағынасы бойынша есіңе түсір.</p>
        </div>
        <Link className="btn ghost" href="/learn/literature">
          Мәтіннен сөз үйрен →
        </Link>
      </header>
      <div className="lit-stats">
        {[
          [growth.saved, "Сақталған сөз"],
          [growth.mastered, "Меңгерілген"],
          [growth.expressions, "Тұрақты тіркес"],
          [due.length, "Қайталау кезегі"],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {l.error && (
        <p className="lit-error" role="alert">
          {l.error}
          <button onClick={() => void l.load()}>Қайта жүктеу</button>
        </p>
      )}
      {!l.ready ? (
        <p>Сөздік жүктелуде…</p>
      ) : !growth.saved ? (
        <section className="lit-panel">
          <h2>Сөздігің әзірге бос</h2>
          <p>Досжаннан, Vision-нан немесе әдебиет мәтінінен сөз сақта.</p>
          <Link href="/learn/literature" className="btn primary">
            Алғашқы мәтінді ашу →
          </Link>
        </section>
      ) : (
        <>
          {word && (
            <section className="lit-panel">
              <span className="overline">АРАЛЫҚПЕН ҚАЙТАЛАУ</span>
              <h2>Қай сөздің мағынасы?</h2>
              <p>{word.meaning}</p>
              <input
                aria-label="Еске түсірген сөз"
                value={answer}
                maxLength={200}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Сөзді есіңе түсіріп жаз…"
              />
              <button
                className="btn primary"
                disabled={l.busy || !answer.trim()}
                onClick={async () => {
                  const out = await l.dispatch({
                    type: "review-word",
                    wordId: active!.wordId,
                    answer,
                  });
                  if (out) {
                    setFeedback(
                      out.correct
                        ? "Дұрыс! Келесі қайталау уақыты белгіленді."
                        : `Қайта жаттықтыр: ${word.word}. 10 минуттан кейін есіңе түсір.`,
                    );
                    setAnswer("");
                  }
                }}
              >
                Тексеру
              </button>
              <p role="status">{feedback}</p>
              <small>
                Дұрыс жауаптан кейін: 1 → 3 → 7 → 14 → 30 күн. Қате болса: 10
                минут. Төрт сәтті қайталау — «меңгерілген».
              </small>
            </section>
          )}
          {!due.length && (
            <p className="lit-notice">
              Қазір қайталайтын сөз жоқ. Келесі қайталау уақытын төменнен қара.
            </p>
          )}
          <div className="lit-levels">
            {[
              ["all", "Барлығы"],
              ["new", "Жаңа"],
              ["learning", "Үйреніп жүрмін"],
              ["mastered", "Меңгерілген"],
            ].map(([id, name]) => (
              <button
                className={filter === id ? "active" : ""}
                key={id}
                onClick={() => setFilter(id)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="lit-vocab-list">
            {Object.values(l.state.vocabulary)
              .filter((x) => filter === "all" || x.status === filter)
              .map((entry) => {
                const w = findWord(entry.wordId);
                return w ? (
                  <div key={entry.wordId}>
                    <button
                      onClick={() => {
                        setOpened(opened === entry.wordId ? "" : entry.wordId);
                        setAnswer("");
                      }}
                    >
                      <b>{w.word}</b>
                      <span>
                        {entry.status === "new"
                          ? "Жаңа"
                          : entry.status === "learning"
                            ? "Үйреніп жүрмін"
                            : "Меңгерілген"}{" "}
                        ·{" "}
                        {new Date(entry.dueAt).toLocaleString("kk-KZ", {
                          timeZone: "Asia/Aqtau",
                        })}
                      </span>
                    </button>
                    {opened === entry.wordId && (
                      <WordCard wordId={entry.wordId} source={entry.source} />
                    )}
                  </div>
                ) : null;
              })}
          </div>
        </>
      )}
      {l.state.badges.length > 0 && (
        <div className="lit-badges">
          {l.state.badges.map((b) => (
            <span key={b}>✦ {b}</span>
          ))}
        </div>
      )}
    </div>
  );
}
export function LanguageGrowth() {
  const l = useLanguage(),
    g = languageGrowth(l.state);
  return (
    <section className="lit-panel">
      <span className="overline">ТІЛДІК ӨСІМ</span>
      <h3>Сөздік пен көркем тіл</h3>
      <div className="lit-stats">
        {[
          [g.saved, "Сақталған сөз"],
          [g.mastered, "Меңгерілген сөз"],
          [g.expressions, "Үйренген тіркес"],
          [g.texts, "Аяқталған мәтін"],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {g.naturalness !== null && (
        <p>
          Жазу табиғилығы: {l.state.writingHistory[0]?.score ?? g.naturalness} →{" "}
          {g.naturalness} <small>(эвристикалық тексеру)</small>
        </p>
      )}
      <Link href="/learn/vocabulary">Сөз қорымды ашу →</Link>
    </section>
  );
}
