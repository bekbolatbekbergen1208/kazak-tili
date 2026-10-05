"use client";
import Link from "next/link";
import { wordExamples } from "@/lib/literary/examples";
import { useState } from "react";
import { Volume2, BookmarkPlus, BookOpen } from "lucide-react";
import { findWord, literaryWords, dailyExpression } from "@/lib/literary/words";
import { useLanguage } from "./provider";
import type { VocabularyEntry } from "@/lib/literary/types";
export function WordCard({
  wordId,
  source = "literature",
  compact = false,
}: {
  wordId: string;
  source?: VocabularyEntry["source"];
  compact?: boolean;
}) {
  const word = findWord(wordId),
    l = useLanguage();
  const [detail, setDetail] = useState<"simple" | "full" | "example">("simple"),
    [audioError, setAudioError] = useState("");
  if (!word) return null;
  const saved = !!l.state.vocabulary[word.id];
  function pronounce() {
    const voice = window.speechSynthesis
      ?.getVoices()
      .find((v) => v.lang.startsWith("kk"));
    if (!voice) {
      setAudioError("Қазақша жүйелік дауыс қолжетімсіз.");
      return;
    }
    const u = new SpeechSynthesisUtterance(word!.word);
    u.lang = "kk-KZ";
    u.voice = voice;
    window.speechSynthesis.speak(u);
  }
  return (
    <article className="lit-word">
      <header>
        <div>
          <span className="overline">
            {word.level} · {word.base}
          </span>
          <>
            {compact ? (
              <strong className="lit-word-title">{word.word}</strong>
            ) : (
              <h3>{word.word}</h3>
            )}
          </>
        </div>
        <button aria-label={`${word.word}: тыңдау`} onClick={pronounce}>
          <Volume2 size={18} />
        </button>
      </header>
      <div className="lit-mini-tabs">
        {[
          ["simple", "Қарапайым түсіндір"],
          ["full", "Толық түсіндір"],
          ["example", "Мысалмен түсіндір"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={detail === id ? "active" : ""}
            onClick={() => setDetail(id as typeof detail)}
          >
            {label}
          </button>
        ))}
      </div>
      <p>
        {detail === "example"
          ? word.example
          : detail === "full"
            ? word.meaning
            : word.simple}
      </p>
      <small>Мысал: {word.example}</small>
      <div className="lit-forms">
        {word.forms.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      {word.synonyms.length > 0 && (
        <p>
          <small>Мағыналас / жақын сөздер: {word.synonyms.join(", ")}</small>
        </p>
      )}
      {word.antonyms.length > 0 && (
        <p>
          <small>Қарсы мәнді сөздер: {word.antonyms.join(", ")}</small>
        </p>
      )}
      {word.related.length > 0 && (
        <small>Байланысты сөздер: {word.related.join(", ")}</small>
      )}
      <button
        className="btn ghost"
        disabled={!l.ready || l.busy || saved || (!l.demo && !l.signedIn)}
        onClick={() =>
          void l.dispatch({ type: "save-word", wordId: word.id, source })
        }
      >
        <BookmarkPlus size={16} />
        {saved ? "Сөздікке сақталды" : "Сөздікке сақтау"}
      </button>
      {!l.demo && !l.signedIn && (
        <small>
          <Link href="/login">Сақтау үшін аккаунтқа кір</Link>
        </small>
      )}
      {audioError && <small role="status">{audioError}</small>}
    </article>
  );
}
export function ExpressionCard() {
  const l = useLanguage();
  return (
    <section className="lit-daily">
      <div>
        <span className="overline">БҮГІНГІ КӨРКЕМ ТІРКЕС</span>
        <h3>{dailyExpression.word}</h3>
        <p>{dailyExpression.meaning}</p>
        <small>{dailyExpression.example}</small>
      </div>
      <button
        className="btn ghost"
        disabled={
          l.busy ||
          !!l.state.vocabulary[dailyExpression.id] ||
          (!l.demo && !l.signedIn)
        }
        onClick={() =>
          void l.dispatch({
            type: "save-word",
            wordId: dailyExpression.id,
            source: "lesson",
          })
        }
      >
        {l.state.vocabulary[dailyExpression.id]
          ? "Сөздікке қосылды"
          : "Сөздікке қосу"}
      </button>
      <Link href="/learn/literature">
        <BookOpen size={18} /> Әдебиет арқылы қазақ тілі →
      </Link>
      {l.error && <p role="alert">{l.error}</p>}
    </section>
  );
}
export function WordActions({
  text,
  source = "dosha",
}: {
  text: string;
  source?: VocabularyEntry["source"];
}) {
  const [opened, setOpened] = useState("");
  const [examples, setExamples] = useState(false);
  const words = literaryWords
    .filter((w) =>
      w.forms.some((f) =>
        text.toLocaleLowerCase().includes(f.toLocaleLowerCase()),
      ),
    )
    .slice(0, 3);
  if (!words.length) return null;
  return (
    <div className="lit-word-actions">
      {words.map((w) => (
        <button
          key={w.id}
          onClick={() => {
            setOpened(opened === w.id ? "" : w.id);
            setExamples(false);
          }}
        >
          {w.word} · Сөздікке сақтау
        </button>
      ))}
      {opened && (
        <>
          <WordCard wordId={opened} source={source} />
          <Link href="/learn/vocabulary">Осы сөзбен жаттығу →</Link>
          <button onClick={() => setExamples((v) => !v)}>Тағы 3 мысал</button>
          {examples && (
            <ol>
              {wordExamples(opened).map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ol>
          )}
          <Link
            href={`/learn/writing-coach?mode=speaking&word=${encodeURIComponent(findWord(opened)?.word ?? "")}`}
          >
            Айтылымда қолдану →
          </Link>
        </>
      )}
    </div>
  );
}
