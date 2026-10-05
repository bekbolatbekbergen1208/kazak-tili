"use client";
import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
export function Recorder() {
  const [recording, setRecording] = useState(false),
    [url, setUrl] = useState(""),
    [seconds, setSeconds] = useState(0),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    chunks = useRef<Blob[]>([]),
    audioUrl = useRef("");
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    },
    [],
  );
  async function toggle() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const rec = new MediaRecorder(stream.current);
      recorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = () => {
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        audioUrl.current = URL.createObjectURL(
          new Blob(chunks.current, { type: rec.mimeType }),
        );
        setUrl(audioUrl.current);
        stream.current?.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setSeconds(0);
      setRecording(true);
      setError("");
    } catch {
      setError(
        "Микрофон қолжетімсіз. Рұқсатты тексеріңіз немесе жауап мәтінін жазыңыз.",
      );
    }
  }
  return (
    <div className="ql-recorder">
      <button
        onClick={() => void toggle()}
        className={recording ? "recording" : ""}
      >
        <Mic />
        {recording ? "Тоқтату" : "Сөйлеуді жазу"}
      </button>
      <span>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </span>
      {url && <audio controls src={url} />}
      <p>Дауыс серверге жіберілмейді. Бетті жапсаң, жазба жойылады.</p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
