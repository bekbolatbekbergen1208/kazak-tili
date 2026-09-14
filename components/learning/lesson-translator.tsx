"use client";

import { useEffect, useMemo, useState } from "react";
import { useLearning } from "./provider";
import { interfaceLanguages } from "@/lib/learning/languages";
import type {
  Exercise,
  InterfaceLanguage,
  Localized,
} from "@/lib/learning/types";

import { commonDictionary } from "@/lib/translation/dictionary";
type TranslationItem = { kk: string; translation: Localized };

function lessonItems(exercise?: Exercise): TranslationItem[] {
  if (!exercise) return commonDictionary;
  const items = new Map<string, TranslationItem>();
  const add = (entry: TranslationItem) => {
    if (entry.kk.trim()) items.set(entry.kk.trim().toLowerCase(), entry);
  };
  commonDictionary.forEach(add);
  add({ kk: exercise.example, translation: exercise.translation });
  exercise.pairs?.forEach(add);
  return [...items.values()].slice(0, 12);
}

export function LessonTranslator({ exercise }: { exercise?: Exercise }) {
  const { state } = useLearning();
  const [language, setLanguage] = useState<InterfaceLanguage>(state.profile.language);
  useEffect(() => { setLanguage(state.profile.language); }, [state.profile.language]);
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem("qd-translation-language");
        if (interfaceLanguages.some(item => item.code === saved)) setLanguage(saved as InterfaceLanguage);
      } catch { /* Storage is optional. */ }
    };
    sync();
    window.addEventListener("qd-translation-language", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("qd-translation-language", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const items = useMemo(() => lessonItems(exercise), [exercise]);
  const [query, setQuery] = useState(items[0]?.kk ?? "");
  const [remote, setRemote] = useState<{ key: string; text: string; error: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([query.trim(), language]);
  const active =
    items.find(
      (entry) => entry.kk.toLowerCase() === query.trim().toLowerCase(),
    );
  const known = active?.translation[language];
  useEffect(() => {
    if (!query.trim() || known) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: query.trim(), language }),
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw Error(body.error || "Аударма орындалмады.");
        if (!controller.signal.aborted) setRemote({ key: requestKey, text: body.translation, error: false });
      } catch (error) {
        if (!controller.signal.aborted) setRemote({ key: requestKey, text: error instanceof Error ? error.message : "Аударма орындалмады.", error: true });
      }
    }, 400);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, language, known, requestKey, retry]);
  const result = !query.trim() ? "Қазақша сөз таңда" : known ?? (remote?.key === requestKey ? remote.text : "Аударылып жатыр…");

  return (
    <aside className="qd-lesson-translator" data-word-translator>
      <div>
        <b>Аудармашы</b>
        <select
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value as InterfaceLanguage);
            try {
              localStorage.setItem("qd-translation-language", event.target.value);
              window.dispatchEvent(new Event("qd-translation-language"));
            } catch { /* Keep the selected language in memory. */ }
          }}
          aria-label="Аударма тілі"
        >
          {interfaceLanguages.map((item) => (
            <option value={item.code} key={item.code}>
              {item.nativeName}
            </option>
          ))}
        </select>
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Қазақша сөз"
        aria-label="Қазақша сөз"
        maxLength={300}
      />
      <strong role="status" aria-live="polite">{result}</strong>
      {!known && remote?.key === requestKey && remote.error && <button type="button" onClick={() => { setRemote(null); setRetry(value => value + 1); }}>Қайта көру</button>}
      <div>
        {items.slice(0, 8).map((entry) => (
          <button
            type="button"
            onClick={() => setQuery(entry.kk)}
            key={entry.kk}
          >
            {entry.kk}
          </button>
        ))}
      </div>
    </aside>
  );
}

export { commonDictionary };
