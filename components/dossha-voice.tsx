"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Sparkles, Volume2, X } from "lucide-react";
import { Mascot } from "./icons";

type RecognitionResult = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

type Phase = "listening" | "thinking" | "speaking" | "error";
const speechLanguages: Record<string, string> = {
  kk: "kk-KZ",
  ru: "ru-RU",
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
};

export function useDosshaVoice(
  onMessage: (message: string) => Promise<string | undefined>,
  language: string,
) {
  const [opened, setOpened] = useState(false);
  const [phase, setPhase] = useState<Phase>("listening");
  const [caption, setCaption] = useState("");
  const [heard, setHeard] = useState("");
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const activeRef = useRef(false);
  const sessionRef = useRef(0);
  const recognitionRef = useRef<Recognition | null>(null);
  const restartRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioAbortRef = useRef<AbortController | null>(null);
  const listenRef = useRef<() => void>(() => {});
  const onMessageRef = useRef(onMessage);
  const languageRef = useRef(language);
  onMessageRef.current = onMessage;
  languageRef.current = language;

  function startListening(keepCaption = false) {
    if (!activeRef.current || recognitionRef.current) return;
    const Constructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) {
      setPhase("error");
      setCaption("Микрофон қолжетімсіз");
      setError(
        "Бұл браузер дауысты танымайды. Chrome немесе Edge браузерін қолданып көр.",
      );
      return;
    }
    const session = sessionRef.current;
    const recognition = new Constructor();
    recognition.lang = speechLanguages[languageRef.current] ?? "kk-KZ";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setPhase("listening");
    if (!keepCaption) setCaption("Сөйлей бер, мен тыңдап тұрмын");
    setHeard("");
    setError("");
    let handled = false;
    let blocked = false;

    recognition.onresult = (event) => {
      if (!activeRef.current || sessionRef.current !== session) return;
      let transcript = "";
      let final = false;
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
        final ||= event.results[i].isFinal;
      }
      setHeard(transcript);
      if (!final || !transcript.trim() || handled) return;
      handled = true;
      recognitionRef.current = null;
      recognition.stop();
      setIsListening(false);
      setPhase("thinking");
      setCaption("Досжан ойланып жатыр…");
      void onMessageRef
        .current(transcript.trim())
        .then((reply) => {
          if (!activeRef.current || sessionRef.current !== session) return;
          if (reply) speakReply(reply);
          else {
            setPhase("error");
            setCaption("Жауапты алу мүмкін болмады");
            setError("Сұрағың чатта көрінеді. Қайта сөйлеп көр.");
          }
        })
        .catch(() => {
          if (!activeRef.current || sessionRef.current !== session) return;
          setPhase("error");
          setCaption("Жауапты алу мүмкін болмады");
          setError("Қайта сөйлеп көр.");
        });
    };

    recognition.onerror = (event) => {
      if (!activeRef.current || sessionRef.current !== session) return;
      if (event.error === "no-speech" || event.error === "aborted") return;
      blocked = true;
      setIsListening(false);
      setPhase("error");
      setCaption("Микрофонды іске қосу мүмкін болмады");
      setError(
        event.error === "not-allowed"
          ? "Микрофонға рұқсат берілмеді. Браузер баптауынан рұқсатты қос."
          : "Дауысты тану мүмкін болмады. Қайта байқап көр.",
      );
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (
        activeRef.current &&
        sessionRef.current === session &&
        !handled &&
        !blocked
      ) {
        restartRef.current = window.setTimeout(() => listenRef.current(), 350);
      }
    };
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setPhase("error");
      setCaption("Микрофонды іске қосу мүмкін болмады");
      setError("Қайта байқап көр.");
    }
  }
  listenRef.current = startListening;

  async function playLocal(
    sentence: string,
    session: number,
  ): Promise<boolean> {
    const controller = new AbortController();
    audioAbortRef.current = controller;
    let url: string | null = null;
    try {
      const response = await fetch("/api/dossha/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence }),
        signal: controller.signal,
      });
      if (!response.ok || !activeRef.current || sessionRef.current !== session)
        return false;
      url = URL.createObjectURL(await response.blob());
      audioUrlRef.current = url;
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = url;
      return await new Promise<boolean>((resolve) => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        controller.signal.addEventListener("abort", () => resolve(false), {
          once: true,
        });
        void audio.play().catch(() => resolve(false));
      });
    } catch {
      return false;
    } finally {
      if (audioAbortRef.current === controller) audioAbortRef.current = null;
      if (url) {
        URL.revokeObjectURL(url);
        if (audioUrlRef.current === url) audioUrlRef.current = null;
      }
    }
  }

  function playBrowser(sentence: string, lang: string): Promise<boolean> {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    )
      return Promise.resolve(false);
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((item) => item.lang.toLowerCase() === lang.toLowerCase()) ??
        voices.find((item) =>
          item.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()),
        );
      utterance.lang = voice?.lang ?? lang;
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve(false);
      }
    });
  }

  function speakReply(reply: string) {
    const session = sessionRef.current;
    const sentences = reply
      .split(/(?<=[.!?…])\s+|\n+/u)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    if (!sentences.length) {
      startListening();
      return;
    }
    window.speechSynthesis?.cancel();
    setPhase("speaking");
    setError("");
    setHeard("");
    const lang = speechLanguages[languageRef.current] ?? "kk-KZ";
    const say = async (index: number): Promise<void> => {
      if (!activeRef.current || sessionRef.current !== session) return;
      if (index >= sentences.length) {
        startListening(true);
        return;
      }
      setCaption(sentences[index]);
      const played =
        (lang === "kk-KZ" && (await playLocal(sentences[index], session))) ||
        (await playBrowser(sentences[index], lang));
      if (!activeRef.current || sessionRef.current !== session) return;
      if (!played) {
        setPhase("error");
        setError(
          "Досжанның дауысын ойнату мүмкін болмады. Жауап титрде және чатта сақталды.",
        );
        return;
      }
      await say(index + 1);
    };
    void say(0);
  }

  function open() {
    if (activeRef.current) return;
    activeRef.current = true;
    sessionRef.current += 1;
    setOpened(true);
    setError("");
    audioRef.current = new Audio();
    startListening();
  }

  function close() {
    activeRef.current = false;
    sessionRef.current += 1;
    if (restartRef.current !== null) window.clearTimeout(restartRef.current);
    restartRef.current = null;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    audioAbortRef.current?.abort();
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setOpened(false);
    setCaption("");
    setHeard("");
  }

  useEffect(() => {
    if (!opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [opened]);

  useEffect(
    () => () => {
      activeRef.current = false;
      sessionRef.current += 1;
      if (restartRef.current !== null) window.clearTimeout(restartRef.current);
      recognitionRef.current?.abort();
      audioAbortRef.current?.abort();
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const overlay = opened ? (
    <div
      className="dossha-voice-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Досжанмен дауыстық әңгіме"
    >
      <header className="dossha-voice-header">
        <div>
          <span className="dossha-voice-mark">
            <Sparkles size={20} />
          </span>
          <span>
            <strong>Досжанмен сөйлесу</strong>
            <small>Дауыстық әңгіме</small>
          </span>
        </div>
        <button
          type="button"
          className="dossha-voice-close"
          onClick={close}
          aria-label="Дауыстық режимді жабу және чатқа оралу"
          autoFocus
        >
          <X size={24} />
        </button>
      </header>
      <main className="dossha-voice-main" data-phase={phase}>
        <div className="dossha-voice-caption" role="status" aria-live="polite">
          {caption}
        </div>
        <div className="dossha-voice-portrait">
          <span className="dossha-voice-halo" />
          <Mascot />
        </div>
        <div className="dossha-voice-status">
          {phase === "listening" ? (
            <Mic size={18} />
          ) : phase === "speaking" ? (
            <Volume2 size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          <span>
            {phase === "listening"
              ? "Тыңдап тұрмын"
              : phase === "thinking"
                ? "Жауап дайындап жатырмын"
                : phase === "speaking"
                  ? "Досжан сөйлеп жатыр"
                  : "Қайта байқап көр"}
          </span>
        </div>
        {heard && <p className="dossha-voice-heard">Сен: {heard}</p>}
        {error && (
          <p className="dossha-voice-error" role="alert">
            {error}
          </p>
        )}
        {phase === "error" && (
          <button
            type="button"
            className="dossha-voice-retry"
            onClick={() => startListening()}
          >
            Қайта тыңдау
          </button>
        )}
      </main>
      <footer className="dossha-voice-footer">
        Сөйлесуді аяқтау үшін × батырмасын бас. Диалог чатта қалады.
      </footer>
    </div>
  ) : null;

  return { open, overlay, isListening, opened };
}
