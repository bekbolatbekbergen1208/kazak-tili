"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Mascot } from "./icons";
import { Shell, StudentTop } from "./shell";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import { commonDictionary } from "@/components/learning/lesson-translator";
import type { InterfaceLanguage } from "@/lib/learning/types";
import { boundedHistory, parseChat, type ChatMessage } from "@/lib/friend/chat";
import { friendSuggestions } from "@/lib/friend/knowledge";
import {
  writingGenres,
  writingStyles,
  type WritingRequest,
} from "@/lib/dosha/writing";

type Message = {
  me: boolean;
  text: string;
  interactionId?: string;
  rating?: "helpful" | "unhelpful";
};
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
  text: "Сәлем! Мен — Досжан 👋 Ережені түсіндірейін бе, сөйлеміңді тексерейін бе? Күнделікті сұрағыңды да қоя бер. Бірге ойланып көрейік!",
};
export default function Friend({ embedded = false }: { embedded?: boolean }) {
  const Wrapper = embedded ? Fragment : Shell;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"ai" | "reference">("reference");
  const [language, setLanguage] = useState("kk");
  const [writingMode, setWritingMode] = useState(false);
  const [writingGenre, setWritingGenre] =
    useState<WritingRequest["genre"]>("essay");
  const [writingStyle, setWritingStyle] =
    useState<WritingRequest["style"]>("neutral");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [chatError, setChatError] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
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
        body: JSON.stringify({
          message,
          history,
          language,
          ...(writingMode
            ? { writing: { genre: writingGenre, style: writingStyle } }
            : {}),
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string")
        throw Error(data.error ?? "Жауапты алу мүмкін болмады.");
      setMsgs(
        [
          ...before,
          { me: true, text: message },
          {
            me: false,
            text: data.reply,
            interactionId:
              typeof data.interactionId === "string"
                ? data.interactionId
                : undefined,
          },
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

  async function rate(message: Message, rating: "helpful" | "unhelpful") {
    if (!message.interactionId || feedbackBusy) return;
    if (rating === "unhelpful" && feedbackFor !== message.interactionId) {
      setFeedbackFor(message.interactionId);
      setFeedbackNote("");
      return;
    }
    setFeedbackBusy(true);
    setChatError("");
    try {
      const response = await fetch("/api/ai-friend/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: message.interactionId,
          rating,
          note: rating === "unhelpful" ? feedbackNote : "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Бағалау сақталмады.");
      setMsgs((current) =>
        current.map((item) =>
          item.interactionId === message.interactionId
            ? { ...item, rating }
            : item,
        ),
      );
      setFeedbackFor("");
      setFeedbackNote("");
    } catch (error) {
      setChatError(
        error instanceof Error ? error.message : "Бағалау сақталмады.",
      );
    } finally {
      setFeedbackBusy(false);
    }
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
      <div
        className="page friendPage"
        data-dossha-state={
          isListening ? "listening" : pending ? "thinking" : "idle"
        }
      >
        <StudentTop
          title="Досжанмен сөйлесу"
          sub="Сұрағыңды қой · ережені түсін · қазақша сөйлес"
        />
        <div className="chat">
          <aside>
            <div className="friendPortrait">
              <Mascot />
              <i />
            </div>
            <h2>Досжан</h2>
            <span className="online">
              ● {mode === "ai" ? "Оқу көмекшісі" : "Анықтамалық режимі"}
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
                <b>Досжаннан сұра</b>
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
                    Өз серверіміздегі AI үшін{" "}
                    <Link href="/login">аккаунтпен кір</Link>. Қазір жергілікті
                    анықтамалық жауаптары қолжетімді.
                  </>
                ) : (
                  "Қазір жергілікті анықтамалық режимі жұмыс істейді. Өз серверіміздегі AI бапталса, аккаунтпен кірген оқушыларға қосылады."
                )}
              </p>
            )}
            <div
              className="messages"
              ref={messagesRef}
              role="log"
              aria-label="Досжанмен әңгіме"
              aria-live="polite"
              aria-busy={pending}
            >
              {[greeting, ...msgs].map((message, index) => (
                <div
                  className={`message ${message.me ? "mine" : ""}`}
                  key={index}
                >
                  {!message.me && <Mascot />}
                  <div className="dossha-message-body">
                    <p>{message.text}</p>
                    {!message.me && message.interactionId && (
                      <div className="dossha-rating">
                        {message.rating ? (
                          <span>
                            <Check size={14} /> Рақмет, бағалауың сақталды
                          </span>
                        ) : (
                          <>
                            <small>Жауап пайдалы болды ма?</small>
                            <button
                              type="button"
                              onClick={() => void rate(message, "helpful")}
                              disabled={feedbackBusy}
                              aria-label="Жауап пайдалы"
                            >
                              <ThumbsUp size={15} /> Иә
                            </button>
                            <button
                              type="button"
                              onClick={() => void rate(message, "unhelpful")}
                              disabled={feedbackBusy}
                              aria-label="Жауап қате немесе пайдасыз"
                            >
                              <ThumbsDown size={15} /> Қате
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {feedbackFor === message.interactionId &&
                      !message.rating && (
                        <div className="dossha-feedback-note">
                          <label htmlFor={`feedback-${message.interactionId}`}>
                            Не қате болды? Мұғалімге қысқаша жаз.
                          </label>
                          <textarea
                            id={`feedback-${message.interactionId}`}
                            rows={2}
                            maxLength={1000}
                            value={feedbackNote}
                            onChange={(event) =>
                              setFeedbackNote(event.target.value)
                            }
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setFeedbackFor("")}
                              disabled={feedbackBusy}
                            >
                              Бас тарту
                            </button>
                            <button
                              type="button"
                              onClick={() => void rate(message, "unhelpful")}
                              disabled={feedbackBusy}
                            >
                              Мұғалімге жіберу
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
              {(!ready || pending) && (
                <div className="message dossha-typing">
                  <Mascot />
                  <p role="status">
                    {ready ? "Досжан ойланып жатыр…" : "Чат ашылуда…"}
                    <span className="dossha-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
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
            <div className="dossha-writing-controls">
              <label>
                <input
                  type="checkbox"
                  checked={writingMode}
                  onChange={(event) => setWritingMode(event.target.checked)}
                  disabled={pending}
                />{" "}
                Мәтінді түзету
              </label>
              {writingMode && (
                <>
                  <label>
                    Жанр{" "}
                    <select
                      value={writingGenre}
                      onChange={(event) =>
                        setWritingGenre(
                          event.target.value as WritingRequest["genre"],
                        )
                      }
                      disabled={pending}
                    >
                      {Object.entries(writingGenres).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Стиль{" "}
                    <select
                      value={writingStyle}
                      onChange={(event) =>
                        setWritingStyle(
                          event.target.value as WritingRequest["style"],
                        )
                      }
                      disabled={pending}
                    >
                      {Object.entries(writingStyles).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
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
                    : writingMode
                      ? "Түзететін мәтініңді жаз…"
                      : "Сұрағыңды немесе тексеретін мәтініңді жаз…"
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
