"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowUpRight,
  Flame,
  Trophy,
} from "lucide-react";
import { useLearning } from "@/components/learning/provider";
import { readingBooks, readingLevels } from "@/lib/books/catalog";
import {
  readerTitles,
  reading,
  readingPercent,
  readingStreak,
  recordFor,
} from "@/lib/books/state";
import type { ReadingLevel } from "@/lib/books/types";
import { BookFriends } from "./friends";

export function BookWorld() {
  const { state } = useLearning();
  const [level, setLevel] = useState<ReadingLevel | "all">("all");
  const [query, setQuery] = useState("");
  const progress = reading(state);
  const finished = Object.values(progress.books).filter(
    (p) => p.certifiedAt,
  ).length;
  const current =
    readingBooks.find(
      (b) =>
        readingPercent(state, b.id) > 0 && !recordFor(state, b.id).certifiedAt,
    ) ?? readingBooks[0];
  const books = readingBooks.filter(
    (b) =>
      (level === "all" || b.level === level) &&
      `${b.title} ${b.author}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  return (
    <div className="page bw-world" lang="kk">
      <section className="bw-hero">
        <div className="bw-hero-copy">
          <span className="bw-eyebrow">
            <Sparkles size={16} /> ӘР КІТАП — ЖАҢА ӘЛЕМ
          </span>
          <h1>
            Оқы. Ойна.
            <br />
            <span>Өз тарихыңды баста.</span>
          </h1>
          <p>
            Қазақ әдебиетінің кейіпкерлерімен таныс. Оқиғаны зертте, біліміңді
            сына және досыңмен бірге өс!
          </p>
          <Link className="btn primary" href={`/learn/books/${current.id}`}>
            <BookOpen size={19} />{" "}
            {readingPercent(state, current.id)
              ? "Оқуды жалғастыру"
              : "Алғашқы кітапты ашу"}
          </Link>
          <small>{current.title} · 3 оқу бөлімі · 10 ойын</small>
        </div>
        <div className="bw-hero-art" aria-hidden="true">
          <span className="bw-spark s1">✦</span>
          <span className="bw-spark s2">✧</span>
          <div className="bw-floating-book">
            <span>QAZAQDOS</span>
            <b>
              Кітап
              <br />
              әлемі
            </b>
            <div>🪶</div>
            <small>БІЛІМГЕ ҚАНАТ БІТІР</small>
          </div>
          <span className="bw-art-badge">🌟 + жаңа мүмкіндіктер</span>
        </div>
      </section>
      <div className="bw-stats">
        <div>
          <BookOpen />
          <b>
            {finished}
            <small>аяқталған кітап / 15</small>
          </b>
        </div>
        <div>
          <Flame />
          <b>
            {readingStreak(progress.days)} күн
            <small>күнделікті оқу сериясы · UTC</small>
          </b>
        </div>
        <div>
          <Sparkles />
          <b>
            {state.progress.xp} XP
            <small>
              🪙 {state.progress.coins} · 💎{" "}
              {state.progress.national?.crystals ?? 0}
            </small>
          </b>
        </div>
      </div>
      <section className="bw-shelf" aria-labelledby="shelf-title">
        <div className="bw-section-heading">
          <div>
            <span className="bw-eyebrow">КІШКЕНЕ ҚАДАМНАН БАСТА</span>
            <h2 id="shelf-title">Сенің кітап сөрең</h2>
          </div>
          <label className="bw-search">
            <Search size={18} />
            <span className="sr-only">Кітап немесе авторды іздеу</span>
            <input
              aria-label="Кітап немесе авторды іздеу"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Кітап немесе автор…"
            />
          </label>
        </div>
        <div className="bw-filters" aria-label="Оқу деңгейі">
          {(["all", "easy", "medium", "advanced"] as const).map((key) => (
            <button
              key={key}
              className={level === key ? "active" : ""}
              aria-pressed={level === key}
              onClick={() => setLevel(key)}
            >
              {key === "all" ? "Барлығы" : readingLevels[key]}{" "}
              <span>
                {key === "all"
                  ? 15
                  : readingBooks.filter((b) => b.level === key).length}
              </span>
            </button>
          ))}
        </div>
        <p className="bw-note">
          Авторлық оқу шолулары: түпнұсқаның толық мәтіні емес. 3 бөлімді оқып,
          9 тапсырманы орында да, 10 сұрақтық финалға өт.
        </p>
        <div className="bw-grid">
          {books.map((b) => {
            const percent = readingPercent(state, b.id);
            const certified = recordFor(state, b.id).certifiedAt;
            return (
              <article className="bw-card" key={b.id}>
                <Link
                  href={`/learn/books/${b.id}`}
                  className={`bw-cover bw-${b.color}`}
                  aria-label={`${b.title} кітабын ашу`}
                >
                  <span className="bw-level">{readingLevels[b.level]}</span>
                  <span className="bw-cover-icon" aria-hidden="true">
                    {b.icon}
                  </span>
                  <strong>{b.title}</strong>
                  <small>{b.author}</small>
                  <span className="bw-cover-ornament" aria-hidden="true">
                    ◇ ❖ ◇
                  </span>
                </Link>
                <div className="bw-card-body">
                  <div className="bw-card-meta">
                    <span>{b.genre}</span>
                    <span>◷ 10–15 мин</span>
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.summary}</p>
                  <small className="bw-cast">
                    {b.characters
                      .filter((c) => c.name !== "Оқырман")
                      .map((c) => c.name)
                      .join(" · ")}
                  </small>
                  <div className="bw-progress-label">
                    <span>
                      {certified
                        ? "🏅 Кітап аяқталды"
                        : percent
                          ? "Саяхатың жалғасуда"
                          : "Жаңа оқиға күтуде"}
                    </span>
                    <b>{percent}%</b>
                  </div>
                  <progress
                    aria-label={`${b.title}: оқу прогресі`}
                    value={percent}
                    max={100}
                  />
                  <Link className="bw-card-link" href={`/learn/books/${b.id}`}>
                    {certified
                      ? "Қайта оқу"
                      : percent
                        ? "Жалғастыру"
                        : "Кітапты ашу"}
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        {books.length === 0 && (
          <p role="status" className="panel">
            Кітап табылмады. Басқа атауды немесе деңгейді таңда.
          </p>
        )}
      </section>
      <section className="bw-bottom-grid">
        <div className="panel">
          <span className="bw-eyebrow">СЕНІҢ ЖЕТІСТІКТЕРІҢ</span>
          <h2>Әр бет — бір жеңіс</h2>
          {readerTitles(state).map((title) => (
            <div
              className={`bw-title-row ${title.unlocked ? "earned" : ""}`}
              key={title.name}
            >
              <Trophy />
              <div>
                <b>{title.name}</b>
                <small>{title.unlocked ? "Атақ ашылды!" : title.hint}</small>
              </div>
              <span>{title.unlocked ? "✓" : "🔒"}</span>
            </div>
          ))}
          <Link href="/learn/characters" className="bw-text-link">
            Жануар-досыңды дамыту →
          </Link>
          <Link href="/learn/national/upgrade" className="bw-text-link">
            Кристалмен қабілетін арттыру →
          </Link>
        </div>
        <BookFriends />
      </section>
    </div>
  );
}
