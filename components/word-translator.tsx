"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { interfaceLanguages } from "@/lib/learning/languages";
import type { InterfaceLanguage } from "@/lib/learning/types";
import { wordAt } from "@/lib/translation/words";

const languageKey = "qd-translation-language";
type Selection = { word: string; context: string; x: number; y: number };

export function WordTranslator() {
  const path = usePathname();
  const [language, setLanguage] = useState<InterfaceLanguage>("ru");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [translateControls, setTranslateControls] = useState(false);
  const cache = useRef(new Map<string, string>());

  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem(languageKey);
        if (interfaceLanguages.some(x => x.code === saved)) setLanguage(saved as InterfaceLanguage);
      } catch { /* Storage may be unavailable in private browsing. */ }
    };
    sync();
    window.addEventListener("qd-translation-language", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("qd-translation-language", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => { setSelection(null); }, [path]);
  useEffect(() => {
    const close = () => setSelection(null);
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target : null;
      if (!element || element.closest("[data-word-translator]")) return;
      if (element.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-no-translate]')) { close(); return; }
      const control = element.closest('a,button,label,[role="button"],[role="link"],[role="option"],[role="radio"],[role="checkbox"]');
      // The explicit mode lets learners translate answer and navigation labels
      // without submitting an answer or leaving the current page.
      if (control && !translateControls) { close(); return; }
      if (event.altKey || event.ctrlKey || event.metaKey || event.button !== 0) return;
      const doc = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };
      const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
      const caret = position ? null : doc.caretRangeFromPoint?.(event.clientX, event.clientY);
      const node = position?.offsetNode ?? caret?.startContainer;
      const offset = position?.offset ?? caret?.startOffset;
      if (!node || node.nodeType !== Node.TEXT_NODE || offset === undefined) { close(); return; }
      const text = node.textContent ?? "";
      const found = wordAt(text, offset) ?? (offset > 0 ? wordAt(text, offset - 1) : null);
      if (!found || found.word.length > 100) { close(); return; }
      const range = document.createRange();
      range.setStart(node, found.start);
      range.setEnd(node, found.end);
      const hit = Array.from(range.getClientRects()).some(r => event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom);
      if (!hit) { close(); return; }
      if (translateControls) {
        event.preventDefault();
        event.stopPropagation();
      }
      setResult(""); setError("");
      setSelection({ word: found.word, context: text.slice(Math.max(0, found.start - 200), found.end + 200), x: Math.max(12, Math.min(event.clientX, window.innerWidth - 312)), y: Math.max(12, Math.min(event.clientY + 16, window.innerHeight - 260)) });
    };
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", close);
    };
  }, [translateControls]);
  useEffect(() => {
    if (!selection) return;
    const controller = new AbortController();
    const key = JSON.stringify([selection.word, selection.context, language]);
    setError(""); setResult("");
    const saved = cache.current.get(key);
    if (saved) { setResult(saved); return; }
    void (async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: selection.word, context: selection.context, language }),
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw Error(body.error || "Аударма орындалмады.");
        if (controller.signal.aborted) return;
        if (cache.current.size >= 200) cache.current.clear();
        cache.current.set(key, body.translation);
        setResult(body.translation);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Аударма орындалмады.");
      }
    })();
    return () => controller.abort();
  }, [selection, language, retry]);

  return <>
    <button data-word-translator type="button" className="qd-translation-toggle" aria-pressed={translateControls}
      title="Батырмалар мен мәзірдегі сөздерді де аудару үшін қосыңыз"
      onClick={() => { setTranslateControls(value => !value); setSelection(null); }}>
      {translateControls ? "Аударма режимі: қосулы · Өшіру" : "Барлық сөзді аудару"}
    </button>
    {selection && <aside data-word-translator className="qd-word-translation" role="dialog" aria-label="Сөз аудармасы" style={{ left: selection.x, top: selection.y }}>
    <div className="qd-word-translation-heading"><strong>{selection.word}</strong><button type="button" aria-label="Жабу" onClick={() => setSelection(null)}>×</button></div>
    <label>Аударма тілі
      <select value={language} onChange={e => {
        setLanguage(e.target.value as InterfaceLanguage);
        try { localStorage.setItem(languageKey, e.target.value); window.dispatchEvent(new Event("qd-translation-language")); } catch { /* Keep in-memory selection. */ }
      }}>{interfaceLanguages.map(item => <option key={item.code} value={item.code}>{item.nativeName}</option>)}</select>
    </label>
    <p role="status" aria-live="polite">{error || result || "Аударылып жатыр…"}</p>
    {error && <button type="button" onClick={() => setRetry(x => x + 1)}>Қайта көру</button>}
    </aside>}
  </>;
}
