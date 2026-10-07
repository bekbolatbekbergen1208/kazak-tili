"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
} from "lucide-react";
import { useLearning } from "@/components/learning/provider";
import { useLanguage } from "@/components/literary/provider";
import { songLessons } from "@/lib/songs/content";
import {
  availableTasks,
  enoughWriting,
  songsOf,
  songWordStatus,
} from "@/lib/songs/state";
import { stages, type SongLesson, type SongAction } from "@/lib/songs/types";
import { SongPlayer, SongRecorder } from "./media";
import { SongGame } from "./tasks";
import { SongReviews } from "./reviews";
export function SongSession({ lesson }: { lesson: SongLesson }) {
  const learning = useLearning(),
    lang = useLanguage(),
    record = songsOf(learning.state).lessons[lesson.id];
  const [view, setView] = useState<number | null>(null),
    [word, setWord] = useState(0),
    [speech, setSpeech] = useState<string | null>(null),
    [writing, setWriting] = useState<string | null>(null),
    [reply, setReply] = useState(""),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [chatMode, setChatMode] = useState("");
  const stage = view ?? record?.stage ?? 0;
  async function act(a: SongAction) {
    setError("");
    try {
      const s = await learning.dispatch(a);
      if (!s) {
        setError("Сақталмады. Байланысты тексеріп, бетті жаңарт та, қайтала.");
        return false;
      }
      return true;
    } catch {
      setError("Әрекетті сақтау мүмкін болмады.");
      return false;
    }
  }
  async function coach() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/ai-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: writing ?? record?.writing,
          history: [],
          language: "kk",
          song: { lessonId: lesson.id, level: lesson.level },
        }),
      });
      const b = await res.json();
      if (!res.ok || typeof b.reply !== "string")
        throw Error(b.error || "Досша жауабы ашылмады.");
      setReply(b.reply);
      setChatMode(
        b.mode === "ai"
          ? "Досшаның AI ұсынысы. Мағынасын тексеріп қолдан."
          : "Анықтамалық режим: толық грамматикалық бағалау жасалмайды.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Досша қазір жауап бермеді. Мәтінді сақтап, жалғастыра аласың.",
      );
    } finally {
      setSending(false);
    }
  }
  const nextLesson =
    songLessons[songLessons.findIndex((l) => l.id === lesson.id) + 1];
  if (!record)
    return (
      <div className="page song-page">
        <Link href="/learn/songs" className="song-back">
          <ArrowLeft size={17} />
          Әнмен үйрен
        </Link>
        <section className="song-intro">
          <span className="pill">
            {lesson.level} · {lesson.minutes} минут
          </span>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
          <p>Тыңда → Түсін → Ойна → Айт → Қолдан → Қайтала</p>
          <button
            className="btn primary"
            disabled={learning.busy}
            onClick={() =>
              void act({ type: "song-start", lessonId: lesson.id })
            }
          >
            Сабақты бастау <ArrowRight size={18} />
          </button>
        </section>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  const w = lesson.words[word];
  const wordStatus = songWordStatus(learning.state, lesson.id);
  return (
    <div className="page song-page">
      <Link href="/learn/songs" className="song-back">
        <ArrowLeft size={17} />
        Әнмен үйрен
      </Link>
      <header className="song-session-head">
        <div>
          <span className="overline">
            {lesson.level} · {lesson.topic} · {lesson.minutes} минут
          </span>
          <h1>{lesson.title}</h1>
          <p>{lesson.objective}</p>
        </div>
        <span className="pill">
          {record.completedAt ? "✓ Аяқталды" : `${record.stage + 1} / 6 кезең`}
        </span>
      </header>
      <progress
        aria-label="Сабақ прогресі"
        max={6}
        value={record.completedAt ? 6 : record.stage}
      />
      <nav className="song-stages" aria-label="Сабақ кезеңдері">
        {stages.map((s, i) => (
          <button
            key={s}
            disabled={i > record.stage}
            className={i === stage ? "active" : ""}
            aria-current={i === stage ? "step" : undefined}
            onClick={() => setView(i)}
          >
            <span>
              {i < record.stage || record.completedAt ? (
                <Check size={15} />
              ) : (
                i + 1
              )}
            </span>
            {s}
          </button>
        ))}
      </nav>
      <div className="song-dosha-tip">
        <MessageCircle size={20} />
        <p>
          <b>Досша:</b>{" "}
          {
            [
              "Алдымен мәтінмен таныс. Ән аудиосы дайын болғанда бірге тыңдаймыз.",
              "Әр сөзді ашып, оның мағынасы мен мысалын оқы.",
              "Қателесу — үйренудің бір бөлігі. Түсіндірмені оқып, қайта байқап көр.",
              "Өз қарқыныңмен айт. Мен кәсіби айтылым бағасын қоймаймын.",
              "Енді жаңа сөздерді өз өміріңмен байланыстырып көр.",
              "Бүгінгі сөздерді қайталап, алғашқы жетістігіңді белгіле!",
            ][stage]
          }
        </p>
      </div>
      {stage === 0 && (
        <>
          <h2>Мәтінмен таныс</h2>
          <SongPlayer lesson={lesson} />
          <p className="song-note">
            Өзімізге арналған жаңа оқу мәтіні. Ұсынылған оқу моделі ғылыми
            дәлелденген авторлық әдістеме ретінде сипатталмайды.
          </p>
        </>
      )}
      {stage === 1 && (
        <>
          <h2>Сөзді түсін, сөйлемде қолдан</h2>
          <div className="song-word-tabs">
            {lesson.words.map((x, i) => (
              <button
                key={x.id}
                className={word === i ? "active" : ""}
                onClick={() => setWord(i)}
              >
                {x.word}
                {record.seen.includes(x.id) && <Check size={15} />}
              </button>
            ))}
          </div>
          <article className="song-word-card">
            <span className="overline">БАСТАПҚЫ ТҰЛҒА</span>
            <h2>{w.base}</h2>
            <p>{w.meaning}</p>
            <div className="song-translations">
              <span>RU · {w.ru}</span>
              <span>EN · {w.en}</span>
            </div>
            <blockquote>{w.example}</blockquote>
            <small>Мәтіндегі үлгілер: {w.forms.join(" · ")}</small>
            <div className="song-actions">
              <button
                className="btn primary"
                disabled={learning.busy || record.seen.includes(w.id)}
                onClick={() =>
                  void act({
                    type: "song-word",
                    lessonId: lesson.id,
                    wordId: w.id,
                  })
                }
              >
                {record.seen.includes(w.id)
                  ? "✓ Қарап шықтым"
                  : "Мағынасын түсіндім"}
              </button>
              <button
                className="btn ghost"
                disabled={
                  !lang.ready ||
                  lang.busy ||
                  !!lang.state.vocabulary[w.id] ||
                  (!lang.demo && !lang.signedIn)
                }
                onClick={() =>
                  void lang.dispatch({
                    type: "save-word",
                    wordId: w.id,
                    source: "lesson",
                  })
                }
              >
                <BookOpen size={16} />
                {lang.state.vocabulary[w.id]
                  ? "✓ Сөздікке қосылды"
                  : "Менің сөздеріме қосу"}
              </button>
            </div>
            {lang.error && <p role="alert">{lang.error}</p>}
          </article>
          <details className="song-grammar" open>
            <summary>Сөйлем үлгісі</summary>
            <p>{lesson.grammar}</p>
          </details>
          <h3>Мәтіндегі сөзді бас</h3>
          <div className="song-annotated">
            {lesson.lyrics.map((line, i) => (
              <p key={i}>
                {line.text.split(/(\s+|[.,!?—])/u).map((part, j) => {
                  const n = lesson.words.findIndex((w) =>
                    w.forms.some((f) => f.toLowerCase() === part.toLowerCase()),
                  );
                  return n >= 0 ? (
                    <button key={j} onClick={() => setWord(n)}>
                      {part}
                    </button>
                  ) : (
                    <span key={j}>{part}</span>
                  );
                })}
              </p>
            ))}
          </div>
        </>
      )}
      {stage === 2 && (
        <>
          <h2>Ойнап бекіт</h2>
          {availableTasks(lesson.id).map((task) => (
            <div key={task.id}>
              {task.kind === "listening" && <SongPlayer lesson={lesson} />}
              <SongGame
                task={task}
                saved={record.answers[task.id]}
                busy={learning.busy}
                onAnswer={(answer) =>
                  act({
                    type: "song-answer",
                    lessonId: lesson.id,
                    taskId: task.id,
                    answer,
                  })
                }
              />
            </div>
          ))}
          {!lesson.audio && (
            <p className="song-audio-notice">
              ♫ Тыңдалған үзінді бойынша тапсырма аудио дайын болғанда ашылады.
              Қазір төрт мәтіндік ойын қолжетімді.
            </p>
          )}
        </>
      )}
      {stage === 3 && (
        <>
          <h2>{lesson.audio ? "Бірге айт" : "Дауыстап оқып жаттық"}</h2>
          <p>{lesson.speaking}</p>
          <SongPlayer lesson={lesson} karaoke />
          <SongRecorder onTranscript={setSpeech} />
          <label className="song-label">
            Айтқан сөйлемің немесе мәтіндік жаттығуың
            <textarea
              value={(speech ?? record.speech) || ""}
              onChange={(e) => setSpeech(e.target.value)}
              maxLength={700}
              placeholder="Сөйлемді өзің жазып та жаттыға аласың."
            />
          </label>
          <button
            className="btn primary"
            disabled={
              learning.busy ||
              ((speech ?? record.speech) || "").trim().length < 3
            }
            onClick={() =>
              void act({
                type: "song-speech",
                lessonId: lesson.id,
                text: (speech ?? record.speech) || "",
              })
            }
          >
            {record.speech ? "Жаттығуды жаңарту" : "Жаттығуды сақтау"}
          </button>
          <p className="song-note">
            Мәтіннің сақталуы — жаттығуды орындау белгісі. Айтылым дәлдігі
            бағаланбайды.
          </p>
        </>
      )}
      {stage === 4 && (
        <>
          <h2>Өз өміріңде қолдан</h2>
          <ol className="song-prompts">
            {lesson.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <label className="song-label">
            Өзің туралы 2–3 сөйлем
            <textarea
              value={(writing ?? record.writing) || ""}
              maxLength={1800}
              onChange={(e) => setWriting(e.target.value)}
              placeholder="Әндегі кемінде бір сөзді қолдан. Сөйлем соңына нүкте қой."
            />
          </label>
          <div className="song-actions">
            <button
              className="btn primary"
              disabled={
                learning.busy ||
                !enoughWriting((writing ?? record.writing) || "", lesson.id)
              }
              onClick={() =>
                void act({
                  type: "song-writing",
                  lessonId: lesson.id,
                  text: (writing ?? record.writing) || "",
                })
              }
            >
              {record.writing
                ? "✓ Жауап сақталды · жаңарту"
                : "Өз сөйлемдерімді сақтау"}
            </button>
            <button
              className="btn ghost"
              disabled={
                sending ||
                !(writing ?? record.writing) ||
                !enoughWriting((writing ?? record.writing) || "", lesson.id)
              }
              onClick={() => void coach()}
            >
              {sending ? "Досша ойланып жатыр…" : "Досшадан көмек сұрау"}
            </button>
          </div>
          {record.writing && <p role="status">✓ Өз сөйлемдерің сақталды.</p>}
          {reply && (
            <div className="song-chat">
              <b>Досша</b>
              <p>{reply}</p>
              <small>{chatMode}</small>
            </div>
          )}
          <p className="song-note">
            Досша сервисі жауап бермесе де, сөйлемдеріңді сақтап, сабақты
            жалғастыра аласың. Сақтау тек сөйлем саны мен сабақ сөзінің
            қолданылуын тексереді.
          </p>
        </>
      )}
      {stage === 5 && (
        <>
          <h2>
            {record.completedAt ? "Сабағың аяқталды!" : "Сөздерді қайтала"}
          </h2>
          <div className="song-summary">
            <span>✓ {lesson.words.length} сөзбен таныстың</span>
            <span>
              ✓{" "}
              {
                availableTasks(lesson.id).filter(
                  (t) => record.answers[t.id]?.correct,
                ).length
              }{" "}
              ойынды орындадың
            </span>
            <span>✓ Өз сөйлемдеріңді құрдың</span>
          </div>
          <p>
            Жаттыққан сөздер: {lesson.words.map((w) => w.word).join(", ")}. Бұл
            — сөзді толық меңгердің деген кәсіби баға емес.
          </p>
          {lesson.checks.map((c, i) => (
            <article className="song-check" key={i}>
              <h3>{c.prompt}</h3>
              <div className="song-actions">
                {c.options.map((o) => (
                  <button
                    key={o}
                    className="btn ghost"
                    disabled={
                      learning.busy ||
                      record.checks.includes(i) ||
                      !!record.completedAt
                    }
                    onClick={async () => {
                      if (
                        (await act({
                          type: "song-check",
                          lessonId: lesson.id,
                          index: i,
                          answer: o,
                        })) &&
                        o !== c.answer
                      )
                        setError(`↻ ${c.explanation}`);
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {record.checks.includes(i) && (
                <p role="status">✓ Дұрыс. {c.explanation}</p>
              )}
            </article>
          ))}
          <div className="song-word-status">
            <section>
              <h3>✓ Тапсырмада бекіткен сөздер</h3>
              <p>
                {wordStatus.practiced.map((w) => w.word).join(", ") ||
                  "Сөзді қайталау арқылы бекіте аласың."}
              </p>
            </section>
            <section>
              <h3>↻ Қайталау қажет</h3>
              <p>
                {wordStatus.needsReview.map((w) => w.word).join(", ") ||
                  "Соңғы жауаптарда қайталауды қажет ететін сөз жоқ."}
              </p>
            </section>
            {wordStatus.readOnly.length > 0 && (
              <section>
                <h3>Оқып танысқан сөздер</h3>
                <p>
                  {wordStatus.readOnly.map((w) => w.word).join(", ")}. Оларды өз
                  сөйлеміңде тағы қолданып көр.
                </p>
              </section>
            )}
          </div>
          <SongReviews lessonId={lesson.id} />
          {record.completedAt ? (
            <div className="song-completed" role="status">
              <h3>✓ +{record.xp} XP сақталды</h3>
              <p>Бұл сабақтың марапаты қайта берілмейді.</p>
              {nextLesson && (
                <Link
                  className="btn primary"
                  href={`/learn/songs/${nextLesson.id}`}
                >
                  Келесі сабақ <ArrowRight size={17} />
                </Link>
              )}
              <Link className="btn ghost" href="/learn/songs">
                Әндерге қайту
              </Link>
            </div>
          ) : (
            <button
              className="btn primary"
              disabled={
                learning.busy || record.checks.length !== lesson.checks.length
              }
              onClick={() =>
                void act({ type: "song-finish", lessonId: lesson.id })
              }
            >
              Сабақты аяқтау · +20 XP
            </button>
          )}
        </>
      )}
      {(error || learning.error) && (
        <p role="alert" className="song-error">
          {error || learning.error}
        </p>
      )}
      {stage < 5 && (
        <footer className="song-next">
          {view !== null && view < record.stage ? (
            <button className="btn primary" onClick={() => setView(null)}>
              Ағымдағы кезеңге оралу <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="btn primary"
              disabled={
                learning.busy ||
                (stage === 1 && record.seen.length < lesson.words.length) ||
                (stage === 2 &&
                  availableTasks(lesson.id)
                    .filter(
                      (t) => record.contentVersion === 2 || t.id !== "read",
                    )
                    .some((t) => !record.answers[t.id]?.correct)) ||
                (stage === 3 && !record.speech) ||
                (stage === 4 && !record.writing)
              }
              onClick={async () => {
                if (await act({ type: "song-next", lessonId: lesson.id }))
                  setView(null);
              }}
            >
              {stage === 0
                ? lesson.audio
                  ? "Тыңдадым, жалғастыру"
                  : "Мәтінді оқыдым, жалғастыру"
                : `Келесі кезең: ${stages[stage + 1]}`}{" "}
              <ArrowRight size={17} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
