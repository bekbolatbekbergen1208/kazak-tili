"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Mascot } from "./icons";
import { Shell, StudentTop } from "./shell";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import { commonDictionary } from "@/components/learning/lesson-translator";
import type { InterfaceLanguage } from "@/lib/learning/types";
import { boundedHistory, parseChat, type ChatMessage } from "@/lib/friend/chat";
import { friendSuggestions } from "@/lib/friend/knowledge";

type Message = { me: boolean; text: string };
type SpeechResultEvent = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const dictionary = commonDictionary;
const greeting: Message = {
  me: false,
  text: "Сәлем! Мен — Досша 👋 Қазақ тілі, грамматика, сөз мағынасы, аударма немесе әдебиет туралы сұрағыңды жаз. Бірге түсініп алайық!",
};
export default function Friend({ embedded = false }: { embedded?: boolean }) {
  const Wrapper = embedded ? Fragment : Shell;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"ai" | "reference">("reference");
  const [language, setLanguage] = useState("kk");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [chatError, setChatError] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const lock = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const currentMessages = useRef(msgs);
  const requestRef = useRef<AbortController | null>(null);
  currentMessages.current = msgs;
  const [translatorLang, setTranslatorLang] = useState<InterfaceLanguage>("ru");
  const [translatorInput, setTranslatorInput] = useState("Саяхат");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  async function send(text = value) {
    const message = text.trim();
    if (!message || message.length > 2000 || lock.current || !ready) return;
    lock.current = true;
    setPending(true);
    setChatError("");
    const before = currentMessages.current;
    const history: ChatMessage[] = boundedHistory(
      before.map((m) => ({
        role: m.me ? "user" : "assistant",
        content: m.text,
      })),
    );
    setMsgs([...before, { me: true, text: message }]);
    setValue("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetch("/api/ai-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, language }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string")
        throw Error(data.error ?? "Жауапты алу мүмкін болмады.");
      setMsgs(
        [
          ...before,
          { me: true, text: message },
          { me: false, text: data.reply },
        ].slice(-40),
      );
      setMode(data.mode === "ai" ? "ai" : "reference");
      setSaveNote(
        data.saved
          ? "Соңғы 20 хабарлама аккаунтыңда сақталды."
          : "Бұл әңгіме әзірге осы бетте ғана сақталады.",
      );
    } catch (error) {
      setMsgs(before);
      setValue(message);
      setChatError(
        error instanceof Error && error.name !== "AbortError"
          ? error.message
          : "Жауапты күту уақыты аяқталды. Сұрағыңды қайта жіберіп көр.",
      );
    } finally {
      window.clearTimeout(timeout);
      lock.current = false;
      setPending(false);
      requestRef.current = null;
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    void fetch("/api/ai-friend", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error();
        const data = await response.json();
        const history = parseChat({
          message: "load",
          history: data.history ?? [],
        }).history;
        setMsgs(
          history.map((m) => ({ me: m.role === "user", text: m.content })),
        );
        setMode(data.mode === "ai" ? "ai" : "reference");
        setSignedIn(!!data.signedIn);
        setAiConfigured(!!data.aiConfigured);
        setSaveNote(
          data.persistence
            ? "Соңғы 20 хабарлама аккаунтыңда сақталады."
            : "Бұл әңгіме әзірге осы бетте ғана сақталады.",
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setChatError(
            "Чат тарихын жүктеу мүмкін болмады. Жаңа сұрақ қойып көр.",
          );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setReady(true);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      recognitionRef.current?.abort();
      requestRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, pending]);

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError(
        "Бұл браузер дауысты танымайды. Chrome немесе Edge браузерін қолданып көр.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "kk-KZ";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setVoiceError("");

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        isFinal ||= event.results[index].isFinal;
      }
      setValue(transcript);
      if (isFinal && transcript.trim()) send(transcript);
    };
    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Микрофонға рұқсат берілмеді. Браузер баптауынан рұқсатты қос."
          : event.error === "no-speech"
            ? "Дауыс естілмеді. Микрофонды басып, қайта айтып көр."
            : "Дауысты тану мүмкін болмады. Қайта айтып көр.";
      setVoiceError(message);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setVoiceError("Микрофонды іске қосу мүмкін болмады. Қайта басып көр.");
      setIsListening(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  const translatorWord = translatorInput.trim();
  const foundWord = dictionary.find(
    (entry) => entry.kk.toLowerCase() === translatorWord.toLowerCase(),
  );
  const partialWords = dictionary.filter((entry) =>
    entry.kk.toLowerCase().includes(translatorWord.toLowerCase()),
  );
  const translatorResult = foundWord
    ? localized(foundWord.translation, translatorLang)
    : translatorWord
      ? "Бұл сөз әзірге шағын сөздікте жоқ"
      : "Қазақша сөз жаз";

  return (
    <Wrapper>
      <div className="page friendPage">
        <StudentTop
          title="Досшамен сөйлесу"
          sub="Сұрағыңды қой · ережені түсін · қазақша сөйлес"
        />
        <div className="chat">
          <aside>
            <div className="friendPortrait">
              <Mascot />
              <i />
            </div>
            <h2>Досша</h2>
            <span className="online">
              ● {mode === "ai" ? "AI оқу көмекшісі" : "Анықтамалық режимі"}
            </span>
            <p>Грамматика, аударма, мәтін және әдебиет бойынша оқу серігің.</p>
            <div className="safe">
              <ShieldCheck />
              <span>
                <b>Қауіпсіз кеңістік</b>
                <small>Түсінікті ереже · пайдалы мысал</small>
              </span>
            </div>
            <Link className="dossha-books-link" href="/learn/books">
              📚 Кітап әлеміне өту →
            </Link>
            <details className="dossha-dictionary">
              <summary>Аудармашы · сөздікті ашу</summary>
              <div className="translatorPanel">
                <b>Аудармашы</b>
                <select
                  value={translatorLang}
                  onChange={(event) =>
                    setTranslatorLang(event.target.value as InterfaceLanguage)
                  }
                  aria-label="Аударма тілі"
                >
                  {interfaceLanguages.map((language) => (
                    <option value={language.code} key={language.code}>
                      {language.nativeName}
                    </option>
                  ))}
                </select>
                <input
                  value={translatorInput}
                  onChange={(event) => setTranslatorInput(event.target.value)}
                  placeholder="Қазақша сөз"
                  aria-label="Қазақша сөз"
                />
                <strong>{translatorResult}</strong>
                <div>
                  {(partialWords.length
                    ? partialWords
                    : dictionary.slice(0, 4)
                  ).map((entry) => (
                    <button
                      type="button"
                      onClick={() => setTranslatorInput(entry.kk)}
                      key={entry.kk}
                    >
                      {entry.kk}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          </aside>
          <section>
            <div className="chatHead">
              <Sparkles />
              <div>
                <b>Досшадан сұра</b>
                <span>
                  {pending
                    ? "Жауап дайындап жатыр…"
                    : "Қазақ тілін бірге үйренеміз"}
                </span>
              </div>
              <select
                className="dossha-language"
                aria-label="Жауап тілі"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={pending}
              >
                <option value="kk">Қазақша</option>
                {interfaceLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
            {ready && mode === "reference" && (
              <p className="dossha-mode-note">
                {aiConfigured && !signedIn ? (
                  <>
                    Еркін AI жауаптары үшін{" "}
                    <Link href="/login">аккаунтпен кір</Link>. Қазір қазақша
                    анықтамалық жауаптары қолжетімді.
                  </>
                ) : (
                  "Қазір қазақша анықтамалық режимі жұмыс істейді. Еркін сұрақтарға жауап беру, мәтін түзету және аударма үшін AI әлі қосылмаған."
                )}
              </p>
            )}
            <div
              className="messages"
              ref={messagesRef}
              role="log"
              aria-label="Досшамен әңгіме"
              aria-live="polite"
              aria-busy={pending}
            >
              {[greeting, ...msgs].map((message, index) => (
                <div
                  className={`message ${message.me ? "mine" : ""}`}
                  key={index}
                >
                  {!message.me && <Mascot />}
                  <p>{message.text}</p>
                </div>
              ))}
              {(!ready || pending) && (
                <div className="message dossha-typing">
                  <Mascot />
                  <p role="status">
                    {ready ? "Досша ойланып жатыр…" : "Чат ашылуда…"}
                  </p>
                </div>
              )}
            </div>
            <div className="quick">
              {friendSuggestions.map((text) => (
                <button
                  disabled={pending || !ready}
                  type="button"
                  onClick={() => void send(text)}
                  key={text}
                >
                  {text}
                </button>
              ))}
            </div>
            {isListening && (
              <div className="voiceStatus">
                <i /> Тыңдап тұрмын… Қазақша сөйле
              </div>
            )}
            {voiceError && (
              <div className="voiceError" role="alert">
                {voiceError}
              </div>
            )}
            {chatError && (
              <div className="voiceError" role="alert">
                {chatError}
              </div>
            )}
            <form onSubmit={submit}>
              <textarea
                rows={2}
                maxLength={2000}
                disabled={pending || !ready}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  isListening
                    ? "Сөйлей бер…"
                    : "Қазақ тілі туралы сұрағыңды жаз…"
                }
                aria-label="Хабарлама"
              />
              <button
                className={`voiceButton ${isListening ? "listening" : ""}`}
                type="button"
                disabled={pending || !ready}
                onClick={toggleVoice}
                aria-label={
                  isListening ? "Дауысты жазуды тоқтату" : "Дауыстық хабарлама"
                }
                title={isListening ? "Тоқтату" : "Дауыспен айту"}
              >
                {isListening ? <MicOff /> : <Mic />}
              </button>
              <button
                type="submit"
                aria-label="Жіберу"
                disabled={pending || !ready || !value.trim()}
              >
                <Send />
              </button>
            </form>
            <p className="dossha-save-note">
              {saveNote} {value.length}/2000 · Enter — жіберу, Shift+Enter —
              жаңа жол.
            </p>
          </section>
        </div>
      </div>
    </Wrapper>
  );
}
