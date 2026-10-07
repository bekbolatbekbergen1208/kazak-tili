"use client";
import Link from "next/link";
import { useState } from "react";
import { goals, lessons } from "@/lib/learning/content";
import { courses, lessonById } from "@/lib/learning/content";
import { accessible } from "@/lib/learning/state";
import { useLearning } from "./provider";
import { Companion } from "./frame";
import { coinRewards } from "@/lib/characters/config";
export default function LearningMap() {
  const { state, t } = useLearning(),
    [goal, setGoal] = useState(state.profile.goal),
    [level, setLevel] = useState("all"),
    [topic, setTopic] = useState("all"),
    [duration, setDuration] = useState("all"),
    [completion, setCompletion] = useState("all"),
    [query, setQuery] = useState(""),
    course = courses.find((c) => c.id === goal)!,
    lang = state.profile.language;
  const matches = (id: string) => {
    const l = lessonById(id)!;
    return (
      (level === "all" || l.level === level) &&
      (topic === "all" || l.topic === topic) &&
      (duration === "all" ||
        (l.minutes !== undefined && l.minutes <= Number(duration))) &&
      (completion === "all" ||
        (completion === "completed") ===
          !!state.progress.lessons[id]?.completedAt) &&
      `${l.title.ru} ${l.objective ?? ""} ${l.vocabulary?.map((w) => w.kk).join(" ") ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase().trim())
    );
  };
  const sections = course.sections
    .map((s) => ({ ...s, lessonIds: s.lessonIds.filter(matches) }))
    .filter((s) => s.lessonIds.length);
  return (
    <div className="page">
      <span className="pill">{course.icon} Оқу бағыты</span>
      <h1>{course.title[lang]}</h1>
      <p>
        {t(
          "Каждый раздел: уроки, мини-игра, повторение и контрольная точка.",
          "Each section has lessons, a mini-game, review and a checkpoint.",
        )}
      </p>
      <div className="qd-content-filters">
        <label>
          Бағыт
          <select
            aria-label="Оқу бағыты"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value as typeof goal);
              setTopic("all");
            }}
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title[lang]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Деңгей
          <select
            aria-label="Сабақ деңгейі"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">Барлығы</option>
            {["A1", "A2", "B1", "B2"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Тақырып
          <select
            aria-label="Сабақ тақырыбы"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">Барлығы</option>
            {[
              ...new Set(
                lessons
                  .filter((l) => l.goal === goal)
                  .map((l) => l.topic)
                  .filter(Boolean),
              ),
            ].map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        </label>
        <label>
          Ұзақтық
          <select
            aria-label="Сабақ ұзақтығы"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="all">Барлығы</option>
            <option value="8">8 минутқа дейін</option>
            <option value="10">10 минутқа дейін</option>
          </select>
        </label>
        <label>
          Күйі
          <select
            aria-label="Аяқталу күйі"
            value={completion}
            onChange={(e) => setCompletion(e.target.value)}
          >
            <option value="all">Барлығы</option>
            <option value="completed">Аяқталған</option>
            <option value="unfinished">Аяқталмаған</option>
          </select>
        </label>
        <label>
          Іздеу
          <input
            aria-label="Сабақты іздеу"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Тақырып немесе сөз"
          />
        </label>
      </div>
      <p>
        {sections.reduce((n, s) => n + s.lessonIds.length, 0)} сабақ табылды.
        Деңгей — мәтіннің күрделілігі; өңір — мәдени контекст.
      </p>
      {!sections.length && (
        <p role="status">
          Бұл сүзгілерге сай сабақ жоқ. Басқа деңгей немесе тақырып таңда.
        </p>
      )}
      <Companion context="map" />
      <div className="qd-map">
        {sections.map((section, i) => (
          <section className="panel" key={section.id}>
            <div className="sectionHead">
              <div>
                <span className="overline">
                  {t("РАЗДЕЛ", "SECTION")} {i + 1}
                </span>
                <h2>{section.title[lang]}</h2>
              </div>
              <span className="pill">+50 XP · 🪙 {coinRewards.section}</span>
            </div>
            {section.lessonIds.map((id, index) => {
              const l = lessonById(id)!,
                p = state.progress.lessons[id],
                open = accessible(state, id),
                status = p?.status ?? (open ? "available" : "locked");
              const label = {
                locked: t("Заблокирован", "Locked"),
                available: t("Доступен", "Available"),
                started: t("Начат", "Started"),
                completed: t("Завершён", "Completed"),
                perfect: t("Идеально", "Perfect"),
              }[status];
              return (
                <div className={`qd-map-node ${status}`} key={id}>
                  <span className="qd-node">
                    {status === "perfect"
                      ? "★"
                      : status === "completed"
                        ? "✓"
                        : open
                          ? index + 1
                          : "🔒"}
                  </span>
                  <div>
                    <b>{l.title[lang]}</b>
                    {l.objective && (
                      <small>
                        {l.level} · {l.minutes} минут · {l.vocabulary?.length}{" "}
                        сөз · {l.exercises.length} тапсырма
                      </small>
                    )}
                    <small>
                      {label} ·{" "}
                      {l.kind === "test"
                        ? t("Итоговый тест", "Checkpoint")
                        : l.kind === "game"
                          ? t("Мини-игра", "Mini-game")
                          : l.kind === "review"
                            ? t("Повторение", "Review")
                            : t("Урок", "Lesson")}
                    </small>
                  </div>
                  {open ? (
                    <Link className="btn ghost" href={`/learn/${id}`}>
                      {p?.completedAt
                        ? t("Посмотреть", "View")
                        : t("Начать", "Start")}{" "}
                      →
                    </Link>
                  ) : (
                    <span className="qd-lock-note">
                      {t(
                        l.prerequisites?.length
                          ? "Осы модульдің алдыңғы сабағынан кейін"
                          : "После предыдущего урока",
                        "After this module’s prerequisite lesson",
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
