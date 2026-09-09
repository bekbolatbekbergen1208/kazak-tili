"use client";

import { useMemo, useState } from "react";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import type {
  Exercise,
  InterfaceLanguage,
  Localized,
} from "@/lib/learning/types";

type TranslationItem = {
  kk: string;
  translation: Localized;
};

function item(
  kk: string,
  ru: string,
  en: string,
  extra: Partial<Localized> = {},
) {
  return { kk, translation: { ru, en, ...extra } };
}

const commonDictionary: TranslationItem[] = [
  item("Сәлем", "Привет", "Hello", {
    zh: "你好",
    es: "Hola",
    de: "Hallo",
    fr: "Bonjour",
  }),
  item("Рақмет", "Спасибо", "Thank you", {
    zh: "谢谢",
    es: "Gracias",
    de: "Danke",
    fr: "Merci",
  }),
  item("Саяхат", "Путешествие", "Travel", {
    zh: "旅行",
    es: "Viaje",
    de: "Reise",
    fr: "Voyage",
  }),
  item("Ұшақ", "Самолёт", "Airplane", {
    zh: "飞机",
    es: "Avión",
    de: "Flugzeug",
    fr: "Avion",
  }),
  item("Дос", "Друг", "Friend", {
    zh: "朋友",
    es: "Amigo",
    de: "Freund",
    fr: "Ami",
  }),
  item("Мектеп", "Школа", "School", {
    zh: "学校",
    es: "Escuela",
    de: "Schule",
    fr: "École",
  }),
  item("Кітап", "Книга", "Book", {
    zh: "书",
    es: "Libro",
    de: "Buch",
    fr: "Livre",
  }),
  item("Қазақстан", "Казахстан", "Kazakhstan", {
    zh: "哈萨克斯坦",
    es: "Kazajistán",
    de: "Kasachstan",
    fr: "Kazakhstan",
  }),
];

const clean = (value: string) =>
  value
    .replace(/[“”"«».,!?;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function lessonItems(exercise?: Exercise): TranslationItem[] {
  if (!exercise) return commonDictionary;
  const items = new Map<string, TranslationItem>();
  const add = (entry: TranslationItem) => {
    if (entry.kk.trim()) items.set(entry.kk.trim().toLowerCase(), entry);
  };
  commonDictionary.forEach(add);
  add({ kk: exercise.example, translation: exercise.translation });
  exercise.pairs?.forEach(add);
  clean(exercise.example)
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 6)
    .forEach((word) =>
      add({
        kk: word,
        translation: exercise.translation,
      }),
    );
  return [...items.values()].slice(0, 12);
}

export function LessonTranslator({ exercise }: { exercise?: Exercise }) {
  const [language, setLanguage] = useState<InterfaceLanguage>("ru");
  const items = useMemo(() => lessonItems(exercise), [exercise]);
  const [query, setQuery] = useState(items[0]?.kk ?? "");
  const active =
    items.find(
      (entry) => entry.kk.toLowerCase() === query.trim().toLowerCase(),
    ) ??
    items.find((entry) =>
      entry.kk.toLowerCase().includes(query.trim().toLowerCase()),
    );
  const result = active
    ? localized(active.translation, language)
    : query.trim()
      ? "Бұл сөз әзірге сабақ сөздігінде жоқ"
      : "Қазақша сөз таңда";

  return (
    <aside className="qd-lesson-translator">
      <div>
        <b>Аудармашы</b>
        <select
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value as InterfaceLanguage)
          }
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
      />
      <strong>{result}</strong>
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
