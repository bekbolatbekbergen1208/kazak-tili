"use client";
import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, ArrowUpRight } from "lucide-react";
import { labels, skills, type Result } from "@/lib/q-level/types";
import { recommendations, nextTarget } from "@/lib/q-level/presentation";
const base = "/learn/q-level";
export function Results({ result: r }: { result: Result }) {
  const measured = skills.filter((s) => r.skills[s].score !== null),
    sorted = [...measured].sort(
      (a, b) => (r.skills[b].score ?? 0) - (r.skills[a].score ?? 0),
    );
  return (
    <>
      <section className="ql-result">
        <div>
          <span className="overline">
            {r.type === "beginner" ? "АЛҒАШҚЫ ҚАДАМ" : "БОЛЖАМДЫ ДЕҢГЕЙІҢ"}
          </span>
          <h2>
            Q-Level <strong>{r.level}</strong>
          </h2>
          <p>
            {r.level === "A0"
              ? "Қазақша үйренуді алғашқы сөздерден бастайық."
              : r.score >= 45
                ? "Күнделікті тақырыптарда қазақ тілін қолдануға дайынсың."
                : "Таныс тақырыптарда қазақша түсіну дағдың қалыптасып келеді."}
          </p>
          <span className="ql-chip">Сенімділік: {r.confidence}%</span>
          <p>
            <small>
              {new Date(r.date).toLocaleDateString("kk-KZ")} ·{" "}
              {r.pending
                ? "Айтылым / жазылым бағаланбаған"
                : "Демо бағалау үлгісі"}
            </small>
          </p>
        </div>
        <div
          className="ql-score-ring"
          style={{
            background: `conic-gradient(var(--qd-brand-light) ${r.score}%,#ffffff24 0)`,
          }}
        >
          <div>
            <strong>{r.score}</strong>
            <span>/ 100 Q-Score</span>
          </div>
        </div>
      </section>
      <section className="ql-two">
        <div className="ql-panel">
          <h3>Алты дағды. Бір мақсат.</h3>
          <div className="ql-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={skills.map((s) => ({
                  skill: labels[s],
                  score: r.skills[s].score ?? 0,
                }))}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <Radar
                  dataKey="score"
                  stroke="var(--qd-brand)"
                  fill="var(--qd-brand)"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="ql-skill-grid">
            {skills.map((s) => (
              <div key={s}>
                <span>{labels[s]}</span>
                <b>
                  {r.skills[s].score === null
                    ? "—"
                    : `${r.skills[s].level} · ${r.skills[s].score}`}
                </b>
              </div>
            ))}
          </div>
          <small>
            «—» және диаграммадағы 0 — бағаланбаған дағды, нөлдік нәтиже емес.
          </small>
        </div>
        <div className="ql-insights">
          <div className="ql-panel">
            <TrendingUp />
            <span className="overline">КҮШТІ ЖАҒЫҢ</span>
            <h3>
              {sorted[0]
                ? `${labels[sorted[0]]} — ${r.skills[sorted[0]].level}`
                : "Алғашқы қадам жасау"}
            </h3>
          </div>
          <div className="ql-panel">
            <Target />
            <span className="overline">ДАМЫТУ КЕРЕК</span>
            <h3>
              {sorted.at(-1)
                ? `${labels[sorted.at(-1)!]} — ${r.skills[sorted.at(-1)!].level}`
                : "Күнделікті сөздер"}
            </h3>
            <p>{r.feedback[0]}</p>
          </div>
          <Link className="btn ghost" href={`${base}/passport`}>
            Qazaq Passport →
          </Link>
        </div>
      </section>
    </>
  );
}
export function LearningPath({ result: r }: { result: Result }) {
  const target = nextTarget(r);
  return (
    <section className="ql-panel">
      <span className="overline">ДОСЖАН · ЖЕКЕ ОҚУ ҰСЫНЫСЫ</span>
      <h2>Сенің жеке оқу маршрутың</h2>
      <p>{r.feedback[0]} Келесі 14 күнде әлсіз дағдыларды жүйелі жаттықтыр.</p>
      <div className="ql-path">
        {recommendations(r).map((x) => (
          <Link href={x.href} key={x.skill}>
            <strong>{x.percent}%</strong>
            <span>{x.skill}</span>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
      <p>
        Келесі мақсат: {target.level} ·{" "}
        {target.remaining > 0
          ? `тағы ${target.remaining} Q-Point`
          : "Q-Score жеткілікті, дағды шектерін дамыту қажет"}
      </p>
      <progress value={r.score} max={target.score} />
      <small>
        Бұл мақсат жалпы ұпайға қатысты. Деңгейге өту үшін жеке дағдылардың
        шектері де ескеріледі.
      </small>
      <p>
        <Link className="btn primary" href="/learn/map">
          Жеке оқу жолын бастау →
        </Link>
      </p>
    </section>
  );
}
