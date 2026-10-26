"use client";
import Link from "next/link";
import { TimedSongFind } from "./timed-find";
import { useState } from "react";
import type { RealSong } from "@/lib/songs/real-songs";
import { maskedSongLine } from "@/lib/songs/practice";

export function RealSongSession({ song, mode = "find" }: { song: RealSong; mode?: string }) {
  const [started, setStarted] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("");
  const [correct, setCorrect] = useState(false);
  const excerpt = song.excerpts[step];
  const answer = excerpt?.text.split(/\s+/)[excerpt.token].replace(/[^\p{L}\p{N}]/gu, "");
  const done = step >= song.excerpts.length;
  return <div className="page song-page song-real-page">
    <Link href="/learn/songs?demo=1">← Әндерге оралу</Link>
    <header><span className="pill">Танымал ән · нақты орындау</span><h1>{song.title}</h1><p>{song.performer}</p></header>
    <nav className="song-mode-nav" aria-label="Ән режимдері">
      <Link href={`/learn/songs/${song.id}/find`} aria-current={mode === "find" ? "page" : undefined}>Сөзді тап</Link>
      <Link href={`/learn/songs/${song.id}/karaoke`} aria-current={mode === "karaoke" ? "page" : undefined}>Бірге айт</Link>
    </nav>
    <section className="panel song-real-player" aria-label="Нақты ән жазбасы">
      <h2>Әнді тыңда</h2>
      <p>{song.description}</p>
      {!started ? <button className="btn primary" onClick={() => setStarted(true)}>Әнді ашу · {song.title}</button> :
        song.audio && !audioFailed ? <audio controls autoPlay preload="metadata" src={song.audio} onError={() => setAudioFailed(true)} /> :
          <iframe title={`${song.title} — нақты орындау`} src={`https://www.youtube-nocookie.com/embed/${song.video}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      {audioFailed && <p role="status">Архив аудиосы ашылмады. Балама орындау бейнеплеерде ашылды.</p>}
      <a href={song.source} target="_blank" rel="noreferrer">{song.sourceName} ↗</a>
      {started && <a href={`https://www.youtube.com/watch?v=${song.video}`} target="_blank" rel="noreferrer">Плеер ашылмаса, орындауды бөлек ашу ↗</a>}
    </section>
    {mode === "find" && <TimedSongFind lines={song.excerpts.map(item => item.text)} audioSrc={song.audio || undefined} allowText />}
    {mode === "karaoke" ? <section className="panel">
      <h2>Орындаушымен бірге айт</h2><p>Әнді тыңдап, мына қысқа үзінділерді бірге айт. Мәтін жолдары аудио уақытымен автоматты белгіленбейді.</p>
      {song.excerpts.map((item, i) => <p className="song-current-line" key={i}>{item.text}</p>)}
      <Link className="btn primary" href={`/learn/songs/${song.id}/find`}>Енді сөзді тауып көр →</Link>
    </section> : <section className="panel song-find">
      <h2>Тыңдап, жасырылған сөзді тап</h2>
      <progress className="song-find-progress" value={step + (correct ? 1 : 0)} max={song.excerpts.length} aria-label="Ән тестінің барысы" />
      {done ? <><h3>✓ Екі сөзді де таптың!</h3><p>Бұл — осы үзінділермен жаттығу нәтижесі.</p><button className="btn ghost" onClick={() => { setStep(0); setSelected(""); setCorrect(false); }}>Қайта жаттығу</button></> : <>
        <p>{step + 1}/{song.excerpts.length} · Әннен естіген сөзді таңда</p>
        <p className="song-current-line">{maskedSongLine(excerpt.text, excerpt.token, correct)}</p>
        <div className="song-find-options">
          {[answer!, ...excerpt.choices].sort((a, b) => a.localeCompare(b, "kk")).map((choice) => <button
            key={choice} className={`btn ${selected === choice ? correct ? "primary" : "ghost song-answer-wrong" : "ghost"}`}
            disabled={!started || correct} onClick={() => { setSelected(choice); setCorrect(choice === answer); }}
          >{choice}</button>)}
        </div>
        {!started && <p>Алдымен жоғарыдағы «Әнді ашу» батырмасын бас.</p>}
        {selected && <p role="status">{correct ? `✓ Дұрыс! ${excerpt.meaning}` : "Әлі сәйкес келмеді. Әнді қайта тыңдап, басқа сөзді таңдап көр."}</p>}
        {correct && <button className="btn primary" onClick={() => { setStep(step + 1); setSelected(""); setCorrect(false); }}>{step + 1 === song.excerpts.length ? "Жаттығуды аяқтау" : "Келесі сөз →"}</button>}
      </>}
    </section>}
  </div>;
}
