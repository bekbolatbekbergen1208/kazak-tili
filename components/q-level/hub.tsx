"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ArrowUpRight,
  Award,
  Headphones,
  Play,
  Share2,
  Target,
} from "lucide-react";
import { useLearning } from "@/components/learning/provider";
import { labels, skills, type Result } from "@/lib/q-level/types";
import { Results, LearningPath } from "./results";
import {LanguageGrowth} from "@/components/literary/vocabulary";
import { Recorder } from "./recorder";
import { QuestionInput } from "./question-input";
import {
  activityLeague,
  demoHistory,
  demoLeaders,
  leagues,
} from "@/lib/q-level/demo";
import { useQLevel } from "./use-q-level";
import "./q-level.css";
const base = "/learn/q-level";
const tabs = [
  ["", "Шолу"],
  ["quick", "Quick Test"],
  ["full", "Толық тест"],
  ["passport", "Qazaq Passport"],
  ["progress", "Прогресс"],
  ["leaderboard", "Рейтинг"],
] as const;
const disclaimer =
  "QazaqDos ішкі диагностикалық көрсеткіші. Ресми CEFR, QAZTEST немесе мемлекеттік сертификат емес.";
export default function QLevelHub({ screen = "" }: { screen?: string }) {
  const q = useQLevel(),
    { state } = useLearning();
  const [showDemo, setShowDemo] = useState(false),
    [selected, setSelected] = useState(""),
    [text, setText] = useState(""),
    [plays, setPlays] = useState(0),
    [audioError, setAudioError] = useState(""),
    [playing, setPlaying] = useState(false),
    [rankTab, setRankTab] = useState("weekly"),
    [shareMessage, setShareMessage] = useState(""),
    [optIn, setOptIn] = useState(false);
  const r = showDemo ? demoHistory.at(-1)! : q.result;
  const history = showDemo ? demoHistory : q.history;
  const current = q.question;
  const lessons = Object.values(state.progress.lessons).filter(
    (x) => x.completedAt,
  ).length;
  const growth = r && r.previousScore !== null ? r.score - r.previousScore : 0;
  useEffect(() => {
    setSelected("");
    setText("");
    setPlays(0);
    setAudioError("");
    setPlaying(false);
    window.speechSynthesis?.cancel();
  }, [current?.id]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  async function start(type: "quick" | "full") {
    setShowDemo(false);
    await q.action({ action: "start", type });
  }
  async function audio() {
    if (!current || playing) return;
    setAudioError("");
    const s = await q.action({ action: "audio", questionId: current.id });
    if (!s) return;
    if (s.audioUrl) {
      const a = new Audio(s.audioUrl);
      setPlaying(true);
      a.onended = () => setPlaying(false);
      a.onerror = () => {
        setPlaying(false);
        setAudioError("Аудио ашылмады.");
      };
      await a.play().catch(() => {
        setPlaying(false);
        setAudioError("Аудионы ойнату мүмкін емес.");
      });
    } else {
      const voice = window.speechSynthesis
        ?.getVoices()
        .find((v) => v.lang.toLowerCase().startsWith("kk"));
      if (!voice) {
        setAudioError(
          "Құрылғыда қазақша дауыс жоқ. Тыңдалымға жауап беру үшін қазақша жүйелік дауысты қосыңыз. Жауапты болжауға міндетті емессіз.",
        );
        return;
      }
      const u = new SpeechSynthesisUtterance(s.speechText);
      u.lang = "kk-KZ";
      u.voice = voice;
      u.rate = 0.85;
      u.onend = () => setPlaying(false);
      u.onerror = () => {
        setPlaying(false);
        setAudioError("Дауыс ойнатылмады.");
      };
      setPlaying(true);
      window.speechSynthesis.speak(u);
    }
    setPlays((n) => n + 1);
  }
  async function share() {
    if (!r) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 1080, 1080);
      const palette = getComputedStyle(document.documentElement);
      g.addColorStop(0, palette.getPropertyValue("--qd-ink").trim());
      g.addColorStop(1, palette.getPropertyValue("--qd-brand-dark").trim());
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.fillStyle = palette.getPropertyValue("--qd-lavender").trim();
      ctx.font = "bold 45px sans-serif";
      ctx.fillText("QazaqDos / QAZAQ PASSPORT", 80, 110);
      ctx.fillStyle = "white";
      ctx.font = "40px sans-serif";
      ctx.fillText(state.profile.nickname.slice(0, 24), 80, 230);
      ctx.font = "bold 185px sans-serif";
      ctx.fillText(r.level, 80, 480);
      ctx.font = "bold 65px sans-serif";
      ctx.fillText(`${r.score} Q-Score`, 80, 590);
      ctx.font = "40px sans-serif";
      ctx.fillText(
        `Прогресс: ${growth >= 0 ? "+" : ""}${growth} Q-Points`,
        80,
        720,
      );
      ctx.font = "28px sans-serif";
      ctx.fillText("Қазақ тілін үйрену — өлшенетін прогресс.", 80, 875);
      ctx.font = "22px sans-serif";
      ctx.fillText(
        showDemo
          ? "Демо үлгі · ресми сертификат емес"
          : "Диагностикалық нәтиже · ресми сертификат емес",
        80,
        970,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error();
      const file = new File([blob], "qazaq-passport.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({
          files: [file],
          title: "Менің Q-Level деңгейім",
        });
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setShareMessage("Бөлісу картасы дайын.");
    } catch {
      setShareMessage("Бөлісу тоқтатылды немесе сурет сақталмады.");
    }
  }
  const testMode = screen === "quick" || screen === "full";
  const active = q.attempt && !q.attempt.completed && current;
  return (
    <div className="page ql-page">
      <header className="ql-heading">
        <div>
          <span className="overline">LEARN → MEASURE → IMPROVE</span>
          <h1>
            Q-Level<span className="ql-dot">.</span>
          </h1>
          <p>Қазақ тілін үйрену — өлшенетін прогресс.</p>
        </div>
        <span className="ql-chip">
          <Award size={16} /> QazaqDos диагностикасы
        </span>
      </header>
      <nav className="ql-tabs" aria-label="Q-Level бөлімдері">
        {tabs.map(([slug, title]) => (
          <Link
            key={slug}
            className={screen === slug ? "active" : ""}
            href={`${base}${slug ? "/" + slug : ""}`}
          >
            {title}
          </Link>
        ))}
      </nav>
      <p className="ql-trust">{disclaimer}</p>
      {q.error && (
        <div role="alert" className="ql-error">
          {q.error}
          <button className="btn ghost" onClick={() => void q.load()}>
            Қайта жүктеу
          </button>
        </div>
      )}
      {!q.ready ? (
        <p role="status">Q-Level жүктелуде…</p>
      ) : (
        <>
          <div className="ql-demo-bar">
            {q.demo
              ? "Демо режимі · осы браузерде сақталады"
              : "Жеке нәтижелерің тек саған көрінеді"}
            <button onClick={() => setShowDemo((v) => !v)}>
              {showDemo ? "Өз нәтижеме оралу" : "Демо нәтижені қарау"}
            </button>
          </div>
          {showDemo && (
            <p className="ql-demo-label">
              Үлгі деректер · бұл сенің тест нәтижең емес
            </p>
          )}
          {testMode ? (
            active ? (
              <section className="ql-exam" key={current.id}>
                <header>
                  <span className="ql-chip">
                    {q.attempt!.type === "quick"
                      ? "Quick Q-Test"
                      : "Q-Level Test"}
                  </span>
                  <span>
                    {q.attempt!.answers.length + 1} /{" "}
                    {q.attempt!.type === "quick" ? 16 : 22}
                  </span>
                </header>
                <progress
                  max={q.attempt!.type === "quick" ? 16 : 22}
                  value={q.attempt!.answers.length}
                />
                {q.attempt!.type === "full" && (
                  <div className="ql-steps">
                    {[
                      "Тыңдалым",
                      "Оқылым",
                      "Лексика / грамматика",
                      "Жазылым",
                      "Айтылым",
                    ].map((s, i) => (
                      <span
                        key={s}
                        className={
                          (q.attempt!.answers.length < 6
                            ? 0
                            : q.attempt!.answers.length < 12
                              ? 1
                              : q.attempt!.answers.length < 20
                                ? 2
                                : q.attempt!.answers.length === 20
                                  ? 3
                                  : 4) === i
                            ? "active"
                            : ""
                        }
                      >
                        {i + 1}. {s}
                      </span>
                    ))}
                  </div>
                )}
                <span className="overline">
                  {labels[current.skill]} · {current.level}
                </span>
                <h2>{current.question}</h2>
                {current.text_content && (
                  <blockquote>{current.text_content}</blockquote>
                )}
                {current.skill === "listening" && (
                  <div className="ql-audio">
                    <button
                      aria-label="Аудионы тыңдау"
                      disabled={q.busy || playing}
                      onClick={() => void audio()}
                    >
                      <Play fill="currentColor" />
                    </button>
                    <div className={playing ? "ql-wave playing" : "ql-wave"}>
                      {Array.from({ length: 28 }, (_, i) => (
                        <i key={i} style={{ height: 10 + ((i * 17) % 36) }} />
                      ))}
                    </div>
                    <span>{plays} рет тыңдалды</span>
                  </div>
                )}
                {audioError && (
                  <p role="alert" className="ql-error">
                    {audioError}
                  </p>
                )}
                {current.type !== "writing" && current.type !== "speaking" ? (
                  <QuestionInput
                    question={current}
                    value={selected}
                    onChange={setSelected}
                    disabled={q.busy}
                  />
                ) : (
                  <>
                    {current.skill === "speaking" && (
                      <Recorder key={current.id} />
                    )}
                    <p>
                      {current.skill === "speaking"
                        ? "Сөйлеген сөзіңнің мәтінін енгіз. Аудио тек осы бетте, құрылғыңда қалады."
                        : "Жауабыңды өз сөзіңмен жаз."}{" "}
                      Бұл бөлім бағалау қызметіне дайын; қазір балл берілмейді.
                    </p>
                    <textarea
                      aria-label="Жауап мәтіні"
                      rows={7}
                      maxLength={12000}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Қазақша жаз…"
                    />
                    <small>
                      {text.trim() ? text.trim().split(/\s+/).length : 0} сөз ·
                      бағалау күтілуде
                    </small>
                  </>
                )}
                <footer>
                  <span>Жауап жіберілген сайын сақталады.</span>
                  <button
                    className="btn primary"
                    disabled={
                      q.busy ||
                      ((current.type === "writing" ||
                        current.type === "speaking") &&
                        text.trim().length < 3) ||
                      (current.type !== "writing" &&
                        current.type !== "speaking" &&
                        !selected) ||
                      (current.skill === "listening" && plays === 0)
                    }
                    onClick={() =>
                      void q.action({
                        action: "answer",
                        questionId: current.id,
                        value:
                          current.type === "writing" ||
                          current.type === "speaking"
                            ? text
                            : selected,
                      })
                    }
                  >
                    {q.busy ? "Сақталуда…" : "Жауап беру →"}
                  </button>
                </footer>
                {(current.skill === "speaking" ||
                  current.skill === "writing" ||
                  (current.skill === "listening" && audioError)) && (
                  <button
                    className="btn ghost"
                    disabled={q.busy}
                    onClick={() =>
                      void q.action({
                        action: "answer",
                        questionId: current.id,
                        value: current.options ? "__SKIP__" : "Өткізу",
                      })
                    }
                  >
                    Бағалаусыз өткізу
                  </button>
                )}
              </section>
            ) : q.attempt?.completed && r ? (
              <>
                <Results result={r} />
                <Link className="btn primary" href={`${base}/passport`}>
                  Qazaq Passport ашу →
                </Link>
                <button
                  className="btn ghost"
                  onClick={() =>
                    void start(screen === "full" ? "full" : "quick")
                  }
                >
                  Жаңа тест
                </button>
              </>
            ) : (
              <section className="ql-start">
                <span className="ql-chip">
                  <Headphones size={18} />{" "}
                  {screen === "full"
                    ? "5 бөлім · 22 тапсырма"
                    : "5–7 минут · 16 тапсырма"}
                </span>
                <h2>
                  {screen === "full"
                    ? "Толық Q-Level диагностикасы"
                    : "Қазақша деңгейіңді анықтайық"}
                </h2>
                <p>
                  Бірнеше минуттық тест QazaqDos-та саған лайық оқу жолын
                  құрады.
                </p>
                <ul>
                  <li>Қиындық жауаптарыңа бейімделеді.</li>
                  <li>
                    Оқылым, тыңдалым, сөздік қор және грамматика бағаланады.
                  </li>
                  <li>Айтылым мен жазылым үшін бөлек бағалау қажет.</li>
                  <li>
                    Қазақша жүйелік дауыс немесе аудиофайл тыңдалымға қажет.
                  </li>
                </ul>
                <button
                  className="btn primary"
                  disabled={q.busy}
                  onClick={() =>
                    void start(screen === "full" ? "full" : "quick")
                  }
                >
                  {q.busy ? "Дайындалуда…" : "Деңгейді анықтау →"}
                </button>
                <button
                  className="btn ghost"
                  disabled={q.busy}
                  onClick={() => void q.action({ action: "beginner" })}
                >
                  Мен қазақ тілін білмеймін
                </button>
                <Link className="btn ghost" href="/learn/map">
                  Турист ретінде бастау
                </Link>
                {r?.type === "beginner" && (
                  <p>
                    A0 — алғашқы қадам.{" "}
                    <Link href="/learn/map">Бастауыш оқу жолын ашу →</Link>
                  </p>
                )}
              </section>
            )
          ) : screen === "passport" ? (
            r ? (
              <>
                <section className="ql-passport">
                  <header>
                    <span>QAZAQ PASSPORT</span>
                    <Award />
                  </header>
                  <div className="ql-passport-user">
                    <span>{state.profile.avatar}</span>
                    <div>
                      <h2>{state.profile.nickname}</h2>
                      <p>Қазақша үйрен. Әлеміңді кеңейт.</p>
                    </div>
                  </div>
                  <div className="ql-passport-score">
                    <div>
                      <small>Q-LEVEL {r.pending ? "· болжамды" : ""}</small>
                      <strong>{r.level}</strong>
                    </div>
                    <div>
                      <strong>{r.score}</strong>
                      <small>Q-Score / 100</small>
                    </div>
                  </div>
                  <div className="ql-passport-stats">
                    <span>🔥 {state.progress.streak.current} күн</span>
                    <span>{state.progress.xp} XP</span>
                    <span>{lessons} сабақ</span>
                  </div>
                  <div className="ql-skill-grid">
                    {skills.map((s) => (
                      <div key={s}>
                        <span>{labels[s]}</span>
                        <b>
                          {r.skills[s].score === null
                            ? "Бағаланбаған"
                            : r.skills[s].level}
                        </b>
                      </div>
                    ))}
                  </div>
                  <p>
                    Прогресс:{" "}
                    {r.previousScore !== null
                      ? `${growth >= 0 ? "+" : ""}${growth} Q-Points`
                      : "Алғашқы нәтиже"}
                  </p>
                  <div className="ql-badges">
                    <span>✦ Алғашқы диагностика</span>
                    {growth >= 10 && <span>✦ +10 Q-Points</span>}
                    {state.progress.streak.current >= 7 && (
                      <span>✦ 7 күндік серия</span>
                    )}
                  </div>
                  <small>{disclaimer}</small>
                </section>
                <button className="btn primary" onClick={() => void share()}>
                  <Share2 size={18} /> Профильді бөлісу
                </button>
                <p role="status">{shareMessage}</p>
              </>
            ) : (
              <Empty />
            )
          ) : screen === "progress" ? (
            r ? (
              <>
                <section className="ql-panel">
                  <span className="overline">КЕШЕ → БҮГІН → ЕРТЕҢ</span>
                  <h2>Әр қадамың — прогресс</h2>
                  <div className="ql-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={history.map((x) => ({
                          date: new Date(x.date).toLocaleDateString("kk-KZ", {
                            day: "numeric",
                            month: "short",
                          }),
                          score: x.score,
                        }))}
                      >
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--qd-brand)"
                          strokeWidth={4}
                          dot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {history.length > 1 && (
                    <div className="ql-skill-grid">
                      {skills.map((skill) => {
                        const before = history[0].skills[skill].score,
                          after = r.skills[skill].score;
                        return before !== null && after !== null ? (
                          <div key={skill}>
                            <span>{labels[skill]}</span>
                            <b>
                              {after - before >= 0 ? "+" : ""}
                              {after - before} Q-Points
                            </b>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="ql-timeline">
                    {history.map((x) => (
                      <div key={x.id}>
                        <time>
                          {new Date(x.date).toLocaleDateString("kk-KZ")}
                        </time>
                        <b>
                          {x.level} / {x.score}
                        </b>
                        <span>
                          {x.type === "quick"
                            ? "Quick Check"
                            : x.type === "beginner"
                              ? "Алғашқы қадам"
                              : "Толық тест"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <LearningPath result={r} />
              </>
            ) : (
              <Empty />
            )
          ) : screen === "leaderboard" ? (
            <>
              <section className="ql-panel">
                <span className="overline">ЕҢ ҮЛКЕН ЖЕҢІС — ӨЗІҢНЕН ОЗУ</span>
                <h2>Аптаның үздіктері</h2>
                <p>
                  Q-Points өсімі · бастапқы деңгейің қандай болса да,
                  ілгерілеуің бағалы.
                </p>
                <div className="ql-rank-tabs">
                  {[
                    ["overall", "Жалпы рейтинг"],
                    ["weekly", "Апталық прогресс"],
                    ["monthly", "Айлық прогресс"],
                    ["friends", "Достар"],
                    ["schools", "Мектептер"],
                  ].map(([id, l]) => (
                    <button
                      key={id}
                      onClick={() => setRankTab(id)}
                      className={rankTab === id ? "active" : ""}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {rankTab === "friends" ? (
                  <p>
                    Достар арасындағы Q-Level салыстыруы үшін екі жақтың
                    келісімі қажет. Жеке тест жауаптары бөлісілмейді.
                  </p>
                ) : rankTab === "schools" ? (
                  <>
                    <h3>QazaqDos Cup — Ақтау</h3>
                    <p className="ql-demo-label">
                      Болашақ жарыстың демо үлгісі
                    </p>
                    {["№12 мектеп", "№8 мектеп", "№3 мектеп"].map((s, i) => (
                      <div className="ql-rank-row" key={s}>
                        <b>{i + 1}</b>
                        <span>
                          {s}
                          <small>{[32, 24, 18][i]} қатысушы · демо</small>
                        </span>
                        <strong>+{[420, 355, 280][i]} Q-Points</strong>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {(showDemo || q.demo) && (
                      <p className="ql-demo-label">Демо қатысушылар</p>
                    )}
                    {(showDemo || q.demo
                      ? demoLeaders.map((x) => ({
                          display_name: x.name,
                          weekly_growth: x.weekly,
                          monthly_growth: x.monthly,
                          current_score: x.score,
                          level: x.level,
                        }))
                      : q.leaders
                    )
                      .slice()
                      .sort((a, b) =>
                        rankTab === "overall"
                          ? b.current_score - a.current_score
                          : rankTab === "monthly"
                            ? b.monthly_growth - a.monthly_growth
                            : b.weekly_growth - a.weekly_growth,
                      )
                      .map((x, i) => (
                        <div className="ql-rank-row" key={x.display_name + i}>
                          <b>{String(i + 1).padStart(2, "0")}</b>
                          <span>
                            {x.display_name}
                            <small>Q-Level {x.level}</small>
                          </span>
                          <strong>
                            {rankTab === "overall"
                              ? x.current_score
                              : `+${rankTab === "monthly" ? x.monthly_growth : x.weekly_growth}`}
                            <small>
                              {rankTab === "overall" ? "Q-Score" : "Q-Points"}
                            </small>
                          </strong>
                        </div>
                      ))}
                    {!q.demo && !showDemo && !q.leaders.length && (
                      <p>
                        Рейтинг әзірге бос. Нәтижесін бөлісуге келісім берген
                        қатысушылар осы жерде көрінеді.
                      </p>
                    )}
                  </>
                )}
                {!q.demo && r && !showDemo && (
                  <div className="ql-opt-in">
                    <label>
                      <input
                        type="checkbox"
                        checked={optIn}
                        onChange={(e) => setOptIn(e.target.checked)}
                      />{" "}
                      Лақап атым мен Q-Score нәтижемді рейтингте көрсетуге
                      келісемін
                    </label>
                    <button
                      disabled={q.busy}
                      className="btn ghost"
                      onClick={async () => {
                        const saved = await q.action({
                          action: "visibility",
                          visible: optIn,
                          alias: state.profile.nickname,
                        });
                        if (saved) await q.load();
                      }}
                    >
                      Сақтау
                    </button>
                  </div>
                )}
              </section>
              <section className="ql-panel">
                <h2>
                  Сенің лигаң —{" "}
                  {activityLeague(
                    lessons,
                    state.progress.streak.current,
                    growth,
                  )}
                </h2>
                <p>
                  Лига сабақ, серия және Q-Points өсіміне сүйенеді. XP тіл
                  деңгейін өзгертпейді.
                </p>
                <div className="ql-leagues">
                  {leagues.map((l, i) => (
                    <span key={l}>
                      <Award size={24} />
                      <b>{l}</b>
                      <small>{i * 100} белсенділік ұпайы</small>
                    </span>
                  ))}
                </div>
                <p>
                  Апталық көтерілу / төмендеу және командалық Cup — келесі
                  кезеңге арналған инфрақұрылым.
                </p>
              </section>
            </>
          ) : (
            <>
              {r ? (
                <>
                  <Results result={r} />
                  <LearningPath result={r} />
                  <section className="ql-panel">
                    <h3>Деңгейің өзгерді ме?</h3>
                    <p>
                      {lessons >= 25
                        ? "25 сабақтан өттің. Жаңа диагностика жасап көр."
                        : "20–30 сабақтан кейін толық диагностика ұсынылады. Quick Check арқылы аралық өзгерісті бақыла."}
                    </p>
                    <Link className="btn primary" href={`${base}/quick`}>
                      Quick Check →
                    </Link>
                    <Link className="btn ghost" href={`${base}/full`}>
                      Толық тест
                    </Link>
                  </section>
                </>
              ) : (
                <section className="ql-hero">
                  <div>
                    <span className="ql-chip">
                      <Target size={17} /> Өзіңнің келесі деңгейіңді аш
                    </span>
                    <h2>
                      Кеше A2.
                      <br />
                      Бүгін B1.
                      <br />
                      <em>Келесі мақсат — B2.</em>
                    </h2>
                    <p>
                      Қазақ тілін меңгеру деңгейін анықтайтын диагностикалық
                      жүйе. Алты дағды, бір жеке оқу жолы.
                    </p>
                    <Link href={`${base}/quick`} className="btn primary">
                      Деңгейді анықтау <ArrowUpRight size={18} />
                    </Link>
                    <Link href={`${base}/full`} className="btn ghost">
                      Толық диагностика
                    </Link>
                  </div>
                  <div className="ql-hero-art">
                    <div className="ql-orbit">
                      <span>Q</span>
                      <small>LEVEL</small>
                    </div>
                    <span className="ql-floating">↗ Өлшенетін прогресс</span>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
      {screen==="passport"&&r&&<LanguageGrowth/>}
      {q.ready &&
        !showDemo &&
        q.review.length > 0 &&
        (screen === "" || (testMode && q.attempt?.completed)) && (
          <details className="ql-panel">
            <summary>Тест жауаптарын талдау</summary>
            {q.review.map((x, i) => (
              <div className="ql-review-row" key={i}>
                <h4>
                  {i + 1}. {x.question}
                </h4>
                <p>
                  Сенің жауабың:{" "}
                  {x.answer === "__SKIP__" ? "Өткізілді" : x.answer}
                </p>
                <small>
                  {x.correct === null
                    ? "Бағаланбаған"
                    : x.correct
                      ? "Дұрыс"
                      : "Қате"}{" "}
                  · {x.explanation}
                </small>
              </div>
            ))}
          </details>
        )}
    </div>
  );
}
function Empty() {
  return (
    <section className="ql-panel">
      <h2>Алғашқы нәтижеңді аш</h2>
      <p>Паспорт пен прогресс тест тапсырғаннан кейін пайда болады.</p>
      <Link className="btn primary" href={`${base}/quick`}>
        Quick Q-Test бастау →
      </Link>
    </section>
  );
}
