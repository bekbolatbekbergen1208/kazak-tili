import { expandedVocabulary } from "./expanded";
import { commonDictionary } from "./dictionary";
import { regions } from "../travel/catalog";
import { readingBooks } from "../books/catalog";
import { historyCities } from "../history/catalog";
import { courseLessons } from "../curriculum";
import { lessons, books } from "../learning/content";
import { visionWords } from "../vision/words";
import { worldGames } from "../national/world-catalog";
import { words as travelWords } from "../travel/vocabulary";
import { words as starterWords } from "../data";
import type { Localized } from "../learning/types";

export type VocabularyEntry = {
  kk: string;
  translation: Partial<Localized>;
  notes: string[];
};
export const normalizeWord = (value: string) =>
  value
    .normalize("NFC")
    .toLocaleLowerCase("kk")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

let cached: VocabularyEntry[] | undefined;
export function siteVocabulary(): VocabularyEntry[] {
  if (cached) return cached;
  const entries = new Map<string, VocabularyEntry>();
  function add(kk: string, translation: Partial<Localized>, note: string) {
    const key = normalizeWord(kk);
    if (!key) return;
    const entry = entries.get(key) ?? {
      kk: kk.trim(),
      translation: {},
      notes: [],
    };
    // Keep original translations; preserve other meanings in source notes.
    for (const [language, value] of Object.entries(translation)) {
      const lang = language as keyof Localized;
      if (value && !entry.translation[lang]) entry.translation[lang] = value;
    }
    if (note && !entry.notes.includes(note)) entry.notes.push(note);
    entries.set(key, entry);
  }
  for (const word of commonDictionary)
    add(word.kk, word.translation, "Жалпы сөздік.");
  for (const word of [
    ...travelWords,
    ...regions.flatMap((region) => region.vocabulary),
  ])
    add(
      word.kk,
      { ru: word.ru, en: word.en.replaceAll("-", " ") },
      `${word.definition} Мысал: ${word.example}`,
    );
  for (const word of starterWords)
    add(word.kk, { ru: word.ru }, "Бастапқы сөздік.");
  for (const word of visionWords)
    add(
      word.kk,
      { ru: word.ru, en: word.en },
      `Көпше түрі: ${word.plural}. Мысал: ${word.easy}`,
    );
  for (const book of readingBooks)
    for (const word of book.vocabulary)
      add(word.word, {}, `${book.title}: ${word.meaning}`);
  for (const book of books)
    for (const word of book.vocabulary)
      add(word.kk, word.translation, `${book.title}: сөздік.`);
  for (const city of historyCities)
    for (const object of city.objects)
      add(object.word.term, {}, `${city.name}: ${object.word.meaning}`);
  for (const lesson of lessons.filter((lesson) => !lesson.bookId))
    for (const exercise of lesson.exercises) {
      add(exercise.example, exercise.translation, `Мысал: ${exercise.example}`);
      for (const pair of exercise.pairs ?? [])
        add(pair.kk, pair.translation, "Сабақ сөздігі.");
    }
  for (const lesson of courseLessons)
    for (const word of lesson.words)
      add(
        word,
        {},
        `Сабақ тақырыбы: ${lesson.theme}. Қолданылу контексті: ${lesson.sentence}.`,
      );
  for (const game of worldGames)
    for (const word of game.words)
      add(word, {}, `«${game.name}» ойынының сөзі. ${game.tradition}`);
  for (const word of expandedVocabulary)
    add(word.kk, word.translation, `Мысал: ${word.example}`);
  cached = [...entries.values()];
  return cached;
}

export function vocabularyText(entry: VocabularyEntry) {
  const translations = Object.entries(entry.translation)
    .map(([language, value]) => `${language}: ${value}`)
    .join("; ");
  return `${entry.kk}${translations ? ` — ${translations}` : ""}. ${entry.notes.join(" ")}`;
}

export function findVocabulary(query: string) {
  const normalized = normalizeWord(query);
  if (!normalized) return undefined;
  const quoted = query.match(/[«“"]([^»”"]+)[»”"]/)?.[1];
  const target = normalizeWord(quoted ?? query);
  const entries = siteVocabulary();
  const exact = entries.find((entry) => normalizeWord(entry.kk) === target);
  if (exact) return exact;
  const translated = entries.find((entry) =>
    Object.values(entry.translation).some((value) =>
      value?.split(";").some((meaning) => normalizeWord(meaning) === target),
    ),
  );
  if (translated) return translated;
  // An unknown quoted word must not resolve to a generic word in the question.
  if (quoted) return undefined;
  // Only interpret a word inside a sentence when the user asks about vocabulary.
  if (!/сөз|мағына|аудар|деген|знач|перев|meaning|translat/iu.test(query))
    return undefined;
  return entries
    .filter(
      (entry) =>
        !["сөз", "мағына", "аударма", "мысал", "сөйлем"].includes(
          normalizeWord(entry.kk),
        ),
    )
    .filter((entry) =>
      ` ${normalized} `.includes(` ${normalizeWord(entry.kk)} `),
    )
    .sort((a, b) => b.kk.length - a.kk.length)[0];
}
