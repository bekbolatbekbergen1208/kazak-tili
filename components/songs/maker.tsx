"use client";
import { useEffect, useRef, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { songTopics } from "@/lib/songs/content";
import { songsOf } from "@/lib/songs/state";
import type { GeneratedSong } from "@/lib/songs/dosha";
import type { SongLevel } from "@/lib/songs/types";
export function SongMaker({ level }: { level: SongLevel }) {
  const speaking = useRef(false);
  useEffect(
    () => () => {
      if (speaking.current) window.speechSynthesis?.cancel();
    },
    [],
  );
  const learning = useLearning(),
    draft = songsOf(learning.state).draft;
  const [topic, setTopic] = useState(draft?.topic ?? songTopics[0]),
    [text, setText] = useState(draft?.text ?? ""),
    [song, setSong] = useState<GeneratedSong | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [results, setResults] = useState<Record<number, string>>({}),
    [tts, setTts] = useState("");
  async function generate() {
    setBusy(true);
    setError("");
    setResults({});
    try {
      const saved = await learning.dispatch({
        type: "song-draft",
        topic,
        text,
      });
      if (!saved) throw Error("Мәтін сақталмады. Қайта байқап көр.");
      const res = await fetch("/api/songs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          text,
          level,
          demo: learning.demo || learning.localOnly,
        }),
      });
      const b = await res.json();
      if (!res.ok) throw Error(b.error || "Ән мәтіні жасалмады.");
      setSong(b);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Досша сервисі қолжетімсіз. Кейін қайта байқап көр.",
      );
    } finally {
      setBusy(false);
    }
  }
  function read() {
    setTts("");
    if (!window.speechSynthesis) {
      setTts("Мәтінді дауыстап оқу бұл браузерде жоқ.");
      return;
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => /^kk(?:-|$)/i.test(v.lang));
    if (!voice) {
      setTts(
        "Қазақша жүйелік дауыс табылмады. Мәтінді өзің оқып жаттыға аласың.",
      );
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(song!.lines.join(". "));
    u.voice = voice;
    u.lang = "kk-KZ";
    u.onerror = () => setTts("Дауыстап оқу мүмкін болмады.");
    speaking.current = true;
    speechSynthesis.speak(u);
  }
  return (
    <section className="song-maker">
      <div className="song-maker-form">
        <label className="song-label">
          Тақырып
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {songTopics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="song-label">
          Өзің туралы 3–4 сөйлем
          <textarea
            value={text}
            maxLength={1200}
            onChange={(e) => setText(e.target.value)}
            placeholder="Мен Ақтауда тұрамын. Қаламда теңіз бар. Мен теңізге барғанды ұнатамын."
          />
        </label>
        <p className="song-note">
          Мәтін генерациясы, мәтінді дауыстап оқу және музыка жасау — бөлек
          мүмкіндіктер. Музыка сервисі қосылмаған.
        </p>
        <button
          className="btn primary"
          disabled={busy || learning.busy || text.trim().length < 10}
          onClick={() => void generate()}
        >
          {busy ? "Оқу мәтіні жасалып жатыр…" : "Оқу әнінің мәтінін жасау"}
        </button>
      </div>
      {error && (
        <p role="alert" className="song-error">
          {error}
        </p>
      )}
      {song && (
        <div className="song-generated">
          <span className="pill">
            {song.mode === "ai" ? "Досша AI" : "Анықтамалық үлгі"}
          </span>
          <h3>{song.title}</h3>
          <div className="song-generated-lines">
            {song.lines.map((s, i) => (
              <p key={i}>{s}</p>
            ))}
          </div>
          <p>{song.notice}</p>
          <div className="song-actions">
            <button className="btn ghost" onClick={read}>
              Мәтінді дауыстап оқу
            </button>
            <button
              className="btn ghost"
              onClick={() => window.speechSynthesis?.cancel()}
            >
              Оқуды тоқтату
            </button>
          </div>
          {tts && <p role="status">{tts}</p>}
          <h4>Негізгі және тақырыптық сөздер</h4>
          <dl>
            {song.words.map((w) => (
              <div key={w.id}>
                <dt>{w.word}</dt>
                <dd>
                  {w.meaning} · {w.ru} · {w.en}
                </dd>
              </div>
            ))}
          </dl>
          <h4>Екі жаттығу</h4>
          {song.exercises.map((e, i) => (
            <div className="song-check" key={i}>
              <p>{e.prompt}</p>
              <div className="song-actions">
                {e.options.map((o) => (
                  <button
                    className="btn ghost"
                    key={o}
                    onClick={() =>
                      setResults({
                        ...results,
                        [i]:
                          o === e.answer
                            ? `✓ Дұрыс. ${e.explanation}`
                            : `↻ Қайта байқап көр. ${e.explanation}`,
                      })
                    }
                  >
                    {o}
                  </button>
                ))}
              </div>
              {results[i] && <p role="status">{results[i]}</p>}
            </div>
          ))}
          <small>Өзің жасаған мәтін жаттығуларына XP берілмейді.</small>
        </div>
      )}
    </section>
  );
}
