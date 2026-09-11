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
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  async function camera(face = facing) {
    setStatus("requesting");
    setMessage("");
    stop();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: face },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
      setStatus("ready");
    } catch (e) {
      setStatus(
        (e as DOMException).name === "NotAllowedError" ? "denied" : "error",
      );
    }
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        stop();
        setStatus((s) => (s === "ready" ? "idle" : s));
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, []);
  function capture() {
    const v = video.current;
    if (!v?.videoWidth) return setMessage("Камера кадры әлі дайын емес.");
    const c = document.createElement("canvas"),
      max = 960,
      scale = Math.min(1, max / v.videoWidth);
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    const data = c.toDataURL("image/jpeg", 0.78);
    setImage(data);
    setStatus("captured");
    stop();
    void identify(data);
  }
  async function identify(data = image) {
    setMessage("Досша затты қарап жатыр…");
    setWordId("");
    try {
      const r = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data }),
        }),
        b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (b.word) {
        setWordId(b.word.id);
        setConfidence(b.confidence);
        setMessage(
          b.confidence < 0.7
            ? `Меніңше, бұл — ${b.word.kk}. Дұрыс па?`
            : "Зат анықталды. Енді нәтижені растап, тапсырманы орында.",
        );
      } else setMessage("Нәтиже сенімсіз. Төменнен дұрыс сөзді таңда.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Затты тану мүмкін болмады.");
    }
  }
  function upload(f: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 4_000_000)
      return setMessage("JPG, PNG немесе WebP суреті 4 МБ-тан аспасын.");
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setStatus("captured");
      void identify(String(reader.result));
    };
    reader.readAsDataURL(f);
  }
  function speak() {
    if (!word || !("speechSynthesis" in window))
      return setMessage("Бұл браузер дыбыстауды қолдамайды.");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word.kk);
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
    const r = new R();
    r.lang = "kk-KZ";
    r.interimResults = false;
    r.onresult = (e) => setAnswer(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      setMessage("Дауысты тану мүмкін болмады.");
    };
    setListening(true);
    r.start();
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
          Камера тек рұқсатыңнан кейін қосылады. Бір кадр «Затты анықтау»
          батырмасы басылғанда ғана өңделеді; сурет базаға, логқа немесе
          аналитикаға сақталмайды.
        </p>
      </div>
      <div className="vs-layout">
        <div>
          <div className={`vs-camera ${status}`}>
            <video
              ref={video}
              playsInline
              muted
              aria-label="Камераның тікелей көрінісі"
            />
            <>{image && <img src={image} alt="Таңдалған кадр" />}</>
            <div className="vs-guide">
              <span />
              <p>Затты жақтаудың ортасына орналастыр</p>
            </div>
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
                  <Camera /> Затты анықтау
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
            <input
              ref={file}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
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
        <aside className="vs-result">
          <div className="vs-dossha">
            <Mascot />
            <div>
              <strong>Досша</strong>
              <p aria-live="polite">
                {message ||
                  "Камераны қос немесе сурет жүкте. Мен күнделікті 30 заттың қазақша атауын үйретемін."}
              </p>
            </div>
          </div>
          {image && !word && (
            <ManualWords
              onSelect={(id) => {
                setWordId(id);
                setConfidence(1);
                setMessage("Сөзді растадың. Енді қазақша тапсырманы орында!");
              }}
            />
          )}
          {word && (
            <>
              <p className="vs-kicker">
                {confidence < 0.7
                  ? "СЕНІМСІЗ НӘТИЖЕ · РАСТА"
                  : "АНЫҚТАЛҒАН ЗАТ"}
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
              {confidence < 0.7 && <ManualWords onSelect={setWordId} />}
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
function ManualWords({ onSelect }: { onSelect: (id: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <details className="vs-manual" open>
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
