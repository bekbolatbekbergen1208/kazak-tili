"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SongLesson } from "@/lib/songs/types";
import {
  compareSpeech,
  syncedLine,
  validTimings,
  validWordTimings,
} from "@/lib/songs/practice";
import { songsOf } from "@/lib/songs/state";
import { useLearning } from "@/components/learning/provider";
import { useLanguage } from "@/components/literary/provider";
import { SongRecorder } from "./media";
export const modeTitles = {
  find: "Сөзді тап",
  karaoke: "Караоке",
  speak: "Өзің айт — тексер",
};
export type SongMode = keyof typeof modeTitles;
export function SongModes({
  lesson,
  mode,
}: {
  lesson: SongLesson;
  mode: SongMode;
}) {
  const learning = useLearning(),
    language = useLanguage();
  const record = songsOf(learning.state).lessons[lesson.id];
  const tasks = lesson.wordFind ?? [],
    excerpts = lesson.excerpts ?? [];
  const [step, setStep] = useState(0),
    [excerptIndex, setExcerptIndex] = useState(0),
    [exercise, setExercise] = useState("solo"),
    [variant, setVariant] = useState("vocal"),
    [active, setActive] = useState(-1),
    [manualLine, setManualLine] = useState(0),
    [time, setTime] = useState(0),
    [rate, setRate] = useState(1),
    [waiting, setWaiting] = useState(false),
    [answer, setAnswer] = useState(""),
    [input, setInput] = useState("choice"),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState(""),
    [failed, setFailed] = useState(false),
    [blob, setBlob] = useState<Blob | null>(null),
    [consent, setConsent] = useState(false),
    [capability, setCapability] = useState(false),
    [sending, setSending] = useState(false),
    [transcript, setTranscript] = useState(""),
    [confidence, setConfidence] = useState<number>(),
    [source, setSource] = useState<"stt" | "manual">("manual"),
    [checked, setChecked] = useState(false),
    [writing, setWriting] = useState(""),
    [reply, setReply] = useState("");
  const audio = useRef<HTMLAudioElement>(null),
    pendingStart = useRef<number | null>(null),
    stopAt = useRef<number | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    advance = useRef<ReturnType<typeof setTimeout> | null>(null),
    abort = useRef<AbortController | null>(null),
    mounted = useRef(true),
    restored = useRef(false);
  const task = tasks[step],
    excerpt = excerpts[excerptIndex],
    expected = lesson.lyrics[excerpt?.line ?? 0].text;
  const ready = !!lesson.audio && lesson.mediaStatus === "ready" && !failed,
    timed = validTimings(lesson) && !failed;
  const src =
    variant === "instrumental" ? lesson.instrumental?.src : lesson.audio?.src;
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetch("/api/songs/transcribe", { signal: controller.signal })
      .then((r) => r.json())
      .then((b) => {
        if (mounted.current) setCapability(b.available === true);
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
      controller.abort();
      abort.current?.abort();
      if (timer.current) clearTimeout(timer.current);
      if (advance.current) clearTimeout(advance.current);
    };
  }, []);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const first = tasks.findIndex(
      (t) => !record?.modes?.find?.answers[t.id]?.correct,
    );
    setStep(first < 0 ? tasks.length : first);
    const last = record?.modes?.speak?.last;
    if (last) {
      const index = excerpts.findIndex((e) => e.id === last.excerptId);
      if (index >= 0) setExcerptIndex(index);
      setTranscript(last.text);
      setConfidence(last.confidence);
      setSource(last.source);
    }
  }, [record, tasks, excerpts]);
  function pause() {
    audio.current?.pause();
    if (timer.current) clearTimeout(timer.current);
  }
  function play() {
    if (audio.current)
      void audio.current
        .play()
        .catch(() => setError("Ойнату ашылмады. Қайта байқап көр."));
  }
  function armStop() {
    if (timer.current) clearTimeout(timer.current);
    if (!audio.current || stopAt.current === null || audio.current.paused)
      return;
    const milliseconds =
      ((stopAt.current - audio.current.currentTime) /
        audio.current.playbackRate) *
      1000;
    timer.current = setTimeout(
      () => {
        pause();
        if (audio.current && stopAt.current !== null)
          audio.current.currentTime = stopAt.current;
        stopAt.current = null;
        setWaiting(true);
      },
      Math.max(0, milliseconds),
    );
  }
  function seek(line: number, segment = true) {
    const l = lesson.lyrics[line];
    if (
      !ready ||
      !audio.current ||
      l.start === undefined ||
      l.end === undefined
    )
      return;
    setActive(line);
    setWaiting(false);
    setError("");
    audio.current.currentTime = l.start;
    stopAt.current = segment ? l.end : null;
    play();
    armStop();
  }
  async function submit(value: string) {
    if (!task || !waiting) return;
    pause();
    const state = await learning.dispatch({
      type: "song-mode-answer",
      lessonId: lesson.id,
      taskId: task.id,
      answer: value,
    });
    if (!state) {
      setError("Жауап сақталмады. Байланысты тексер.");
      return;
    }
    const correct =
      songsOf(state).lessons[lesson.id].modes?.find?.answers[task.id]?.correct;
    setFeedback(
      correct
        ? `✓ Дұрыс: ${task.answer}. ${lesson.lyrics[task.line].text}`
        : `↻ Қайта тыңда. ${task.explanation}`,
    );
    if (correct) {
      advance.current = setTimeout(() => {
        if (!mounted.current) return;
        setAnswer("");
        setFeedback("");
        setStep(step + 1);
        if (tasks[step + 1]) seek(tasks[step + 1].line);
        else void complete("find");
      }, 1200);
    }
  }
  async function complete(which: SongMode) {
    const state = await learning.dispatch({
      type: "song-mode-complete",
      lessonId: lesson.id,
      mode: which,
      ...(which === "speak"
        ? { excerptId: excerpt.id, text: transcript, confidence, source }
        : {}),
    });
    if (!state)
      setError("Нәтиже сақталмады. Жаттығу шартын және байланысты тексер.");
  }
  async function transcribe() {
    if (!blob || !consent || sending) return;
    setSending(true);
    setError("");
    setChecked(false);
    abort.current = new AbortController();
    const timeout = setTimeout(() => abort.current?.abort(), 35000);
    try {
      const r = await fetch("/api/songs/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "audio/webm",
          "x-audio-consent": "yes",
          "x-song-id": lesson.id,
          "x-excerpt-id": excerpt.id,
        },
        body: blob,
        signal: abort.current.signal,
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error ?? "Тану сервисі жауап бермеді.");
      if (typeof b.text !== "string") throw Error("Тану нәтижесі жарамсыз.");
      if (!mounted.current) return;
      setTranscript(b.text);
      setConfidence(
        typeof b.confidence === "number" ? b.confidence : undefined,
      );
      setSource("stt");
      setChecked(true);
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error && e.name !== "AbortError"
            ? e.message
            : "Тану уақыты бітті немесе желі үзілді. Музыкасыз айтып көр.",
        );
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setSending(false);
    }
  }
  function clearRecording(next: Blob | null) {
    abort.current?.abort();
    setBlob(next);
    setConsent(false);
    setChecked(false);
    setTranscript("");
    setConfidence(undefined);
    setSource("manual");
  }
  async function askDosha() {
    setSending(true);
    setError("");
    try {
      const r = await fetch("/api/ai-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: writing,
          history: [],
          language: "kk",
          song: { lessonId: lesson.id, level: lesson.level },
        }),
      });
      const b = await r.json();
      if (!r.ok || typeof b.reply !== "string")
        throw Error("Досша қазір жауап бермеді. Сөйлеміңді үлгімен салыстыр.");
      setReply(b.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Досша көмегі ашылмады.");
    } finally {
      setSending(false);
    }
  }
  const comparison = checked
    ? compareSpeech(expected, transcript, confidence)
    : null;
  const selected =
    mode === "find" ? task?.line : mode === "speak" ? excerpt?.line : active;
  const current =
    active >= 0
      ? active
      : mode === "karaoke"
        ? manualLine
        : Math.max(selected ?? 0, 0);
  const findRecord = record?.modes?.find;
  return (
    <div className="page song-page song-mode-page">
      <Link href="/learn/songs">← Әндерге оралу</Link>
      <header>
        <span className="pill">
          {lesson.level} · {lesson.topic}
        </span>
        <h1>{lesson.title}</h1>
        <p>{lesson.objective}</p>
      </header>
      <nav className="song-mode-nav" aria-label="Ән режимдері">
        {Object.entries(modeTitles).map(([key, title]) => (
          <Link
            aria-current={mode === key ? "page" : undefined}
            key={key}
            href={`/learn/songs/${lesson.id}/${key}`}
          >
            {title}
          </Link>
        ))}
      </nav>
      <p>
        Тыңда → Сөзді тап → Мағынасын түсін → Бірге айт → Өзің айт → Өмірде
        қолдан. Режимдерді өзің таңда; бәрін бірден аяқтау міндетті емес.
      </p>
      {!ready && (
        <aside className="song-audio-notice">
          <div>
            <b>Аудио режимі — жоба күйінде</b>
            <p>
              Бұл сабақтың аудиосы әзірленіп жатыр. Тыңдалым мен дәл
              синхрондалған караоке әлі жарияланбаған. Мәтінді оқып, өз
              дауысыңды жазуға болады.
            </p>
            <Link href={`/learn/songs/${lesson.id}`}>
              Мәтіндік сабақты ашу →
            </Link>
          </div>
        </aside>
      )}
      {ready && src && (
        <section className="song-mode-audio" aria-label="Ортақ ән плеері">
          <audio
            ref={audio}
            controls
            preload="metadata"
            src={src}
            onLoadedMetadata={() => {
              if (audio.current) audio.current.playbackRate = rate;
              if (pendingStart.current !== null) {
                const line = pendingStart.current;
                pendingStart.current = null;
                if (audio.current)
                  audio.current.currentTime = lesson.lyrics[line].start ?? 0;
                play();
              }
            }}
            onPlay={armStop}
            onPause={() => {
              if (timer.current) clearTimeout(timer.current);
            }}
            onSeeked={armStop}
            onRateChange={armStop}
            onEnded={() => {
              pause();
              setWaiting(true);
            }}
            onError={() => {
              pause();
              setFailed(true);
              setError("Аудио ашылмады. Мәтіндік жаттығу қолжетімді қалды.");
            }}
            onTimeUpdate={() => {
              const t = audio.current?.currentTime ?? 0;
              setTime(t);
              const synced = syncedLine(lesson, t);
              setActive(synced);
              if (synced >= 0) setManualLine(synced);
              if (stopAt.current !== null && t >= stopAt.current) {
                pause();
                stopAt.current = null;
                setWaiting(true);
              }
            }}
          />
          <div className="song-media-tools">
            <button
              className="btn ghost"
              onClick={() => {
                if (mode === "find" && task) seek(task.line);
                else if (mode === "speak") seek(excerpt.line);
                else if (audio.current) {
                  audio.current.currentTime = 0;
                  stopAt.current = null;
                  play();
                }
              }}
            >
              Қайта тыңдау
            </button>
            <label>
              Жылдамдық{" "}
              <select
                aria-label="Ойнату жылдамдығы"
                value={rate}
                onChange={(e) => {
                  setRate(Number(e.target.value));
                  if (audio.current)
                    audio.current.playbackRate = Number(e.target.value);
                }}
              >
                {[0.75, 1, 1.25].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
            {lesson.instrumental && (
              <label>
                Аудио нұсқасы
                <select
                  aria-label="Аудио нұсқасы"
                  value={variant}
                  onChange={(e) => {
                    pause();
                    stopAt.current = null;
                    setVariant(e.target.value);
                  }}
                >
                  <option value="vocal">Орындаушы дауысы бар үлгі</option>
                  <option value="instrumental">Аспаптық сүйемелдеу</option>
                </select>
              </label>
            )}
          </div>
          <small>
            {variant === "instrumental"
              ? lesson.instrumental?.license
              : lesson.audio?.license}
          </small>
        </section>
      )}
      {!lesson.instrumental && (
        <p className="song-note">Аспаптық сүйемелдеу әлі жоқ.</p>
      )}
      {mode === "find" && (
        <section className="panel song-find">
          <h2>Тыңдап, сөзді тап</h2>
          <p>
            {Math.min(step + 1, tasks.length)}/{tasks.length} тапсырма · Таңдау
            немесе өзің жазу
          </p>
          {!timed && (
            <p role="status">
              Нақты аудио мен жол уақыттары дайын болғанда осы {tasks.length}{" "}
              тапсырма ашылады. Қазір тыңдалым жауабы мен XP есептелмейді.
            </p>
          )}
          {task && (
            <>
              <p className="song-current-line">
                {lesson.lyrics[task.line].text
                  .split(/\s+/)
                  .map((token, i) =>
                    i === task.token
                      ? feedback.startsWith("✓")
                        ? task.answer
                        : "____"
                      : token,
                  )
                  .join(" ")}
              </p>
              {timed && (
                <>
                  <button
                    className="btn primary"
                    onClick={() => seek(task.line)}
                  >
                    Үзіндіні тыңдау
                  </button>
                  <label>
                    Жауап тәсілі
                    <select
                      aria-label="Жауап тәсілі"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    >
                      <option value="choice">Төрт нұсқадан таңдау</option>
                      <option value="write">Естіген сөзді жазу</option>
                    </select>
                  </label>
                  {!waiting && (
                    <p>Жол аяқталғанда ойнату кідіреді де, жауап ашылады.</p>
                  )}
                  {input === "choice" ? (
                    <div className="song-find-options">
                      {[...task.options]
                        .sort((a, b) =>
                          `${task.id}${a}`.localeCompare(
                            `${task.id}${b}`,
                            "kk",
                          ),
                        )
                        .map((option) => (
                          <button
                            className="btn ghost"
                            key={option}
                            disabled={
                              !waiting ||
                              learning.busy ||
                              feedback.startsWith("✓")
                            }
                            onClick={() => void submit(option)}
                          >
                            {option}
                          </button>
                        ))}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void submit(answer);
                      }}
                    >
                      <label>
                        Естіген сөз
                        <input
                          aria-label="Естіген сөз"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          maxLength={100}
                        />
                      </label>
                      <button
                        className="btn primary"
                        disabled={!waiting || !answer.trim() || learning.busy}
                      >
                        Жауапты тексеру
                      </button>
                    </form>
                  )}
                </>
              )}
              {task.wordId && findRecord?.answers[task.id]?.correct && (
                <button
                  className="btn ghost"
                  disabled={
                    !!language.state.vocabulary[task.wordId] || language.busy
                  }
                  onClick={() =>
                    void language.dispatch({
                      type: "save-word",
                      wordId: task.wordId!,
                      source: "lesson",
                    })
                  }
                >
                  Менің сөздеріме қосу
                </button>
              )}
            </>
          )}
          {feedback && <p role="status">{feedback}</p>}
          {step >= tasks.length && timed && (
            <>
              <h3>✓ Сөз табу тапсырмалары аяқталды</h3>
              <button
                className="btn ghost"
                onClick={() => {
                  setStep(0);
                  setFeedback("");
                  setAnswer("");
                  setWaiting(false);
                }}
              >
                Тапсырмаларды қайта ойнау · қосымша XP жоқ
              </button>
              {!findRecord?.completedAt && (
                <button
                  className="btn primary"
                  onClick={() => void complete("find")}
                >
                  Нәтижені сақтау
                </button>
              )}
            </>
          )}
        </section>
      )}
      {mode === "karaoke" && (
        <section className="panel song-karaoke-window">
          <h2>Бірге айт</h2>
          <p>
            {timed
              ? "Жол нақты аудио уақытымен белгіленеді."
              : "Бұл — мәтіндік дайындық. Нақты уақытпен синхрондау жоқ."}
          </p>
          {current > 0 && (
            <p className="song-neighbour-line">
              {lesson.lyrics[current - 1]?.text}
            </p>
          )}
          <p className="song-current-line">
            {validWordTimings(lesson.lyrics[current]) && timed
              ? lesson.lyrics[current].words!.map((w, i) => (
                  <span
                    key={i}
                    className={
                      time >= w.start && time < w.end ? "song-active-word" : ""
                    }
                  >
                    {w.text}{" "}
                  </span>
                ))
              : lesson.lyrics[current]?.text}
          </p>
          <p className="song-neighbour-line">
            {lesson.lyrics[current + 1]?.text}
          </p>
          <div className="song-lyrics">
            {lesson.lyrics.map((l, i) => (
              <button
                key={i}
                aria-pressed={current === i}
                onClick={() => {
                  setActive(i);
                  setManualLine(i);
                  if (timed) seek(i, false);
                }}
              >
                {i + 1}. {l.text}
              </button>
            ))}
          </div>
          <SongRecorder
            onTranscript={() => {}}
            allowBrowserRecognition={false}
          />
          {ready && (
            <button
              className="btn primary"
              disabled={learning.busy || !!record?.modes?.karaoke}
              onClick={() => void complete("karaoke")}
            >
              Бірге айтып жаттықтым · қатысуды сақтау
            </button>
          )}
        </section>
      )}
      {mode === "speak" && (
        <section className="panel song-speaking">
          <h2>Өзің айт — тексер</h2>
          <label>
            Жаттығу
            <select
              aria-label="Айту жаттығуы"
              value={exercise}
              onChange={(e) => {
                pause();
                setExercise(e.target.value);
              }}
            >
              <option value="solo">Жолды айтып көр</option>
              {lesson.instrumental && ready && (
                <option value="with-music">Караокемен жаз</option>
              )}
            </select>
          </label>
          <label>
            Үзінді
            <select
              aria-label="Айту үзіндісі"
              value={excerptIndex}
              disabled={sending}
              onChange={(e) => {
                pause();
                setExcerptIndex(Number(e.target.value));
                setTranscript("");
                setChecked(false);
                setBlob(null);
                setConsent(false);
              }}
            >
              {excerpts.map((x, i) => (
                <option key={x.id} value={i}>
                  {lesson.lyrics[x.line].text}
                </option>
              ))}
            </select>
          </label>
          <p className="song-current-line">{expected}</p>
          {timed && (
            <button className="btn ghost" onClick={() => seek(excerpt.line)}>
              Үлгі жолды тыңдау
            </button>
          )}
          <SongRecorder
            key={`${excerpt.id}-${exercise}`}
            onTranscript={() => {}}
            allowBrowserRecognition={false}
            onRecording={clearRecording}
            onRecordingStart={() => {
              if (exercise === "solo") pause();
              else {
                stopAt.current = null;
                if (variant === "instrumental") seek(excerpt.line, false);
                else {
                  pendingStart.current = excerpt.line;
                  setVariant("instrumental");
                }
              }
            }}
          />
          <p>
            {capability
              ? "Қазақша тану сервисі қосылған. Ол мәтінді таниды; айтылымды бағаламайды."
              : "Қазақша тану сервисі қосылмаған. Браузерде қазақша тану барлық құрылғыда расталмаған, сондықтан автоматты нәтиже көрсетілмейді."}
          </p>
          {capability && blob && (
            <div className="song-stt-consent">
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />{" "}
                Жазбамды қазақша мәтінге айналдыру үшін серверге және оның тану
                провайдеріне жіберуге келісемін. QazaqDos жазбаны ұзақ мерзімге
                сақтамайды; уақытша файл тек тексеруге қолданылады.
              </label>
              <button
                className="btn primary"
                disabled={!consent || sending}
                onClick={() => void transcribe()}
              >
                {sending ? "Мәтін танылып жатыр…" : "Жазбаны тануға жіберу"}
              </button>
            </div>
          )}
          <label>
            Өзің тыңдап жазған мәтін / танылған мәтін
            <textarea
              aria-label="Салыстырылатын мәтін"
              value={transcript}
              maxLength={700}
              onChange={(e) => {
                setTranscript(e.target.value);
                setConfidence(undefined);
                setSource("manual");
                setChecked(false);
              }}
            />
          </label>
          <button
            className="btn ghost"
            disabled={!transcript.trim() || sending}
            onClick={() => setChecked(true)}
          >
            Мәтіндерді салыстыру
          </button>
          {comparison && (
            <section className="song-comparison" aria-label="Мәтін сәйкестігі">
              <h3>Танылған сөздердің сәйкестігі</h3>
              <p>Күтілетін мәтін: {expected}</p>
              <p>
                {source === "stt" ? "Танылған мәтін" : "Өзің енгізген мәтін"}:{" "}
                {transcript || "Мәтін танылмады"}
              </p>
              <p>
                Бұл — мәтін салыстыру. Кәсіби айтылым, акцент немесе ән айту
                сапасының бағасы емес.
              </p>
              <p>
                {confidence === undefined
                  ? "Тану сенімділігі берілмеген; нәтижені үлгімен және өз жазбаңмен салыстыр."
                  : confidence < 0.65
                    ? "Тану сенімділігі төмен."
                    : "Тану сервисі мәтін нәтижесін жеткілікті сенімді деп белгіледі."}
              </p>
              {comparison.uncertain ? (
                <p role="status">
                  Бұл үзіндіні анық тани алмадық. Музыкасыз айтып көр.
                  Танылмаған сөз сенің қатең екенін білдірмейді.
                </p>
              ) : (
                <ul>
                  {comparison.words.map((w, i) => (
                    <li key={i}>
                      <b>
                        {w.status === "matched"
                          ? "✓ Сәйкес"
                          : w.status === "missing"
                            ? "? Түсіп қалған"
                            : w.status === "extra"
                              ? "+ Артық танылған"
                              : "↻ Өзгеше танылған"}
                      </b>
                      : {w.expected ?? "—"}
                      {w.recognized && w.status !== "matched"
                        ? ` → ${w.recognized}`
                        : ""}
                      {w.status !== "matched" &&
                        w.expected &&
                        ` · «${w.expected}» сөзін қайта айтып көр. Үлгіні тыңда.`}
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="btn primary"
                disabled={learning.busy || !transcript.trim()}
                onClick={() => void complete("speak")}
              >
                Айту жаттығуына қатысуды сақтау
              </button>
            </section>
          )}
        </section>
      )}
      <section className="panel song-mode-result">
        <h2>Менің нәтижем</h2>
        <p>
          Дұрыс табылған сөздер:{" "}
          {tasks
            .filter((t) => findRecord?.answers[t.id]?.correct)
            .map((t) => t.answer)
            .join(" · ") || "Әлі жоқ"}
        </p>
        <p>
          Қайта жаттықтыратын сөздер:{" "}
          {tasks
            .filter(
              (t) =>
                findRecord?.answers[t.id] && !findRecord.answers[t.id].correct,
            )
            .map((t) => t.answer)
            .join(" · ") || "Әлі белгіленбеген"}
        </p>
        <p>
          Сөздікке сақталған сөздер:{" "}
          {lesson.words
            .filter((w) => language.state.vocabulary[w.id])
            .map((w) => w.word)
            .join(" · ") || "Әлі жоқ"}
        </p>
        <p>
          Орындалған режимдер:{" "}
          {Object.keys(modeTitles)
            .filter((k) => record?.modes?.[k as SongMode]?.completedAt)
            .map((k) => modeTitles[k as SongMode])
            .join(" · ") || "Әлі жоқ"}
        </p>
        <p>
          Режим XP:{" "}
          {Object.values(record?.modes ?? {}).reduce(
            (n, m) => n + (m?.xp ?? 0),
            0,
          )}{" "}
          · Жалпы {learning.state.progress.xp} XP
        </p>
        <p>
          Қайталап ашқанда осы режимнің XP-і қайта берілмейді. Тану сенімсіздігі
          жалпы прогресті төмендетпейді.
        </p>
      </section>
      <section className="panel">
        <h2>Өмірде қолдан</h2>
        <p>
          Досша: {lesson.questions[0]} Әндегі сөздермен өзің туралы екі сөйлем
          құра.
        </p>
        <textarea
          aria-label="Досшаға екі сөйлем"
          value={writing}
          maxLength={1800}
          onChange={(e) => setWriting(e.target.value)}
        />
        <button
          className="btn primary"
          disabled={sending || writing.trim().length < 10}
          onClick={() => void askDosha()}
        >
          Досшамен қолдану
        </button>
        {reply && <p role="status">{reply}</p>}
        <Link href={`/learn/songs/${lesson.id}`}>
          Толық сабақ пен қайталауды ашу →
        </Link>
      </section>
      <small>{lesson.rights?.text}</small>
      {error && (
        <p role="alert" className="song-error">
          {error}
        </p>
      )}
    </div>
  );
}
