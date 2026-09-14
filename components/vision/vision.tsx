"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraIcon,
  ImagePlus,
  RefreshCcw,
  Volume2,
  Mic,
  BookOpen,
  Square,
} from "lucide-react";
import { useLearning } from "@/components/learning/provider";
import {
  visionCategories,
  visionTasks,
  visionWord,
  visionWords,
  acceptableVisionAnswer,
} from "@/lib/vision/words";
import { visionOf } from "@/lib/vision/state";
import { Mascot } from "@/components/icons";
import { prepareVisionImage } from "@/lib/vision/image";
import type { DetectedObject, VisionResult } from "@/lib/vision/recognize";
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult:
    ((e: { results: { 0: { 0: { transcript: string } } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionCtor = new () => RecognitionLike;
export function VisionLab() {
  const { state, dispatch, busy } = useLearning(),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    file = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const imageVersion = useRef(0);
  const cameraVersion = useRef(0);
  const recognition = useRef<{ stop(): void } | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [analysis, setAnalysis] = useState<VisionResult | null>(null);
  const [selected, setSelected] = useState<DetectedObject | null>(null);
  const [manual, setManual] = useState(false);
  const [availability, setAvailability] = useState("");
  const [status, setStatus] = useState<
      "idle" | "requesting" | "ready" | "captured" | "denied" | "error"
    >("idle"),
    [facing, setFacing] = useState<"environment" | "user">("environment"),
    [image, setImage] = useState(""),
    [wordId, setWordId] = useState(""),
    [confidence, setConfidence] = useState(0),
    [message, setMessage] = useState(""),
    [task, setTask] = useState(visionTasks[0]),
    [answer, setAnswer] = useState(""),
    [listening, setListening] = useState(false);
  const word = visionWord(wordId),
    progress = visionOf(state);
  const stop = () => {
    cameraVersion.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  async function camera(face = facing) {
    imageVersion.current++;
    cancelIdentification();
    setImage("");
    setWordId("");
    setAnalysis(null);
    setSelected(null);
    setStatus("requesting");
    setMessage("");
    stop();
    const version = cameraVersion.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: face },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (version !== cameraVersion.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
      if (version !== cameraVersion.current) return;
      setStatus("ready");
    } catch (e) {
      if (version !== cameraVersion.current) return;
      stop();
      setStatus(
        (e as DOMException).name === "NotAllowedError" ? "denied" : "error",
      );
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/vision", { cache: "no-store", signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((b) =>
        setAvailability(
          b.configured
            ? ""
            : "Автоматты AI тануы өшірілген. Қолмен сөз таңдауға болады.",
        ),
      )
      .catch(() => {});
    const hidden = () => {
      if (document.hidden) {
        stop();
        setStatus((s) => (s === "ready" || s === "requesting" ? "idle" : s));
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
      controller.abort();
      request.current?.abort();
      request.current = null;
      imageVersion.current++;
      recognition.current?.stop();
    };
  }, []);
  function capture() {
    const v = video.current;
    if (!v?.videoWidth) return setMessage("Камера кадры әлі дайын емес.");
    imageVersion.current++;
    const c = document.createElement("canvas"),
      max = 1600,
      scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/jpeg", 0.9);
    setImage(data);
    setStatus("captured");
    stop();
    setMessage("Кадр дайын. Төменнен дұрыс сөзді қолмен таңда.");
  }
  async function identify(data = image) {
    if (!data) return;
    request.current?.abort();
    setWordId("");
    setAnalysis(null);
    setSelected(null);
    setAnswer("");
    setManual(false);
    setConfidence(0);
    request.current = null;
    setIdentifying(false);
    setMessage("Автоматты AI тануы өшірілген. Төменнен сөзді қолмен таңда.");
  }
  function cancelIdentification() {
    request.current?.abort();
    request.current = null;
    setIdentifying(false);
  }
  async function upload(f: File) {
    const version = ++imageVersion.current;
    cancelIdentification();
    stop();
    setImage("");
    setWordId("");
    setSelected(null);
    setAnalysis(null);
    setStatus("idle");
    setMessage("Сурет өңделіп жатыр…");
    try {
      const data = await prepareVisionImage(f);
      if (version !== imageVersion.current) return;
      setImage(data);
      setStatus("captured");
      setMessage("Сурет дайын. Төменнен дұрыс сөзді қолмен таңда.");
    } catch (error) {
      if (version === imageVersion.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Сурет ашылмады. Басқа файлды таңда.",
        );
    }
  }
  function speak() {
    const name = word?.kk ?? selected?.kk;
    if (!name || !("speechSynthesis" in window))
      return setMessage("Бұл браузер дыбыстауды қолдамайды.");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(name);
    u.lang = "kk-KZ";
    u.rate = 0.82;
    speechSynthesis.speak(u);
  }
  function listen() {
    const w = window as typeof window & {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!R)
      return setMessage(
        "Дауыспен енгізу бұл браузерде жоқ. Жауапты мәтінмен жаз.",
      );
    recognition.current?.stop();
    const r = new R();
    recognition.current = r;
    r.lang = "kk-KZ";
    r.interimResults = false;
    r.onresult = (e) => setAnswer(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setMessage("Дауысты тану мүмкін болмады.");
    };
    setListening(true);
    try {
      r.start();
    } catch {
      setListening(false);
      setMessage("Дауысты тану іске қосылмады.");
    }
  }
  async function submit() {
    if (!word) return;
    if (!acceptableVisionAnswer(word, task, answer)) {
      setMessage(
        task === visionTasks[3]
          ? `Көпше түрінде «${word.plural}» деп жаз. Қайта байқап көр!`
          : "Жауапты қазақша толықтыр. Мысалды байқап, қайта көр.",
      );
      return;
    }
    const result = await dispatch({
      type: "vision-answer",
      wordId: word.id,
      task,
      answer,
    });
    if (result) {
      setMessage(
        `Жарайсың! «${word.kk}» коллекцияға қосылды. +${word.xp} XP · +2 тиын`,
      );
    }
  }
  function reset() {
    imageVersion.current++;
    cancelIdentification();
    stop();
    recognition.current?.stop();
    setAnalysis(null);
    setSelected(null);
    setManual(false);
    setImage("");
    setWordId("");
    setAnswer("");
    setMessage("");
    setStatus("idle");
    setTask(visionTasks[Math.floor(Math.random() * visionTasks.length)]);
  }
  return (
    <section className="vs-page" lang="kk">
      <header className="vs-hero">
        <div>
          <span>ДОСША VISION</span>
          <h1>Айналаңдағы қазақ тілі</h1>
          <p>Затты камерамен көр, қазақша атауын үйрен де, сөйлемде қолдан.</p>
        </div>
        <Mascot />
      </header>
      <div className="vs-privacy">
        <strong>🔒 Құпиялық</strong>
        <p>
          Камера тек рұқсатыңмен қосылады. Түсірілген немесе жүктелген кадр
          сыртқы AI қызметіне жіберілмейді. Сайт суретті базаға, логқа немесе
          аналитикаға сақтамайды. Жеке құжаттарды жүктеме.
        </p>
      </div>
      {availability && (
        <p className="vs-availability" role="status">
          {availability}
        </p>
      )}
      <div className="vs-layout">
        <div>
          <div className={`vs-camera ${status}`} data-identifying={identifying}>
            <video
              ref={video}
              playsInline
              muted
              aria-label="Камераның тікелей көрінісі"
            />
            <>{image && <img src={image} alt="Таңдалған кадр" />}</>
            {identifying && <div className="vs-scan" aria-hidden="true" />}
            {!image && (
              <div className="vs-guide">
                <span />
                <p>Затты жақтаудың ортасына орналастыр</p>
              </div>
            )}
            {status === "idle" && (
              <div className="vs-placeholder">
                <Camera size={52} />
                <h2>Камера дайын</h2>
                <p>Алдымен рұқсат беру керек.</p>
              </div>
            )}
            {status === "requesting" && (
              <div className="vs-placeholder" role="status">
                <span className="vs-spinner" />
                <p>Камера ашылып жатыр…</p>
              </div>
            )}
          </div>
          <div className="vs-actions">
            {status === "idle" || status === "denied" || status === "error" ? (
              <button className="btn primary" onClick={() => void camera()}>
                <CameraIcon /> Камераны қосу
              </button>
            ) : status === "ready" ? (
              <>
                <button className="btn primary" onClick={capture}>
                  <Camera /> Кадр түсіру
                </button>
                <button
                  className="btn ghost"
                  onClick={() => {
                    const next =
                      facing === "environment" ? "user" : "environment";
                    setFacing(next);
                    void camera(next);
                  }}
                >
                  <RefreshCcw /> Камераны ауыстыру
                </button>
              </>
            ) : (
              <button className="btn ghost" onClick={reset}>
                <RefreshCcw /> Басқа затты қарау
              </button>
            )}
            <button className="btn ghost" onClick={() => file.current?.click()}>
              <ImagePlus /> Сурет жүктеу
            </button>
            {identifying && (
              <button
                className="btn ghost"
                onClick={() => {
                  cancelIdentification();
                  setMessage("Тану тоқтатылды.");
                }}
              >
                <Square /> Тоқтату
              </button>
            )}
            <input
              ref={file}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
          </div>
          {status === "denied" && (
            <p className="vs-error" role="alert">
              Камераға рұқсат берілмеді. Браузер баптауынан рұқсат бер немесе
              сурет жүкте.
            </p>
          )}
          {status === "error" && (
            <p className="vs-error" role="alert">
              Камера қолжетімсіз. Басқа камераны немесе сурет жүктеуді қолдан.
            </p>
          )}
        </div>
        <aside className="vs-result" aria-busy={identifying}>
          <div className="vs-dossha">
            <Mascot />
            <div>
              <strong>Досша</strong>
              <p aria-live="polite">
                {message || "Сәлем! Бүгін айналаңнан қандай жаңа сөз табамыз?"}
              </p>
            </div>
          </div>
          {analysis && (
            <div className="vs-analysis">
              <p>{analysis.summary}</p>
              {analysis.tip && <p className="vs-tip">{analysis.tip}</p>}
              {analysis.objects.length > 1 && (
                <label>
                  Кадрдағы зат
                  <select
                    aria-label="Кадрдағы зат"
                    value={selected ? analysis.objects.indexOf(selected) : -1}
                    onChange={(e) => {
                      const object = analysis.objects[Number(e.target.value)];
                      if (!object) return;
                      setSelected(object);
                      setWordId(object.id ?? "");
                      setConfidence(object.confidence);
                      setManual(false);
                      setAnswer("");
                      setMessage(`Меніңше, бұл — ${object.kk}. Дұрыс па?`);
                    }}
                  >
                    <option value={-1} disabled>
                      Затты таңда
                    </option>
                    {analysis.objects.map((object, i) => (
                      <option key={i} value={i}>
                        {object.kk}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {selected && !word && (
            <div className="vs-discovery">
              <p className="vs-kicker">
                {selected.confidence < 0.7
                  ? "БОЛЖАМ · ТЕКСЕР"
                  : "ҚОЛМЕН ТАҢДАЛҒАН"}
              </p>
              <div className="vs-word">
                <h2>{selected.kk}</h2>
                <button
                  aria-label={`${selected.kk} сөзін дыбыстау`}
                  onClick={speak}
                >
                  <Volume2 />
                </button>
              </div>
              <p>
                {selected.ru} · {selected.en}
              </p>
              <p>Көпше түрі: {selected.plural}</p>
              <p>{selected.description}</p>
              <div className="vs-example">
                <small>Сөйлем үлгісі</small>
                <p>{selected.example}</p>
              </div>
            </div>
          )}
          {image && !word && !identifying && (
            <ManualWords
              onSelect={(id) => {
                setWordId(id);
                setSelected(null);
                setAnswer("");
                setManual(true);
                setMessage("Сөзді растадың. Енді қазақша тапсырманы орында!");
              }}
            />
          )}
          {word && (
            <>
              <p className="vs-kicker">
                {manual
                  ? "ӨЗІҢ РАСТАҒАН ЗАТ"
                  : confidence < 0.7
                    ? "СЕНІМСІЗ НӘТИЖЕ · РАСТА"
                    : "ҚОЛМЕН ТАҢДАЛҒАН"}
              </p>
              <div className="vs-word">
                <div>
                  <h2>{word.kk}</h2>
                  <p>
                    {word.pronunciation} · {word.plural}
                  </p>
                </div>
                <button
                  aria-label={`${word.kk} сөзін дыбыстау`}
                  onClick={speak}
                >
                  <Volume2 />
                </button>
              </div>
              <p>
                🇷🇺 {word.ru} · 🇬🇧 {word.en}
              </p>
              {selected && <p>{selected.description}</p>}
              <ManualWords
                onSelect={(id) => {
                  setWordId(id);
                  setSelected(null);
                  setManual(true);
                  setAnswer("");
                  setMessage("Сөзді растадың.");
                }}
                initiallyOpen={!manual && confidence < 0.7}
              />
              <div className="vs-example">
                <small>Сөйлем үлгісі</small>
                <p>{word.easy}</p>
              </div>
              <label>
                Тапсырма
                <select
                  value={task}
                  onChange={(e) => {
                    setTask(e.target.value);
                    setAnswer("");
                  }}
                >
                  {visionTasks.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Жауабың
                <div className="vs-input">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Қазақша жауап жаз…"
                    maxLength={500}
                  />
                  <button
                    aria-label="Дауыспен жауап беру"
                    aria-pressed={listening}
                    onClick={listen}
                  >
                    <Mic />
                  </button>
                </div>
              </label>
              <button
                className="btn primary"
                disabled={busy || answer.trim().length < 2}
                onClick={() => void submit()}
              >
                Жауапты тексеру
              </button>
            </>
          )}
        </aside>
      </div>
      <Collection progress={progress} />
    </section>
  );
}
function ManualWords({
  onSelect,
  initiallyOpen = true,
}: {
  onSelect: (id: string) => void;
  initiallyOpen?: boolean;
}) {
  const [q, setQ] = useState("");
  return (
    <details className="vs-manual" open={initiallyOpen}>
      <summary>Дұрыс затты қолмен растау</summary>
      <input
        aria-label="Затты іздеу"
        placeholder="Мысалы: кітап"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div>
        {visionWords
          .filter(
            (w) =>
              !q ||
              `${w.kk} ${w.ru} ${w.en}`.toLowerCase().includes(q.toLowerCase()),
          )
          .map((w) => (
            <button key={w.id} onClick={() => onSelect(w.id)}>
              {w.kk}
            </button>
          ))}
      </div>
    </details>
  );
}
function Collection({ progress }: { progress: ReturnType<typeof visionOf> }) {
  return (
    <section className="vs-collection">
      <div>
        <BookOpen />
        <div>
          <span>МЕНІҢ КОЛЛЕКЦИЯМ</span>
          <h2>Менің айналамдағы қазақ тілі</h2>
        </div>
        <strong>
          {Object.keys(progress.words).length} / {visionWords.length}
        </strong>
      </div>
      {visionCategories.map((c) => {
        const words = visionWords.filter((w) => w.category === c),
          found = words.filter((w) => progress.words[w.id]?.tasks.length);
        return (
          <article key={c}>
            <h3>
              {progress.badges.includes(c) ? "🏅 " : ""}
              {c}
            </h3>
            <progress max={words.length} value={found.length} />
            <p>
              {found.length} / {words.length}
            </p>
            <div>
              {words.map((w) => (
                <span
                  key={w.id}
                  className={progress.words[w.id]?.tasks.length ? "found" : ""}
                >
                  {progress.words[w.id]?.tasks.length ? "✓ " : ""}
                  {w.kk}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
