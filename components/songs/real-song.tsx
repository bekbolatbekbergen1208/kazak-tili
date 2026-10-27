"use client";
import Link from "next/link";
import { TimedSongFind } from "./timed-find";
import { useEffect, useRef, useState } from "react";
import { KaraokeSubtitles } from "./karaoke-subtitles";
import type { RealSong } from "@/lib/songs/real-songs";
import { maskedSongLine } from "@/lib/songs/practice";

type YouTubePlayer = { getCurrentTime(): number; destroy(): void };
type YouTubeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onStateChange: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
};

export function RealSongSession({
  song,
  mode = "find",
}: {
  song: RealSong;
  mode?: string;
}) {
  const videoRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("");
  const [correct, setCorrect] = useState(false);
  const excerpt = song.excerpts[step];
  const answer = excerpt?.text
    .split(/\s+/)
    [excerpt.token].replace(/[^\p{L}\p{N}]/gu, "");
  const done = step >= song.excerpts.length;
  useEffect(() => {
    if (!started || (song.audio && !audioFailed)) return;
    let player: YouTubePlayer | null = null;
    let timeTimer: number | null = null;
    let attempts = 0;
    const scriptId = "qazaqdos-youtube-iframe-api";
    if (
      !(window as typeof window & { YT?: YouTubeApi }).YT?.Player &&
      !document.getElementById(scriptId)
    ) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
    const setupTimer = window.setInterval(() => {
      const api = (window as typeof window & { YT?: YouTubeApi }).YT;
      if (!api?.Player || !videoRef.current) {
        if (++attempts >= 150) window.clearInterval(setupTimer);
        return;
      }
      window.clearInterval(setupTimer);
      player = new api.Player(videoRef.current, {
        events: {
          onStateChange: (event) => {
            const playingNow = event.data === 1;
            setPlaying(playingNow);
            if (timeTimer) window.clearInterval(timeTimer);
            timeTimer = playingNow
              ? window.setInterval(() => {
                  if (player) setTime(player.getCurrentTime());
                }, 250)
              : null;
          },
        },
      });
    }, 100);
    return () => {
      window.clearInterval(setupTimer);
      if (timeTimer) window.clearInterval(timeTimer);
      player?.destroy();
      setPlaying(false);
    };
  }, [started, audioFailed, song.audio]);
  return (
    <div className="page song-page song-real-page">
      <Link href="/learn/songs?demo=1">← Әндерге оралу</Link>
      <header>
        <span className="pill">Танымал ән · нақты орындау</span>
        <h1>{song.title}</h1>
        <p>{song.performer}</p>
      </header>
      <nav className="song-mode-nav" aria-label="Ән режимдері">
        <Link
          href={`/learn/songs/${song.id}/find`}
          aria-current={mode === "find" ? "page" : undefined}
        >
          Сөзді тап
        </Link>
        <Link
          href={`/learn/songs/${song.id}/karaoke`}
          aria-current={mode === "karaoke" ? "page" : undefined}
        >
          Бірге айт
        </Link>
      </nav>
      <section className="panel song-real-player" aria-label="Нақты ән жазбасы">
        <h2>Әнді тыңда</h2>
        <p>{song.description}</p>
        {!started ? (
          <button className="btn primary" onClick={() => setStarted(true)}>
            Әнді ашу · {song.title}
          </button>
        ) : song.audio && !audioFailed ? (
          <audio
            controls
            autoPlay
            preload="metadata"
            src={song.audio}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onSeeked={(event) => setTime(event.currentTarget.currentTime)}
            onError={() => {
              setPlaying(false);
              setAudioFailed(true);
            }}
          />
        ) : (
          <iframe
            title={`${song.title} — нақты орындау`}
            ref={videoRef}
            src={`https://www.youtube-nocookie.com/embed/${song.video}?autoplay=1&rel=0&enablejsapi=1`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        {started && (
          <KaraokeSubtitles
            lines={song.excerpts}
            time={time}
            playing={playing}
          />
        )}
        {audioFailed && (
          <p role="status">
            Архив аудиосы ашылмады. Балама орындау бейнеплеерде ашылды.
          </p>
        )}
        <a href={song.source} target="_blank" rel="noreferrer">
          {song.sourceName} ↗
        </a>
        {started && (
          <a
            href={`https://www.youtube.com/watch?v=${song.video}`}
            target="_blank"
            rel="noreferrer"
          >
            Плеер ашылмаса, орындауды бөлек ашу ↗
          </a>
        )}
      </section>
      {mode === "find" && (
        <TimedSongFind
          lines={song.excerpts.map((item) => item.text)}
          audioSrc={song.audio || undefined}
          allowText
        />
      )}
      {mode === "karaoke" ? (
        <section className="panel">
          <h2>Орындаушымен бірге айт</h2>
          <p>
            Әнді тыңдап, мына қысқа үзінділерді бірге айт. Мәтін жолдары аудио
            уақытымен автоматты белгіленбейді.
          </p>
          {song.excerpts.map((item, i) => (
            <p className="song-current-line" key={i}>
              {item.text}
            </p>
          ))}
          <Link className="btn primary" href={`/learn/songs/${song.id}/find`}>
            Енді сөзді тауып көр →
          </Link>
        </section>
      ) : (
        <section className="panel song-find">
          <h2>Тыңдап, жасырылған сөзді тап</h2>
          <progress
            className="song-find-progress"
            value={step + (correct ? 1 : 0)}
            max={song.excerpts.length}
            aria-label="Ән тестінің барысы"
          />
          {done ? (
            <>
              <h3>✓ Екі сөзді де таптың!</h3>
              <p>Бұл — осы үзінділермен жаттығу нәтижесі.</p>
              <button
                className="btn ghost"
                onClick={() => {
                  setStep(0);
                  setSelected("");
                  setCorrect(false);
                }}
              >
                Қайта жаттығу
              </button>
            </>
          ) : (
            <>
              <p>
                {step + 1}/{song.excerpts.length} · Әннен естіген сөзді таңда
              </p>
              <p className="song-current-line">
                {maskedSongLine(excerpt.text, excerpt.token, correct)}
              </p>
              <div className="song-find-options">
                {[answer!, ...excerpt.choices]
                  .sort((a, b) => a.localeCompare(b, "kk"))
                  .map((choice) => (
                    <button
                      key={choice}
                      className={`btn ${selected === choice ? (correct ? "primary" : "ghost song-answer-wrong") : "ghost"}`}
                      disabled={!started || correct}
                      onClick={() => {
                        setSelected(choice);
                        setCorrect(choice === answer);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
              </div>
              {!started && <p>Алдымен жоғарыдағы «Әнді ашу» батырмасын бас.</p>}
              {selected && (
                <p role="status">
                  {correct
                    ? `✓ Дұрыс! ${excerpt.meaning}`
                    : "Әлі сәйкес келмеді. Әнді қайта тыңдап, басқа сөзді таңдап көр."}
                </p>
              )}
              {correct && (
                <button
                  className="btn primary"
                  onClick={() => {
                    setStep(step + 1);
                    setSelected("");
                    setCorrect(false);
                  }}
                >
                  {step + 1 === song.excerpts.length
                    ? "Жаттығуды аяқтау"
                    : "Келесі сөз →"}
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
