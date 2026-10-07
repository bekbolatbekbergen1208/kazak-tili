"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Music2, Play, RotateCcw } from "lucide-react";
import type { SongLesson } from "@/lib/songs/types";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export function SongPlayer({
  lesson,
  karaoke = false,
}: {
  lesson: SongLesson;
  karaoke?: boolean;
}) {
  const segmentEnd = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement>(null),
    [active, setActive] = useState(-1),
    [rate, setRate] = useState(1),
    [error, setError] = useState(""),
    [failed, setFailed] = useState(false);
  const seek = (i: number) => {
    const line = lesson.lyrics[i];
    setActive(i);
    if (audio.current && line.start !== undefined) {
      segmentEnd.current = line.end ?? null;
      audio.current.currentTime = line.start;
      void audio.current
        .play()
        .catch(() =>
          setError(
            "Аудионы ойнату мүмкін болмады. Мәтінмен жаттығуды жалғастыр.",
          ),
        );
    }
  };
  return (
    <section className={`song-player ${karaoke ? "karaoke" : ""}`}>
      {lesson.audio && lesson.mediaStatus === "ready" && !failed ? (
        <>
          <audio
            ref={audio}
            controls
            preload="metadata"
            src={lesson.audio.src}
            onError={() => {
              setFailed(true);
              setError("Аудиофайл ашылмады. Мәтінмен жаттығуды жалғастыр.");
            }}
            onTimeUpdate={() => {
              const time = audio.current?.currentTime ?? 0;
              if (segmentEnd.current !== null && time >= segmentEnd.current) {
                audio.current?.pause();
                segmentEnd.current = null;
              }
              setActive(
                lesson.lyrics.findIndex(
                  (l) =>
                    l.start !== undefined &&
                    time >= l.start &&
                    (l.end === undefined || time < l.end),
                ),
              );
            }}
          />
          <div className="song-media-tools">
            <button
              className="btn ghost"
              onClick={() => {
                if (audio.current) {
                  segmentEnd.current = null;
                  audio.current.currentTime = 0;
                  void audio.current
                    .play()
                    .catch(() => setError("Ойнатуды қайта байқап көр."));
                }
              }}
            >
              <RotateCcw size={16} />
              Қайта тыңдау
            </button>
            <label>
              Жылдамдық{" "}
              <select
                value={rate}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setRate(n);
                  if (audio.current) audio.current.playbackRate = n;
                }}
              >
                {[0.75, 1, 1.25].map((n) => (
                  <option value={n} key={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
          </div>
          <small>{lesson.audio.license}</small>
        </>
      ) : (
        <div className="song-audio-notice">
          <Music2 size={24} />
          <div>
            <b>
              {failed
                ? "Аудио қазір қолжетімсіз"
                : "Бұл сабақтың аудиосы әзірленіп жатыр"}
            </b>
            <p>
              Қазір мәтінді оқып, сөздермен және ойындармен жаттыға аласың.
              Әуені бар ән ойнатылмайды.
            </p>
          </div>
        </div>
      )}
      <div className="song-lyrics">
        {lesson.lyrics.map((line, i) => (
          <button
            key={i}
            className={active === i ? "active" : ""}
            onClick={() => seek(i)}
            aria-pressed={active === i}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {line.text}
            {lesson.audio &&
              lesson.mediaStatus === "ready" &&
              !failed &&
              line.start !== undefined && <Play size={16} />}
          </button>
        ))}
      </div>
      <small>
        {lesson.audio && lesson.mediaStatus === "ready" && !failed
          ? "Уақыт белгісі бар жолды басып, жеке тыңдай аласың."
          : "Жолды басып белгіле де, өзің дауыстап оқы. Бұл — мәтіндік жаттығу."}
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function SongRecorder({
  onTranscript,
  onRecording,
  onRecordingStart,
  allowBrowserRecognition = true,
}: {
  onTranscript: (text: string) => void;
  onRecording?: (blob: Blob | null) => void;
  onRecordingStart?: () => void;
  allowBrowserRecognition?: boolean;
}) {
  const mounted = useRef(true),
    requestingRef = useRef(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    chunks = useRef<Blob[]>([]),
    recognition = useRef<Recognition | null>(null),
    urlRef = useRef("");
  const [url, setUrl] = useState(""),
    [recording, setRecording] = useState(false),
    [requesting, setRequesting] = useState(false),
    [recognizing, setRecognizing] = useState(false),
    [error, setError] = useState(""),
    [transcript, setTranscript] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTracks = () => {
    const tracks = stream.current?.getTracks();
    stream.current = null;
    tracks?.forEach((t) => t.stop());
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stopTracks();
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        recognition.current.stop();
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);
  const remove = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
    setUrl("");
    onRecording?.(null);
  };
  async function start() {
    if (requestingRef.current || recorder.current?.state === "recording")
      return;
    setError("");
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Бұл браузерде дауыс жазу қолжетімсіз. Мәтінмен жаттық немесе өзің дауыстап оқы.",
      );
      return;
    }
    requestingRef.current = true;
    setRequesting(true);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!mounted.current) {
        stopTracks();
        return;
      }
      remove();
      chunks.current = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        if (timer.current) clearTimeout(timer.current);
        stopTracks();
        const blob = new Blob(chunks.current, { type: r.mimeType });
        if (!blob.size) {
          setRecording(false);
          setError("Жазба тым қысқа болды. Бір сөйлем айтып, қайта жазып көр.");
          return;
        }
        urlRef.current = URL.createObjectURL(blob);
        setUrl(urlRef.current);
        onRecording?.(blob);
        setRecording(false);
      };
      r.onerror = () => {
        stopTracks();
        if (timer.current) clearTimeout(timer.current);
        setRecording(false);
        setError("Дауыс жазу үзілді. Қайта байқап көр немесе мәтінмен жаттық.");
      };
      r.start(250);
      onRecordingStart?.();
      setRecording(true);
      timer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 60000);
    } catch {
      stopTracks();
      setError(
        "Микрофонға рұқсат берілмеді немесе құрылғы табылмады. Мәтіндік баламаны қолдан.",
      );
    } finally {
      requestingRef.current = false;
      if (mounted.current) setRequesting(false);
    }
  }
  function recognize() {
    setError("");
    const win = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const C = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!C) {
      setError("Сөйлеуді тану бұл браузерде жоқ. Сөйлемді өзің жаза аласың.");
      return;
    }
    try {
      const r = new C();
      recognition.current = r;
      r.lang = "kk-KZ";
      r.continuous = false;
      r.interimResults = false;
      r.onresult = (e) => {
        const text = Array.from(e.results)
          .map((x) => x[0].transcript)
          .join(" ");
        setTranscript(text);
        onTranscript(text);
      };
      r.onerror = () => {
        setRecognizing(false);
        setError(
          "Сөйлеу танылмады. Мәтінді өзің енгіз немесе қайта байқап көр.",
        );
      };
      r.onend = () => setRecognizing(false);
      r.start();
      setRecognizing(true);
    } catch {
      setError("Сөйлеуді тануды іске қосу мүмкін болмады.");
    }
  }
  return (
    <section className="song-recorder">
      <h3>Өзіңді тыңдап көр</h3>
      <p>
        Жазба әдепкіде тек осы бетте сақталады, серверге автоматты түрде
        жіберілмейді. Бет жабылғанда жойылады. Бір жазба — ең көбі 60 секунд.
      </p>
      <div className="song-actions">
        {recording ? (
          <button
            className="btn primary"
            onClick={() => recorder.current?.stop()}
          >
            <Square size={17} />
            Жазуды тоқтату
          </button>
        ) : (
          <button
            className="btn primary"
            disabled={recognizing || requesting}
            onClick={() => void start()}
          >
            <Mic size={17} />
            {requesting ? "Микрофон рұқсатын күтіп тұрмын…" : "Дауысымды жазу"}
          </button>
        )}
        {url && !recording && (
          <button className="btn ghost" onClick={remove}>
            <Trash2 size={16} />
            Жазбаны өшіру
          </button>
        )}
      </div>
      {recording && <p role="status">● Дауыс жазылып жатыр…</p>}
      {url && (
        <audio
          controls
          src={url}
          onError={() =>
            setError(
              "Жазба ойнатылмады. Осы браузерде қайта жазып көр немесе мәтіндік баламаны қолдан.",
            )
          }
        />
      )}
      {allowBrowserRecognition && (
        <details>
          <summary>Сөйлеуді мәтінге айналдыру</summary>
          <p>
            Браузердің сөйлеуді тану қызметі аудионы өз провайдеріне жіберуі
            мүмкін. Бұл мүмкіндік айтылым сапасын бағаламайды.
          </p>
          {recognizing ? (
            <button
              className="btn ghost"
              onClick={() => recognition.current?.stop()}
            >
              Тануды тоқтату
            </button>
          ) : (
            <button
              className="btn ghost"
              disabled={recording || requesting}
              onClick={recognize}
            >
              Сөйлеуді тануды бастау
            </button>
          )}
          {transcript && <p role="status">Танылған мәтін: {transcript}</p>}
        </details>
      )}
      {error && (
        <p role="alert" className="song-error">
          {error}
        </p>
      )}
    </section>
  );
}
