"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Mascot } from "./icons";
import { Shell, StudentTop } from "./shell";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import { commonDictionary } from "@/components/learning/lesson-translator";
import type { InterfaceLanguage } from "@/lib/learning/types";

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

const replies: Record<string, string> = {
  Сәлем: "Сәлем, Айбын! Бүгін қазақша сөйлесуге дайынсың ба?",
  Саяхат:
    "Саяхат — бір жерден басқа жерге бару. Мысалы: «Мен Астанаға саяхаттаймын». Сен қай қалаға барғың келеді?",
  Ұшақ: "Ұшақ аспанда ұшады. «Мен ұшақпен барамын» деп айтып көр!",
};

const dictionary = commonDictionary;

function answerFor(text: string) {
  const key = Object.keys(replies).find((item) =>
    text.toLowerCase().includes(item.toLowerCase()),
  );
  return key
    ? replies[key]
    : "Мен тек қазақ тілін үйренуге көмектесемін. «Саяхат» немесе «Ұшақ» туралы сұрап көрші 😊";
}

export default function Friend() {
  const [msgs, setMsgs] = useState<Message[]>([
    {
      me: false,
      text: "Сәлем, Айбын! 👋 Бүгінгі жаңа сөздерді бірге қайталайық. Қай сөзді таңдайсың?",
    },
  ]);
  const [value, setValue] = useState("");
  const [translatorLang, setTranslatorLang] = useState<InterfaceLanguage>("ru");
  const [translatorInput, setTranslatorInput] = useState("Саяхат");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function send(text = value) {
    const message = text.trim();
    if (!message) return;
    setMsgs((current) => [
      ...current,
      { me: true, text: message },
      { me: false, text: answerFor(message) },
    ]);
    setValue("");
  }

  useEffect(() => () => recognitionRef.current?.abort(), []);

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
    send();
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
    <Shell>
      <div className="page friendPage">
        <StudentTop
          title="Досшамен сөйлесу"
          sub="Қазақша еркін сөйлеп жаттық"
        />
        <div className="chat">
          <aside>
            <div className="friendPortrait">
              <Mascot />
              <i />
            </div>
            <h2>Досша</h2>
            <span className="online">● Қазір осында</span>
            <p>Сенің қазақ тілін үйренудегі қауіпсіз виртуалды досың.</p>
            <div className="safe">
              <ShieldCheck />
              <span>
                <b>Қауіпсіз кеңістік</b>
                <small>Тек оқу тақырыптары</small>
              </span>
            </div>
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
          </aside>
          <section>
            <div className="chatHead">
              <Sparkles />
              <div>
                <b>Бүгінгі тақырып</b>
                <span>Саяхат • Бастапқы деңгей</span>
              </div>
            </div>
            <div className="messages" aria-live="polite">
              {msgs.map((message, index) => (
                <div
                  className={`message ${message.me ? "mine" : ""}`}
                  key={index}
                >
                  {!message.me && <Mascot />}
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
            <div className="quick">
              {["Сәлем!", "Саяхат деген не?", "Ұшақ туралы айт"].map((text) => (
                <button type="button" onClick={() => send(text)} key={text}>
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
            <form onSubmit={submit}>
              <input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={
                  isListening
                    ? "Сөйлей бер…"
                    : "Қазақша жаз немесе дауыспен айт..."
                }
                aria-label="Хабарлама"
              />
              <button
                className={`voiceButton ${isListening ? "listening" : ""}`}
                type="button"
                onClick={toggleVoice}
                aria-label={
                  isListening ? "Дауысты жазуды тоқтату" : "Дауыстық хабарлама"
                }
                title={isListening ? "Тоқтату" : "Дауыспен айту"}
              >
                {isListening ? <MicOff /> : <Mic />}
              </button>
              <button type="submit" aria-label="Жіберу">
                <Send />
              </button>
            </form>
          </section>
        </div>
      </div>
    </Shell>
  );
}
