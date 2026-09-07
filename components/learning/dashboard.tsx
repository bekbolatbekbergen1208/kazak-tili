"use client";
import Link from "next/link";
import {
  achievements,
  courses,
  lessonById,
  quests,
} from "@/lib/learning/content";
import {
  dayKey,
  emptyQuest,
  leagueFor,
  levelFor,
  nextLesson,
  weeklyXP,
} from "@/lib/learning/state";
import { useLearning } from "./provider";
import { Companion } from "./frame";
export default function Dashboard() {
  const { state, t, dispatch, busy } = useLearning(),
    { profile, progress: p } = state,
    lang = profile.language,
    course = courses.find((c) => c.id === profile.goal)!,
    next = lessonById(nextLesson(state))!,
    courseDone = course.sections.every((section) =>
      section.lessonIds.every((id) => p.lessons[id]?.completedAt),
    ),
    q = p.quests[dayKey()] ?? emptyQuest(),
    done = Object.values(p.lessons).filter((x) => x.completedAt).length,
    weekly = weeklyXP(state);
  const activeStreak =
    p.streak.lastDay &&
    p.streak.lastDay >= dayKey(new Date(Date.now() - 86400000))
      ? p.streak.current
      : 0;
  return (
    <div className="page qd-dashboard">
      <header className="top">
        <div>
          <span className="overline">
            {course.icon} {course.title[lang]}
          </span>
          <h1>
            {t("Сәлем", "Сәлем")}, {profile.nickname}!
          </h1>
          <p>
            {t(
              "Сегодня — ещё один шаг к свободному общению.",
              "Today is another step towards confident conversations.",
            )}
          </p>
        </div>
        <span className="pill">
          A1 · {t("Уровень", "Level")} {levelFor(p.xp)}
        </span>
      </header>
      <section className="heroCard">
        <div className="heroCopy">
          <span className="eyebrow">
            {t("ВАШ СЛЕДУЮЩИЙ ШАГ", "YOUR NEXT STEP")}
          </span>
          <h2>
            {courseDone
              ? t("Маршрут завершён!", "Your path is complete!")
              : next.title[lang]}
          </h2>
          <p>
            {t(
              "Пять небольших заданий. Одна полезная фраза.",
              "Five small exercises. One useful phrase.",
            )}
          </p>
          <Link
            className="btn white"
            href={courseDone ? "/learn/settings" : `/learn/${next.id}`}
          >
            {courseDone
              ? t("Выбрать следующую цель", "Choose your next goal")
              : t("Продолжить обучение", "Continue learning")}{" "}
            →
          </Link>
        </div>
        <Companion mood={q.lessons > 0 ? "joy" : "greeting"} />
      </section>
      <section className="statsGrid" aria-label={t("Прогресс", "Progress")}>
        {[
          [`${p.xp} XP`, t("Всего опыта", "Total experience")],
          [`🪙 ${p.coins}`, t("Монеты", "Coins")],
          [`🔥 ${activeStreak}`, t("Дней подряд", "Day streak")],
          [String(done), t("Уроков пройдено", "Lessons completed")],
        ].map(([value, label]) => (
          <div className="stat" key={label}>
            <div>
              <strong key={value} className="qd-count">
                {value}
              </strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>
      <div className="qd-grid two">
        <section className="panel">
          <div className="sectionHead">
            <h3>{t("План на сегодня", "Today’s plan")}</h3>
            <span>{q.lessons}/2</span>
          </div>
          <progress max={2} value={Math.min(2, q.lessons)} />
          <p>
            {t(
              "Спокойный темп: два коротких урока.",
              "A relaxed pace: two short lessons.",
            )}
          </p>
          {quests.map((quest) => (
            <div className="qd-quest" key={quest.id}>
              <div>
                <b>{quest.title[lang]}</b>
                <small>
                  {Math.min(q[quest.metric], quest.target)} / {quest.target} · +
                  {quest.reward} XP
                </small>
              </div>
              {q.claimed.includes(quest.id) ? (
                <span>✓</span>
              ) : (
                <button
                  className="btn ghost"
                  disabled={busy || q[quest.metric] < quest.target}
                  onClick={() =>
                    void dispatch({ type: "claim", questId: quest.id })
                  }
                >
                  {t("Забрать", "Claim")}
                </button>
              )}
            </div>
          ))}
        </section>
        <section className="panel">
          <h3>{t("Ваш маршрут", "Your path")}</h3>
          <p>{course.description[lang]}</p>
          <Link className="btn primary" href="/learn/map">
            {t("Открыть карту", "Open the map")} →
          </Link>
          <hr />
          <h3>
            {leagueFor(weekly)} · {weekly} XP
          </h3>
          <p>
            {t(
              "За текущую неделю · новая неделя начинается в понедельник (UTC).",
              "This week · a new week starts on Monday (UTC).",
            )}
          </p>
          <Link className="btn ghost" href="/learn/ranking">
            {t("Место в демо-рейтинге", "Your place in the demo ranking")}
          </Link>
        </section>
        <section className="panel">
          <h3>{t("Ритм обучения", "Learning rhythm")}</h3>
          <p>
            {t("Лучшая серия", "Best streak")}: {p.streak.best} ·{" "}
            {t(
              "Завершите урок сегодня, чтобы продолжить серию.",
              "Finish a lesson today to continue your streak.",
            )}
          </p>
          <div className="qd-calendar">
            {Array.from({ length: 14 }, (_, i) => {
              const date = dayKey(new Date(Date.now() - (13 - i) * 86400000)),
                active = p.streak.days.includes(date);
              return (
                <span
                  key={date}
                  className={active ? "active" : ""}
                  title={date}
                  aria-label={`${date}: ${active ? t("учились", "studied") : t("нет урока", "no lesson")}`}
                >
                  {date.slice(8)}
                </span>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <h3>{t("Достижения", "Achievements")}</h3>
          <div className="qd-badges">
            {achievements.map((a) => {
              const earned = p.achievements.some(
                (x) => x.achievementId === a.id,
              );
              return (
                <div className={earned ? "earned" : ""} key={a.id}>
                  <span>{a.icon}</span>
                  <small>
                    {a.title[lang]} {earned ? "✓" : "🔒"}
                  </small>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
