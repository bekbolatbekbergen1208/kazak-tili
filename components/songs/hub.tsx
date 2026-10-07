"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Music2, Clock, BookOpen, Sparkles } from "lucide-react";
import { Mascot } from "@/components/icons";
import { useLearning } from "@/components/learning/provider";
import { useQLevel } from "@/components/q-level/use-q-level";
import { songLessons } from "@/lib/songs/content";
import { songsOf } from "@/lib/songs/state";
import type { SongLevel } from "@/lib/songs/types";
import { SongMaker } from "./maker";
import { SongReviews } from "./reviews";
export function SongsHub() {
  const { state, dispatch, busy } = useLearning(),
    q = useQLevel(),
    p = songsOf(state),
    [filter, setFilter] = useState("all"),
    [topic, setTopic] = useState("all");
  const result = q.result?.level;
  const selected = result
    ? result === "A0" || result === "A1"
      ? "A1"
      : result === "A2"
        ? "A2"
        : "B1"
    : (p.level ?? "A1");
  const lessons = songLessons.filter(
    (l) =>
      (filter === "all" || l.level === filter) &&
      (topic === "all" || l.topic === topic),
  );
  const done = songLessons.filter((l) => p.lessons[l.id]?.completedAt).length,
    words = new Set(
      songLessons
        .filter((l) => p.lessons[l.id]?.completedAt)
        .flatMap((l) => l.words.map((w) => w.id)),
    ).size;
  const resumed =
    songLessons.find(
      (l) =>
        l.id === p.lastLessonId &&
        p.lessons[l.id] &&
        !p.lessons[l.id].completedAt,
    ) ??
    songLessons
      .filter((l) => p.lessons[l.id] && !p.lessons[l.id].completedAt)
      .sort((a, b) =>
        String(p.lessons[b.id].updatedAt ?? "").localeCompare(
          String(p.lessons[a.id].updatedAt ?? ""),
        ),
      )[0];
  const earnedXP = songLessons.reduce(
    (sum, l) =>
      sum +
      (p.lessons[l.id]?.xp ?? 0) +
      Object.values(p.lessons[l.id]?.modes ?? {}).reduce(
        (n, m) => n + (m?.xp ?? 0),
        0,
      ),
    0,
  );
  const next =
    resumed ??
    songLessons.find((l) => p.lessons[l.id] && !p.lessons[l.id].completedAt) ??
    songLessons.find(
      (l) => l.level === selected && !p.lessons[l.id]?.completedAt,
    ) ??
    songLessons.find((l) => !p.lessons[l.id]?.completedAt) ??
    songLessons[0];
  return (
    <div className="page song-page">
      <section className="song-hero">
        <svg
          className="song-ornament"
          viewBox="0 0 200 80"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M100 64V38C100 15 76 8 64 19C51 32 65 47 78 39C87 33 80 23 74 28M100 64V38C100 15 124 8 136 19C149 32 135 47 122 39C113 33 120 23 126 28M100 64C84 64 74 73 57 65C39 56 31 35 17 43C6 49 17 64 27 56M100 64C116 64 126 73 143 65C161 56 169 35 183 43C194 49 183 64 173 56"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <span className="pill">
            <Music2 size={15} />
            ӘНМЕН ҮЙРЕН
          </span>
          <h1>
            Қазақша тыңда.
            <br />
            Бірге айт.
            <br />
            <span>Еркін сөйле.</span>
          </h1>
          <p>
            Сәлем! Мен — Досша. Жаңа оқу әндері арқылы сөздерді түсініп, ойынмен
            бекітеміз және өз сөйлемімізде қолданамыз.
          </p>
          <Link href={`/learn/songs/${next.id}`} className="btn primary">
            {resumed
              ? "Сабақты жалғастыру"
              : done === songLessons.length
                ? "Сабақты қайта ашу"
                : "Оқуды бастау"}
            <ArrowRight size={18} />
          </Link>
          <small>7–12 минутқа жоспарланған сабақтар · жаңа оқу мәтіндері</small>
        </div>
        <div className="song-mascot">
          <span aria-hidden="true" className="song-note-one">
            ♪
          </span>
          <Mascot />
          <span aria-hidden="true" className="song-note-two">
            ♫
          </span>
        </div>
      </section>
      <div className="song-method">
        {[
          "Тыңда",
          "Сөзді тап",
          "Мағынасын түсін",
          "Бірге айт",
          "Өзің айт",
          "Өмірде қолдан",
        ].map((s, i) => (
          <span key={s}>
            <b>{i + 1}</b>
            {s}
          </span>
        ))}
      </div>
      <p className="song-note">
        QazaqDos үшін ұсынылған оқу моделі. Ғылыми дәлелденген авторлық әдістеме
        немесе ресми сертификаттау ретінде ұсынылмайды.
      </p>
      <section className="song-metrics" aria-label="Ән сабақтарының прогресі">
        <div>
          <strong>
            {done}/{songLessons.length}
          </strong>
          <span>Аяқталған сабақ</span>
        </div>
        <div>
          <strong>{words}</strong>
          <span>Аяқталған сабақтағы сөздер</span>
        </div>
        <div>
          <strong>{earnedXP} XP</strong>
          <span>Ән сабақтарының марапаты</span>
        </div>
        <div>
          <strong>{Math.round((done / songLessons.length) * 100)}%</strong>
          <span>Бөлім прогресі</span>
        </div>
      </section>
      {resumed && (
        <section className="song-resume" aria-label="Жалғастырылатын сабақ">
          <div>
            <span className="overline">ТОҚТАҒАН ЖЕРІҢНЕН ЖАЛҒАСТЫР</span>
            <h2>{resumed.title}</h2>
            <p>
              {resumed.level} · {p.lessons[resumed.id].stage + 1}/6 кезең ·{" "}
              {resumed.minutes} минутқа жоспарланған сабақ
            </p>
            <progress
              max={6}
              value={p.lessons[resumed.id].stage}
              aria-label="Жалғастырылатын сабақ прогресі"
            />
          </div>
          <Link href={`/learn/songs/${resumed.id}`} className="btn primary">
            Жалғастыру <ArrowRight size={17} />
          </Link>
        </section>
      )}
      <div className="song-level-panel">
        {result ? (
          <p>
            Q-Level нәтижесі: <b>{result}</b>. Ұсынылатын ән деңгейі: {selected}
            . Сабақ деңгейлері — оқу мазмұнының шамамен белгісі.
          </p>
        ) : (
          <label>
            Бастапқы деңгейіңді таңда{" "}
            <select
              aria-label="Бастапқы ән деңгейі"
              value={p.level ?? "A1"}
              disabled={busy || !q.ready}
              onChange={(e) =>
                void dispatch({
                  type: "song-level",
                  level: e.target.value as SongLevel,
                })
              }
            >
              {["A1", "A2", "B1"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <small>Бұл — өз таңдауың, диагностикалық нәтиже емес.</small>
          </label>
        )}
        {state.profile.goal === "tourism" && (
          <p>
            Турист бағыты: <b>сәлемдесу → жол сұрау → көлік → кафе → қонақүй</b>
            . «Сәлем, досым!» және «Ақтауға саяхат» сабақтарынан баста.
          </p>
        )}
      </div>
      <header className="song-list-head">
        <div>
          <span className="overline">ӨЗ ҚАРҚЫНЫҢМЕН</span>
          <h2>Саған арналған оқу әндері</h2>
        </div>
        <div className="song-filters">
          <label>
            Деңгей
            <select
              aria-label="Ән деңгейі бойынша сүзгі"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Барлық деңгей</option>
              {["A1", "A2", "B1"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Тақырып
            <select
              aria-label="Ән тақырыбы бойынша сүзгі"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="all">Барлық тақырып</option>
              {songLessons.map((l) => (
                <option key={l.id}>{l.topic}</option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className="song-cards">
        {lessons.map((l, i) => (
          <article className={`song-card song-tone-${i % 3}`} key={l.id}>
            <Link className="song-card-main" href={`/learn/songs/${l.id}`}>
              <div className="song-card-top">
                <span className="song-card-icon">
                  <Music2 size={27} />
                </span>
                <span className="pill">{l.level}</span>
              </div>
              <h3>{l.title}</h3>
              <span className="song-topic">{l.topic}</span>
              <p>{l.objective}</p>
              <div className="song-card-meta">
                <span>
                  <Clock size={15} />
                  {l.minutes} минут
                </span>
                <span>
                  <BookOpen size={15} />
                  {l.words.length} сөз
                </span>
              </div>
              <div className="song-card-status">
                {p.lessons[l.id]?.completedAt
                  ? "✓ Аяқталды"
                  : p.lessons[l.id]
                    ? `Жалғастыру · ${p.lessons[l.id].stage + 1}/6 кезең`
                    : "Сабақты ашу"}
                <ArrowRight size={17} />
              </div>
            </Link>
            <p className="song-note">
              {l.mediaStatus === "ready"
                ? "Аудио дайын"
                : "Аудио режимдері — жоба"}
            </p>
            <nav className="song-mode-nav" aria-label={`${l.title}: режимдер`}>
              <Link href={`/learn/songs/${l.id}/find`}>Сөзді тап</Link>
              <Link href={`/learn/songs/${l.id}/karaoke`}>Караоке</Link>
              <Link href={`/learn/songs/${l.id}/speak`}>Өзің айт — тексер</Link>
            </nav>
          </article>
        ))}
      </div>
      {!lessons.length && (
        <p role="status">
          Бұл сүзгіге сәйкес сабақ жоқ. Басқа деңгей немесе тақырып таңда.
        </p>
      )}
      <section className="song-maker-header">
        <Sparkles size={24} />
        <div>
          <h2>Өз әніңді жаса</h2>
          <p>Өзің туралы айт — сөздеріңді қысқа оқу мәтініне айналдырамыз.</p>
        </div>
      </section>
      <SongMaker level={selected as SongLevel} />
      <SongReviews />
    </div>
  );
}
