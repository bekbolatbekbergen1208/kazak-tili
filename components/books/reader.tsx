"use client";
import Link from "next/link";
import { useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { readingLevels, tasksFor } from "@/lib/books/catalog";
import { readingPercent, recordFor, shuffled } from "@/lib/books/state";
import type { ReadingBook } from "@/lib/books/types";
import { BookTask } from "./task";
import { BookBattle } from "./battle";

export function BookReader({ book }: { book: ReadingBook }) {
  const { state, dispatch, busy } = useLearning();
  const p = recordFor(state, book.id);
  const [tab, setTab] = useState<"read" | "games" | "battle" | "certificate">(
    "read",
  );
  const [chapter, setChapter] = useState(
    Math.min(p.chapters.length, book.chapters.length - 1),
  );
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [taskOrder, setTaskOrder] = useState(() =>
    tasksFor(book).map((t) => t.id),
  );
  const [notice, setNotice] = useState("");
  const tasks = tasksFor(book),
    active = tasks.find((t) => t.id === activeTask);
  const readComplete = p.chapters.length === book.chapters.length;
  const ready = readComplete && p.completed.length === tasks.length;
  async function markRead() {
    const next = await dispatch({
      type: "book-read",
      bookId: book.id,
      chapter,
    });
    if (next) {
      setNotice(
        p.chapters.includes(chapter)
          ? "Бөлім бұрын сақталған."
          : "Бөлім сақталды: +5 XP · 🪙 1",
      );
      if (chapter < book.chapters.length - 1) setChapter(chapter + 1);
      else setTab("games");
    }
  }
  return (
    <div className="page bw-world bw-reader" lang="kk">
      <Link className="bw-back" href="/learn/books">
        ← Кітап сөресіне
      </Link>
      <header className={`bw-reader-header bw-${book.color}`}>
        <span className="bw-reader-icon" aria-hidden="true">
          {book.icon}
        </span>
        <div>
          <span className="bw-eyebrow">
            {readingLevels[book.level]} · {book.genre}
          </span>
          <h1>{book.title}</h1>
          <p>{book.author}</p>
          <small>Оқу шолуы: 10–15 минут · Негізгі тақырып: {book.theme}</small>
        </div>
      </header>
      <div className="bw-reader-progress">
        <progress
          aria-label="Кітап прогресі"
          value={readingPercent(state, book.id)}
          max={100}
        />
        <b>{readingPercent(state, book.id)}%</b>
      </div>
      <nav className="bw-tabs" aria-label="Кітап бөлімдері">
        {(
          [
            {
              id: "read",
              label: `📖 Оқу ${p.chapters.length}/3`,
              enabled: true,
            },
            {
              id: "games",
              label: `🎮 Ойындар ${p.completed.length}/9`,
              enabled: readComplete,
            },
            { id: "battle", label: "⚡ Финал", enabled: ready },
            {
              id: "certificate",
              label: "🏅 Сертификат",
              enabled: !!p.certifiedAt,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            aria-current={tab === item.id ? "page" : undefined}
            disabled={!item.enabled}
            onClick={() => {
              setTab(item.id);
              setActiveTask(null);
            }}
          >
            {item.label}
            {!item.enabled && " 🔒"}
          </button>
        ))}
      </nav>
      {notice && (
        <p className="bw-notice" role="status">
          {notice}
        </p>
      )}
      {tab === "read" && (
        <div className="bw-reading-layout">
          <aside className="panel bw-chapters">
            <h2>Оқу жолың</h2>
            <p>Қысқаша мазмұн · 3 бөлім</p>
            {book.chapters.map((c, i) => (
              <button
                key={c.title}
                disabled={i > 0 && !p.chapters.includes(i - 1)}
                aria-current={chapter === i ? "step" : undefined}
                onClick={() => setChapter(i)}
              >
                <span>{p.chapters.includes(i) ? "✓" : i + 1}</span>
                {c.title}
              </button>
            ))}
            <small>
              Бұлар — QazaqDos оқу бөлімдері, түпнұсқаның тараулары емес.
            </small>
          </aside>
          <article className="panel bw-reading-text">
            <span className="bw-eyebrow">{chapter + 1} / 3 БӨЛІМ</span>
            <h2>{book.chapters[chapter].title}</h2>
            <p className="bw-prose">{book.chapters[chapter].text}</p>
            <div className="bw-think">
              <b>Ойланып көр</b>
              <p>{book.reflection}</p>
            </div>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => void markRead()}
            >
              {busy
                ? "Сақталуда…"
                : chapter === 2
                  ? "Оқыдым · ойындарға өтейік →"
                  : "Оқыдым · келесі бөлім →"}
            </button>
            <details className="bw-reference">
              <summary>Кейіпкерлер мен сөздік</summary>
              {book.characters.map((c) => (
                <p key={c.name}>
                  <b>{c.name}</b> — {c.description}
                </p>
              ))}
              <hr />
              {book.vocabulary.map((v) => (
                <p key={v.word}>
                  <b>{v.word}</b> — {v.meaning}
                </p>
              ))}
            </details>
            <a
              href={book.source}
              target="_blank"
              rel="noreferrer"
              className="bw-text-link"
            >
              Шығарма туралы дерек ↗
            </a>
            <Link href="/learn/friend" className="bw-text-link">
              💬 Түсінбеген жеріңді Досшадан сұра
            </Link>
            <small className="bw-note">
              Қысқаша оқу мазмұны өз сөзімізбен жазылды. Толық шығарманы
              кітапханадан оқуға болады.
            </small>
          </article>
        </div>
      )}
      {tab === "games" &&
        (active ? (
          <>
            <button className="bw-back" onClick={() => setActiveTask(null)}>
              ← Барлық тапсырма
            </button>
            <BookTask
              key={`${active.id}-${attempt}`}
              book={book}
              task={active}
              saved={p.answers[active.id]}
              onDone={() => setActiveTask(null)}
            />
          </>
        ) : (
          <section>
            <div className="bw-section-heading">
              <div>
                <h2>Оқиға енді сенің қолыңда</h2>
                <p>Әр алғашқы тапсырмаға +10 XP · 🪙 2 · 💎 1</p>
              </div>
              <button
                className="btn ghost"
                onClick={() => setTaskOrder(shuffled(taskOrder))}
              >
                ⇄ Ретін араластыру
              </button>
            </div>
            <div className="bw-game-grid">
              {taskOrder.map((id, i) => {
                const task = tasks.find((t) => t.id === id)!;
                return (
                  <button
                    className={`bw-game-card ${p.completed.includes(id) ? "complete" : ""}`}
                    key={id}
                    onClick={() => {
                      setAttempt(attempt + 1);
                      setActiveTask(id);
                    }}
                  >
                    <span>
                      {
                        ["🔎", "🧩", "⚖️", "🔤", "💬", "✍️", "🗺️", "🌈", "💭"][
                          tasks.indexOf(task)
                        ]
                      }
                    </span>
                    <small>
                      {p.completed.includes(id)
                        ? "✓ Орындалды · қайта ойна"
                        : `${i + 1}-тапсырма`}
                    </small>
                    <h3>{task.title}</h3>
                    <p>
                      {["map", "ending", "opinion"].includes(id)
                        ? "Өз ойыңды жаз"
                        : "Біліміңді тексер"}
                    </p>
                  </button>
                );
              })}
              <button
                className="bw-game-card bw-final-card"
                disabled={!ready}
                onClick={() => setTab("battle")}
              >
                <span>🏆</span>
                <small>
                  {ready ? "Дайынсың!" : "9 тапсырмадан кейін ашылады"}
                </small>
                <h3>Финалдық кітап шайқасы</h3>
                <p>10 сұрақ · 3 минут · сертификат</p>
              </button>
            </div>
          </section>
        ))}
      {tab === "battle" && <BookBattle book={book} />}
      {tab === "certificate" && p.certifiedAt && (
        <>
          <section className="bw-certificate" aria-label="Кітап сертификаты">
            <div className="bw-confetti" aria-hidden="true">
              ✦ ✧ ✦ ✧ ✦
            </div>
            <span className="bw-eyebrow">QAZAQDOS · КІТАП ӘЛЕМІ</span>
            <div className="bw-medal">🏅</div>
            <h2>ОҚЫРМАН СЕРТИФИКАТЫ</h2>
            <p>Осы сертификат</p>
            <strong className="bw-reader-name">{state.profile.nickname}</strong>
            <p>
              «{book.title}» оқу шолуын және барлық тапсырмаларды аяқтағанын
              растайды.
            </p>
            <b>Ең жоғары нәтиже: {p.bestScore} / 10</b>
            <p>
              {new Date(p.certifiedAt).toLocaleDateString("kk-KZ", {
                timeZone: "UTC",
              })}
            </p>
            <small>QazaqDos оқу жетістігі · ресми білім құжаты емес</small>
          </section>
          <div className="bw-certificate-actions">
            <button className="btn primary" onClick={() => window.print()}>
              Сертификатты басып шығару / PDF
            </button>
            <Link className="btn ghost" href="/learn/books">
              Келесі кітапты таңдау
            </Link>
            <Link className="btn ghost" href="/learn/characters">
              Жануар-досыма бару
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
