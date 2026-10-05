"use client";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./provider";
import type { Quality } from "@/lib/literary/types";
import { WordActions } from "./word";
type Result = {
  original: string;
  suggested: string;
  changes: string[];
  quality: Quality;
  mode: "reference" | "ai";
  level: string;
  saved: boolean;
  notice: string;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
export default function WritingCoach() {
  const l = useLanguage();
  const [text, setText] = useState(""),
    [mode, setMode] = useState("writing"),
    [level, setLevel] = useState("A2"),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const word = params.get("word");
    if (params.get("mode") === "speaking") setMode("speaking");
    if (word) setText(`«${word}» сөзін қолданып сөйлем құрағым келеді.`);
    return () => recognition.current?.stop();
  }, []);
  async function check() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/literary/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode, level, demo: l.demo }),
      });
      const b = await res.json().catch(() => {
        throw Error(
          "Қызмет қазір қолжетімсіз. Біраздан кейін қайта байқап көр.",
        );
      });
      if (!res.ok) throw Error(b.error);
      setResult(b);
      if (b.saved) window.dispatchEvent(new Event("qd-language-refresh"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Тексеру орындалмады.");
    } finally {
      setBusy(false);
    }
  }
  function speak() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const browser = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor =
      browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) {
      setError(
        "Қазақша сөйлеуді мәтінге айналдыру бұл браузерде қолжетімсіз. Мәтінді өзің енгіз.",
      );
      return;
    }
    try {
      const rec = new Constructor();
      recognition.current = rec;
      rec.lang = "kk-KZ";
      rec.interimResults = false;
      rec.onresult = (e) =>
        setText(
          Array.from(e.results)
            .map((r) => r[0].transcript)
            .join(" "),
        );
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        setError(
          "Дауыс танылмады. Микрофон рұқсатын тексер немесе мәтінді өзің енгіз.",
        );
      };
      rec.start();
      setListening(true);
    } catch {
      setError("Микрофон іске қосылмады.");
    }
  }
  return (
    <div className="page lit-page">
      <header className="lit-heading">
        <div>
          <span className="overline">ОЙЫҢДЫ САҚТА. ТІЛІҢДІ ЖЕТІЛДІР.</span>
          <h1>Қазақша жазу көмекшісі</h1>
          <p>
            Бастапқы мәтін, ұсынылған нұсқа және өзгерістің себебі қатар
            көрсетіледі.
          </p>
        </div>
      </header>
      <section className="lit-panel">
        <div className="lit-levels">
          {[
            ["writing", "Жазылымды тексер"],
            ["enrich", "Сөйлемді көркемдет"],
            ["speaking", "Айтылымды жақсарт"],
          ].map(([id, name]) => (
            <button
              key={id}
              className={mode === id ? "active" : ""}
              onClick={() => {
                setMode(id);
                setResult(null);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        {l.demo && (
          <label>
            Демо оқушы деңгейі
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {["A1", "A2", "B1", "B2", "C1"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        <textarea
          aria-label="Тексерілетін мәтін"
          rows={7}
          maxLength={5000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Мысалы: Мен магазинге бардым. Немесе: Күн жақсы болды."
        />
        {mode === "speaking" && (
          <>
            <button className="btn ghost" onClick={speak}>
              {listening ? "Жазуды тоқтату" : "Микрофонмен айту"}
            </button>
            <p>
              <small>
                Сөйлеуді тану браузердің қызметімен орындалады; аудио браузер
                провайдеріне жіберілуі мүмкін. Мәтінді тексеруге өзің жібересің.
                Айтылым дыбысына баға қойылмайды.
              </small>
            </p>
          </>
        )}
        <button
          className="btn primary"
          disabled={!l.ready || busy || text.trim().length < 3}
          onClick={() => void check()}
        >
          {busy ? "Тексерілуде…" : "Ұсынысты көру →"}
        </button>
        {error && (
          <p className="lit-error" role="alert">
            {error}
          </p>
        )}
      </section>
      {result && (
        <>
          <section className="lit-panel">
            <span className="pill">
              {result.mode === "ai" ? "Dosha AI" : "Анықтамалық тексеру"} ·{" "}
              {result.level}
            </span>
            <div className="lit-coach-compare">
              <article>
                <h3>Бастапқы мәтін</h3>
                <p>{result.original}</p>
              </article>
              <article>
                <h3>Ұсынылған нұсқа</h3>
                <p>{result.suggested}</p>
              </article>
            </div>
            <h3>Неге осылай?</h3>
            <ul>
              {result.changes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="lit-stats">
              {[
                [result.quality.grammar_score, "Грамматика белгілері"],
                [result.quality.naturalness_score, "Табиғилық белгілері"],
                [result.quality.lexical_richness_score, "Сөз қолданысы"],
                [result.quality.level_match_score, "Деңгейге сәйкестік"],
              ].map(([n, label]) => (
                <div key={label}>
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <small>{result.notice}</small>
            <WordActions text={result.suggested} />
          </section>
        </>
      )}
    </div>
  );
}
