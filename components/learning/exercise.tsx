"use client";
import { useEffect, useRef, useState } from "react";
import type { Exercise } from "@/lib/learning/types";
import { isCorrect } from "@/lib/learning/state";
import { localized } from "@/lib/learning/languages";
import { useLearning } from "./provider";
export function ExerciseView({
  exercise: e,
  onSubmit,
  feedback,
  disabled = false,
}: {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  feedback?: { answer: string; correct: boolean };
  disabled?: boolean;
}) {
  const { state, t } = useLearning(),
    lang = state.profile.language,
    [value, setValue] = useState(""),
    [tokens, setTokens] = useState<number[]>([]),
    [pairs, setPairs] = useState<Record<number, string>>({}),
    [revealed, setRevealed] = useState(false),
    [seconds, setSeconds] = useState(30),
    [voice, setVoice] = useState(""),
    [listening, setListening] = useState(false),
    [hint, setHint] = useState(false);
  const recognition =
      useRef<
        NonNullable<Window["SpeechRecognition"]> extends new () => infer R
          ? R
          : never | null
      >(null),
    sent = useRef(false),
    submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  useEffect(() => {
    if (e.kind !== "timed" || feedback || disabled) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [e.kind, feedback, disabled]);
  useEffect(() => {
    if (e.kind === "timed" && seconds === 0 && !sent.current && !feedback) {
      sent.current = true;
      submitRef.current("");
    }
  }, [seconds, e.kind, feedback]);
  useEffect(
    () => () => {
      recognition.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    },
    [],
  );
  const options = e.options
    ? [...e.options].sort((a, b) => {
        const hash = (s: string) =>
          [...(s + e.id)].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 7);
        return hash(a.id) - hash(b.id);
      })
    : [];
  const orderedWords =
    e.kind === "order"
      ? options.map((o) =>
          typeof o.text === "string" ? o.text : localized(o.text, lang),
        )
      : (e.words ?? []);
  const response =
    e.kind === "sentence" || e.kind === "correction"
      ? tokens.map((i) => orderedWords[i]).join(" ")
      : e.kind === "order"
        ? tokens.map((i) => options[i].id).join(" ")
        : e.kind === "match"
          ? (e.pairs ?? []).map((_, i) => pairs[i] ?? "").join(",")
          : value;
  const valid =
    e.kind === "match"
      ? Object.keys(pairs).length === (e.pairs?.length ?? 0)
      : e.kind === "sentence" || e.kind === "order" || e.kind === "correction"
        ? tokens.length === orderedWords.length
        : e.kind === "open"
          ? value.trim().length >= 12
          : !!value.trim();
  function speak() {
    if (!("speechSynthesis" in window)) {
      setVoice(
        t(
          "Озвучивание недоступно. Прочитайте фразу ниже.",
          "Audio is unavailable. Read the phrase below.",
        ),
      );
      setRevealed(true);
      return;
    }
    const voices = window.speechSynthesis.getVoices(),
      kazakh = voices.find((v) => v.lang.toLowerCase().startsWith("kk"));
    if (!kazakh) {
      setVoice(
        t(
          "В браузере нет казахского голоса. Доступен текстовый вариант.",
          "No Kazakh voice is installed. A text alternative is available.",
        ),
      );
      setRevealed(true);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(e.audio ?? e.example);
    u.lang = "kk-KZ";
    u.voice = kazakh;
    u.rate = 0.85;
    u.onerror = () => {
      setVoice(t("Не удалось воспроизвести звук.", "Could not play audio."));
      setRevealed(true);
    };
    window.speechSynthesis.speak(u);
  }
  function record() {
    const R = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!R) {
      setVoice(
        t(
          "Распознавание речи недоступно. Введите фразу вручную.",
          "Speech recognition is unavailable. Type the phrase instead.",
        ),
      );
      return;
    }
    const r = new R();
    recognition.current = r;
    r.lang = "kk-KZ";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (ev) => {
      setValue(ev.results[0][0].transcript);
      setListening(false);
    };
    r.onerror = () => {
      setVoice(
        t(
          "Микрофон недоступен или речь не распознана. Можно ввести ответ.",
          "Microphone unavailable or speech not recognised. You can type your answer.",
        ),
      );
      setListening(false);
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoice(
        t("Не удалось включить микрофон.", "Could not start the microphone."),
      );
    }
  }
  return (
    <section
      className={`qd-exercise ${feedback ? (feedback.correct ? "correct" : "incorrect") : ""}`}
    >
      <span className="pill">
        {
          {
            choice: t("Перевод", "Translation"),
            sentence: t("Соберите фразу", "Build a phrase"),
            match: t("Найдите пары", "Match pairs"),
            gap: t("Пропуск", "Fill the gap"),
            situation: t("Ситуация", "Situation"),
            listening: t("Аудирование", "Listening"),
            speaking: t("Произнесите", "Speaking"),
            flashcard: t("Карточка", "Flashcard"),
            order: t("Порядок событий", "Event order"),
            correction: t("Исправьте порядок слов", "Fix the word order"),
            dialogue: t("Диалог с Досшей", "Dialogue with Dossha"),
            timed: t("Быстрый квиз", "Quick quiz"),
            open: t("Ваше мнение", "Your reflection"),
          }[e.kind]
        }
      </span>
      <h2>{localized(e.prompt, lang)}</h2>
      {e.kind === "timed" && (
        <p role="timer">
          ⏱ {seconds}{" "}
          {t("сек. · без штрафа за ошибку", "sec · no penalty for a mistake")}
        </p>
      )}
      {e.kind === "dialogue" && (
        <blockquote>
          Досша: Сәлеметсіз бе!{" "}
          {t(
            "Выберите ответ для этой ситуации.",
            "Choose a reply for this situation.",
          )}
        </blockquote>
      )}
      {e.kind === "flashcard" && (
        <button
          className="qd-flashcard"
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? localized(e.translation, lang) : e.example}
          <small>{t("Нажмите, чтобы перевернуть", "Tap to flip")}</small>
        </button>
      )}
      {(e.kind === "listening" || e.kind === "speaking") && (
        <div className="qd-actions">
          <button className="btn ghost" type="button" onClick={speak}>
            🔊 {t("Послушать", "Listen")}
          </button>
          <button className="btn ghost" onClick={() => setRevealed(!revealed)}>
            {t("Текст фразы", "Phrase transcript")}
          </button>
        </div>
      )}
      {revealed && (e.kind === "listening" || e.kind === "speaking") && (
        <p lang="kk">{e.audio ?? e.example}</p>
      )}
      {e.kind === "speaking" && (
        <>
          <p>
            {t(
              "Распознавание текста — тренировка, а не оценка акцента. Браузер может отправлять звук своему сервису распознавания.",
              "Speech-to-text is practice, not an accent assessment. Your browser may send audio to its speech service.",
            )}
          </p>
          <button
            className="btn ghost"
            type="button"
            disabled={listening || !!feedback}
            onClick={record}
          >
            🎙{" "}
            {listening ? t("Слушаю…", "Listening…") : t("Произнести", "Speak")}
          </button>
        </>
      )}
      {voice && <p role="status">{voice}</p>}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!feedback && valid) {
            sent.current = true;
            onSubmit(response);
          }
        }}
      >
        <fieldset disabled={disabled || !!feedback}>
          <legend className="qd-sr">{t("Ваш ответ", "Your answer")}</legend>
          {["sentence", "correction", "order"].includes(e.kind) ? (
            <>
              <div className="qd-answer-box" aria-live="polite">
                {tokens.length ? (
                  tokens.map((index, i) => (
                    <button
                      type="button"
                      key={`${index}-${i}`}
                      onClick={() =>
                        setTokens(tokens.filter((_, j) => j !== i))
                      }
                    >
                      {orderedWords[index]} ×
                    </button>
                  ))
                ) : (
                  <span>
                    {t(
                      "Выбирайте слова или события по порядку",
                      "Select words or events in order",
                    )}
                  </span>
                )}
              </div>
              <div className="qd-word-bank">
                {orderedWords.map((word, i) => (
                  <button
                    className="btn ghost"
                    type="button"
                    key={i}
                    disabled={tokens.includes(i)}
                    onClick={() => setTokens([...tokens, i])}
                  >
                    {word}
                  </button>
                ))}
              </div>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setTokens([])}
              >
                {t("Сбросить", "Reset")}
              </button>
            </>
          ) : e.kind === "match" ? (
            <div className="qd-matches">
              {e.pairs?.map((pair, i) => (
                <label key={pair.kk}>
                  <span lang="kk">{pair.kk}</span>
                  <select
                    value={pairs[i] ?? ""}
                    required
                    onChange={(ev) =>
                      setPairs({ ...pairs, [i]: ev.target.value })
                    }
                  >
                    <option value="">
                      {t("Выберите перевод", "Choose a translation")}
                    </option>
                    {[...e.pairs!].reverse().map((p, j) => (
                      <option key={p.kk} value={e.pairs!.length - 1 - j}>
                        {localized(p.translation, lang)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : e.kind === "gap" || e.kind === "speaking" || e.kind === "open" ? (
            <label className="qd-field">
              {t("Ваш ответ", "Your answer")}
              {e.kind === "open" ? (
                <textarea
                  value={value}
                  minLength={12}
                  maxLength={2000}
                  onChange={(ev) => setValue(ev.target.value)}
                  placeholder={t(
                    "Не менее 12 символов. Оцените свою мысль по образцу.",
                    "At least 12 characters. Reflect using the model answer.",
                  )}
                />
              ) : (
                <input
                  value={value}
                  maxLength={500}
                  autoComplete="off"
                  onChange={(ev) => setValue(ev.target.value)}
                />
              )}
            </label>
          ) : (
            <div className="qd-answers">
              {options.map((o) => (
                <label
                  className={`qd-choice ${value === o.id ? "selected" : ""}`}
                  key={o.id}
                >
                  <input
                    type="radio"
                    name={e.id}
                    value={o.id}
                    checked={value === o.id}
                    onChange={() => setValue(o.id)}
                  />
                  <span>
                    {typeof o.text === "string"
                      ? o.text
                      : localized(o.text, lang)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        {!feedback && (
          <div className="qd-actions">
            <button className="btn primary" disabled={disabled || !valid}>
              {t("Проверить", "Check answer")}
            </button>
            {state.progress.inventory.includes("hint") && (
              <button
                className="btn ghost"
                type="button"
                onClick={() => setHint(!hint)}
              >
                💡 {t("Подсказка", "Hint")}
              </button>
            )}
          </div>
        )}
        {hint && (
          <p>
            {t("Первое слово образца", "First word in the example")}:{" "}
            <span lang="kk">{e.example.split(" ")[0]}</span>
          </p>
        )}
      </form>
      {feedback && (
        <div className="qd-feedback" role="status">
          <h3>
            {e.kind === "open"
              ? t("Спасибо за размышление!", "Thank you for reflecting!")
              : feedback.correct
                ? t("Дұрыс! Верно!", "Дұрыс! Correct!")
                : t(
                    "Почти! Давайте разберём.",
                    "Almost! Let’s work through it.",
                  )}
          </h3>
          <p>{localized(e.explanation, lang)}</p>
          <p>
            <b>{t("Образец ответа", "Model answer")}: </b>
            {e.kind === "match"
              ? e.pairs
                  ?.map((p) => `${p.kk} — ${localized(p.translation, lang)}`)
                  .join("; ")
              : e.kind === "order"
                ? e.options
                    ?.map((o) =>
                      typeof o.text === "string"
                        ? o.text
                        : localized(o.text, lang),
                    )
                    .join(" → ")
                : (() => {
                    const option = e.options?.find((o) => o.id === e.answer);
                    return option
                      ? typeof option.text === "string"
                        ? option.text
                        : localized(option.text, lang)
                      : e.answer;
                  })()}
          </p>
          <p>
            <b lang="kk">{e.example}</b> — {localized(e.translation, lang)}
          </p>
          {!feedback.correct && (
            <p>
              {t(
                "Задание добавлено в повторение. Сначала попробуйте ещё раз.",
                "Added to your review list. Try again first.",
              )}
            </p>
          )}
          {e.kind === "open" && (
            <p>
              {t(
                "Это самооценка: ответ не проверяется искусственным интеллектом. Сравните свою мысль с образцом.",
                "This is self-assessment, not AI grading. Compare your reasoning with the model.",
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
