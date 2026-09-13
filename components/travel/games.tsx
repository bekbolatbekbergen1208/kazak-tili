"use client";
import { useEffect, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import type { Region, Word } from "@/lib/travel/types";
import { travelOf } from "@/lib/travel/state";
import { TravelIcon } from "./art";
import {
  SceneCharacter,
  SteppeBackdrop,
  type SceneRegion,
} from "@/components/national/scene-art";
import { equipmentFor, selectedCharacter } from "@/lib/characters/state";
export function VocabularyCards({ region }: { region: Region }) {
  const { state, dispatch, busy } = useLearning();
  const [active, setActive] = useState<Word | null>(null),
    [answer, setAnswer] = useState(""),
    [feedback, setFeedback] = useState("");
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () =>
      setVoice(
        synth.getVoices().find((v) => /^kk(?:-|_|$)/i.test(v.lang)) ?? null,
      );
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      synth.cancel();
    };
  }, []);
  useEffect(() => {
    if (!travelOf(state).settings.sound && "speechSynthesis" in window)
      speechSynthesis.cancel();
  }, [state]);
  const learned = travelOf(state).regions[region.id]?.vocabularyLearned ?? [];
  async function submit() {
    if (!active) return;
    const next = await dispatch({
      type: "travel-word",
      regionId: region.id,
      wordId: active.id,
      answer,
    });
    if (next)
      setFeedback(
        [active.ru, active.en].some(
          (translation) =>
            translation.normalize("NFKC").trim().toLocaleLowerCase() ===
            answer.normalize("NFKC").trim().toLocaleLowerCase(),
        )
          ? `Дұрыс! ${active.definition}`
          : `Қайталап көр: ${active.ru} / ${active.en}. ${active.example}`,
      );
  }
  return (
    <section id="vocabulary" className="travel-panel">
      <div className="travel-heading">
        <div>
          <small>СӨЗДЕН СӨЙЛЕМГЕ</small>
          <h2>Өңір сөздігі</h2>
        </div>
        <strong>
          {learned.length}/{region.vocabulary.length}
        </strong>
      </div>
      <p>Сөзді аш, мысалды оқы, аудармасын жазып тексер.</p>
      <div className="travel-word-grid">
        {region.vocabulary.map((w) => (
          <button
            key={w.id}
            aria-pressed={active?.id === w.id}
            onClick={() => {
              setActive(w);
              setAnswer("");
              setFeedback("");
            }}
          >
            <TravelIcon kind={w.icon} />
            <strong>{w.kk}</strong>
            <small>{learned.includes(w.id) ? "✓ Меңгерілді" : w.en}</small>
          </button>
        ))}
      </div>
      {active && (
        <div className="travel-word-detail">
          <h3>
            {active.kk} · {active.ru} · {active.en}
          </h3>
          <p>{active.definition}</p>
          <blockquote>{active.example}</blockquote>
          {voice && travelOf(state).settings.sound && (
            <button
              className="btn ghost"
              onClick={() => {
                speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(active.example);
                u.voice = voice;
                u.lang = voice.lang;
                speechSynthesis.speak(u);
              }}
            >
              Қазақша тыңдау
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label>
              Орысша немесе ағылшынша аудармасын жаз
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={100}
                autoComplete="off"
              />
            </label>
            <button className="btn primary" disabled={busy || !answer.trim()}>
              Тексеру
            </button>
          </form>
          <p role="status">{feedback}</p>
        </div>
      )}
    </section>
  );
}
export function RegionGames({ region }: { region: Region }) {
  const { state } = useLearning();
  const [tab, setTab] = useState<"quiz" | "matching" | "sentence">("quiz");
  const scenery: SceneRegion =
    region.id === "turkistan"
      ? "city"
      : region.id === "mangystau" || region.theme === "sea"
        ? "coast"
        : region.theme === "mountain"
          ? "altai"
          : "steppe";
  return (
    <section id="games" className="travel-panel">
      <small>ҮЙРЕНГЕНІҢДІ ҚОЛДАН</small>
      <h2>Саяхат тапсырмалары</h2>
      <div className={`travel-game-panorama travel-panorama-${scenery}`}>
        <svg
          viewBox="0 0 900 390"
          role="img"
          aria-label={`${region.nameKk}: саяхат алаңы`}
        >
          <SteppeBackdrop region={scenery} />
          <SceneCharacter
            x={440}
            ground={373}
            width={125}
            characterId={selectedCharacter(state).id}
            equipped={equipmentFor(state)}
          />
        </svg>
      </div>
      <div className="travel-tabs">
        {(["quiz", "matching", "sentence"] as const).map((id, i) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {["Бес сұрақ", "Суретті сәйкестендір", "Сөйлем құрастыр"][i]}
          </button>
        ))}
      </div>
      {tab === "quiz" ? (
        <RegionQuiz region={region} />
      ) : tab === "matching" ? (
        <MatchingGame region={region} />
      ) : (
        <SentenceBuilder region={region} />
      )}
    </section>
  );
}
export function RegionQuiz({ region }: { region: Region }) {
  const { dispatch, busy, state } = useLearning();
  const [answers, setAnswers] = useState<string[]>([]),
    [sent, setSent] = useState(false);
  const best = travelOf(state).regions[region.id]?.quizBestScore ?? 0;
  return (
    <div>
      <p>
        5 сұрақтың кемінде 4-еуіне дұрыс жауап бер. Үздік нәтиже: {best}/5.
        Қайта ойнағанда XP қайталанбайды.
      </p>
      <fieldset disabled={busy || sent} className="travel-quiz">
        {region.games.quiz.map((q, i) => (
          <div key={q.prompt}>
            <h3>
              {i + 1}. {q.prompt}
            </h3>
            {q.options.map((o) => (
              <label key={o}>
                <input
                  type="radio"
                  name={`q-${i}`}
                  checked={answers[i] === o}
                  onChange={() =>
                    setAnswers((a) => {
                      const n = [...a];
                      n[i] = o;
                      return n;
                    })
                  }
                />
                {o}
              </label>
            ))}
            {sent && (
              <p
                className={
                  answers[i] === q.answer ? "travel-correct" : "travel-retry"
                }
              >
                {answers[i] === q.answer ? "✓ Дұрыс." : "Тағы байқап көр."}{" "}
                {q.explanation} Дұрыс жауап: {q.answer}
              </p>
            )}
          </div>
        ))}
      </fieldset>
      {sent ? (
        <button
          className="btn ghost"
          onClick={() => {
            setAnswers([]);
            setSent(false);
          }}
        >
          Қайта ойнау
        </button>
      ) : (
        <button
          className="btn primary"
          disabled={busy || !region.games.quiz.every((_, i) => answers[i])}
          onClick={async () => {
            if (
              await dispatch({
                type: "travel-game",
                regionId: region.id,
                game: "quiz",
                answers,
              })
            )
              setSent(true);
          }}
        >
          Quiz нәтижесін тексеру
        </button>
      )}
    </div>
  );
}
export function MatchingGame({ region }: { region: Region }) {
  const { dispatch, busy } = useLearning();
  const [answers, setAnswers] = useState<string[]>([]),
    [feedback, setFeedback] = useState("");
  const rows = region.games.matching.map((id) =>
    region.vocabulary.find((w) => w.id === id)!,
  );
  return (
    <div>
      <p>
        Үш суретке сәйкес қазақша атауларды таңда. Барлық жұп дұрыс болуы керек.
        Бұл — сөз мағынасын көрсететін шартты иллюстрациялар.
      </p>
      <div className="travel-matching">
        {rows.map((w, i) => (
          <label key={w.id}>
            <TravelIcon kind={w.icon} label={w.definition} />
            <span>{w.definition}</span>
            <select
              aria-label={`Сурет ${i + 1} атауы`}
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((a) => {
                  const n = [...a];
                  n[i] = e.target.value;
                  return n;
                })
              }
            >
              <option value="">Атауын таңда</option>
              {[...rows].reverse().map((w) => (
                <option value={w.id} key={w.id}>
                  {w.kk}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        className="btn primary"
        disabled={busy || !rows.every((_, i) => answers[i])}
        onClick={async () => {
          if (
            await dispatch({
              type: "travel-game",
              regionId: region.id,
              game: "matching",
              answers,
            })
          )
            setFeedback(
              answers.every((a, i) => a === rows[i].id)
                ? "✓ Барлық жұп дұрыс!"
                : `Қайталап көр: ${rows.map((w) => `${w.kk} — ${w.ru}`).join("; ")}.`,
            );
        }}
      >
        Жұптарды тексеру
      </button>
      <p role="status">{feedback}</p>
    </div>
  );
}
export function SentenceBuilder({ region }: { region: Region }) {
  const { dispatch, busy } = useLearning();
  const [chosen, setChosen] = useState<number[]>([]),
    [feedback, setFeedback] = useState("");
  const words = region.games.sentence;
  const bank = words.map((word, id) => ({ word, id })).reverse();
  return (
    <div>
      <p>
        Сөздерді ретімен басып, дұрыс сөйлем құрастыр. Таңдалған сөзді қайта
        бассаң, орнына қайтады.
      </p>
      <div className="travel-sentence" aria-label="Құрастырылған сөйлем">
        {chosen.map((id, i) => (
          <button
            key={id}
            onClick={() => setChosen((c) => c.filter((_, n) => n !== i))}
          >
            {words[id]}
          </button>
        ))}
        {!chosen.length && <span>Сөйлемді осында жина…</span>}
      </div>
      <div className="travel-word-bank">
        {bank.map(({ word, id }) => (
          <button
            key={id}
            disabled={chosen.includes(id)}
            onClick={() => setChosen((c) => [...c, id])}
          >
            {word}
          </button>
        ))}
      </div>
      <button
        className="btn primary"
        disabled={busy || chosen.length !== words.length}
        onClick={async () => {
          const answers = chosen.map((i) => words[i]);
          if (
            await dispatch({
              type: "travel-game",
              regionId: region.id,
              game: "sentence",
              answers,
            })
          )
            setFeedback(
              answers.join(" ") === words.join(" ")
                ? "✓ Сөйлем дұрыс!"
                : `Қолдау: ${words.join(" ")} Сөздердің орнын қайта тексер.`,
            );
        }}
      >
        Сөйлемді тексеру
      </button>
      <button
        className="btn ghost"
        onClick={() => {
          setChosen([]);
          setFeedback("");
        }}
      >
        Тазарту
      </button>
      <p role="status">{feedback}</p>
    </div>
  );
}
