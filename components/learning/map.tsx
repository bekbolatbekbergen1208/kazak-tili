"use client";
import Link from "next/link";
import { courses, lessonById } from "@/lib/learning/content";
import { accessible } from "@/lib/learning/state";
import { useLearning } from "./provider";
import { Companion } from "./frame";
import { coinRewards } from "@/lib/characters/config";
export default function LearningMap() {
  const { state, t } = useLearning(),
    course = courses.find((c) => c.id === state.profile.goal)!,
    lang = state.profile.language;
  return (
    <div className="page">
      <span className="pill">{course.icon} A1</span>
      <h1>{course.title[lang]}</h1>
      <p>
        {t(
          "Каждый раздел: уроки, мини-игра, повторение и контрольная точка.",
          "Each section has lessons, a mini-game, review and a checkpoint.",
        )}
      </p>
      <Companion context="map" />
      <div className="qd-map">
        {course.sections.map((section, i) => (
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
                        "После предыдущего урока",
                        "After the previous lesson",
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
