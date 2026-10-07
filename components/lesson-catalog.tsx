"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Play,
  Search,
} from "lucide-react";
import { Shell, StudentTop } from "./shell";
import { courseLessons } from "@/lib/curriculum";
import { useLessonProgress } from "@/lib/lesson-progress";

export default function LessonCatalog() {
  const [page, setPage] = useState(0);
  const [level, setLevel] = useState("Барлығы");
  const [query, setQuery] = useState("");
  const { unlockedLesson } = useLessonProgress();
  const filtered = useMemo(
    () =>
      courseLessons.filter(
        (lesson) =>
          (level === "Барлығы" || lesson.level === level) &&
          `${lesson.title} ${lesson.grammar}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [level, query],
  );
  const pages = Math.ceil(filtered.length / 20);
  const items = filtered.slice(page * 20, page * 20 + 20);

  return (
    <Shell>
      <div className="page">
        <StudentTop
          title="Үлгілік жаттығу каталогы"
          sub="20 негізгі сөйлемді әртүрлі оқу жағдайында қайталау"
        />
        <section className="panel">
          <b>Толық мәтіндік сабақтарды іздеп жүрсің бе?</b>
          <p>
            Бұл каталог 20 негізгі сөйлемнің 1000 жаттығу нұсқасын қамтиды. Жеке
            оқу мақсаты, мәтін, сөздік және қолдану тапсырмасы бар сабақтар оқу
            маршрутында орналасқан.
          </p>
          <Link className="btn primary" href="/learn/map?demo=1">
            Толық сабақтарды ашу →
          </Link>
        </section>
        <div className="courseProgress">
          <div>
            <b>{Math.min(unlockedLesson - 1, 1000)} / 1000 жаттығу аяқталды</b>
            <span>
              {unlockedLesson > 1000
                ? "Курс толық аяқталды!"
                : `Қазіргі сабақ: №${unlockedLesson}`}
            </span>
          </div>
          <div>
            <i
              style={{
                width: `${Math.min(100, ((unlockedLesson - 1) / 1000) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="catalogTools">
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Сабақ немесе грамматика іздеу"
            />
          </label>
          <div>
            {["Барлығы", ...new Set(courseLessons.map((l) => l.level))].map(
              (item) => (
                <button
                  className={level === item ? "active" : ""}
                  onClick={() => {
                    setLevel(item);
                    setPage(0);
                  }}
                  key={item}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <b>{filtered.length} жаттығу</b>
        </div>
        <div className="lessonGrid">
          {items.map((lesson) => {
            const completed = lesson.id < unlockedLesson;
            const current = lesson.id === unlockedLesson;
            const content = (
              <>
                <span className={`levelDot ${lesson.level}`}>
                  {lesson.level}
                </span>
                <small>
                  № {lesson.id} • {lesson.context}
                </small>
                <h3>{lesson.title}</h3>
                <p>{lesson.grammar}</p>
                <div>
                  {lesson.words.slice(0, 3).map((word) => (
                    <em key={word}>{word}</em>
                  ))}
                </div>
                <footer>
                  {completed ? (
                    <>
                      <Check /> Аяқталды
                    </>
                  ) : current ? (
                    <>
                      <Play /> Жалғастыру
                    </>
                  ) : (
                    <>
                      <Lock /> Алдымен №{unlockedLesson}
                    </>
                  )}
                </footer>
              </>
            );
            return lesson.id <= unlockedLesson ? (
              <Link
                className={current ? "currentLesson" : "completedLesson"}
                href={`/student/lesson/${lesson.id}`}
                key={lesson.id}
              >
                {content}
              </Link>
            ) : (
              <article className="lockedLesson" key={lesson.id}>
                {content}
              </article>
            );
          })}
        </div>
        <div className="pagination">
          <button
            disabled={!page}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft />
          </button>
          <span>
            {page + 1} / {Math.max(1, pages)}
          </span>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </Shell>
  );
}
