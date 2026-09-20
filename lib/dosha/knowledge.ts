import { readingBooks } from "@/lib/books/catalog";
import { courseLessons } from "@/lib/curriculum";
import { historyCities } from "@/lib/history/catalog";
import { worldGames } from "@/lib/national/world-catalog";
import { regions } from "@/lib/travel/catalog";
import { visionWords } from "@/lib/vision/words";

export type DoshaUserContext = {
  level?: string;
  currentLesson?: number;
  currentRegion?: string;
  selectedTrack?: string;
  xp?: number;
  recentlyCompletedLessons?: string[];
  preferredLanguage?: string;
};

export type KnowledgeSource = {
  id: string;
  category:
    | "lesson"
    | "region"
    | "history"
    | "literature"
    | "national-game"
    | "vision"
    | "robotics";
  title: string;
  href?: string;
  excerpt: string;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("kk")
    .replace(/[^a-zа-яәіңғүұқөһё0-9]+/giu, " ")
    .trim();

const terms = (value: string) => [
  ...new Set(
    normalize(value)
      .split(" ")
      .filter(
        (word) =>
          word.length > 2 &&
          !["мен", "бен", "пен", "және", "үшін", "осы", "туралы"].includes(
            word,
          ),
      ),
  ),
];

let cached: KnowledgeSource[] | undefined;

export function doshaKnowledge(): KnowledgeSource[] {
  if (cached) return cached;
  cached = [
    ...courseLessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      category: "lesson" as const,
      title: `${lesson.id}-сабақ. ${lesson.title}`,
      href: `/student/lesson/${lesson.id}`,
      excerpt: `${lesson.level}. Тақырып: ${lesson.theme}. Жағдаят: ${lesson.context}. Грамматика: ${lesson.grammar}. Сөздер: ${lesson.words.join(", ")}. Үлгі: ${lesson.sentence}. Аудармасы: ${lesson.translation}.`,
    })),
    ...regions.map((region) => ({
      id: `region-${region.id}`,
      category: "region" as const,
      title: region.nameKk,
      href: `/kazakhstan/${region.slug}`,
      excerpt: `${region.shortDescription}. Орталығы: ${region.capital ?? "көрсетілмеген"}. ${region.interestingFacts.slice(0, 3).join(" ")} Сөздер: ${region.vocabulary
        .slice(0, 10)
        .map((word) => `${word.kk} — ${word.definition}`)
        .join("; ")}.`,
    })),
    ...historyCities.map((city) => ({
      id: `history-${city.id}`,
      category: "history" as const,
      title: `${city.name}: ${city.subtitle}`,
      href: `/learn/history/${city.id}`,
      excerpt: `${city.era}. ${city.intro.join(" ")} ${city.objects.map((object) => `${object.title}: ${object.fact}`).join(" ")}`,
    })),
    ...readingBooks.map((book) => ({
      id: `book-${book.id}`,
      category: "literature" as const,
      title: `${book.title} — ${book.author}`,
      href: `/learn/books/${book.id}`,
      excerpt: `${book.genre}. Тақырыбы: ${book.theme}. ${book.summary} Кейіпкерлер: ${book.characters.map((character) => `${character.name}: ${character.description}`).join("; ")}. Сөздік: ${book.vocabulary.map((item) => `${item.word} — ${item.meaning}`).join("; ")}.`,
    })),
    ...worldGames.map((game) => ({
      id: `game-${game.id}`,
      category: "national-game" as const,
      title: game.name,
      href: `/learn/national/${game.id}`,
      excerpt: `${game.tradition} Ережесі: ${game.rules} Ойын сөздері: ${game.words.join(", ")}.`,
    })),
    ...visionWords.map((word) => ({
      id: `vision-${word.id}`,
      category: "vision" as const,
      title: word.kk,
      href: "/learn/vision",
      excerpt: `${word.kk}; көпше түрі: ${word.plural}; орысша: ${word.ru}; ағылшынша: ${word.en}. Мысал: ${word.easy}`,
    })),
    {
      id: "robotics-basics",
      category: "robotics",
      title: "Робототехникаға кіріспе сөздік",
      excerpt:
        "Робот — бағдарлама арқылы тапсырма орындайтын құрылғы. Сенсор ортаны байқап, дерек береді. Қозғалтқыш механизмді қозғалысқа келтіреді. Алгоритм — әрекеттердің реті. Бағдарлама роботтың әрекетін басқарады. Қауіпсіздік үшін құрылғыны мұғалімнің нұсқауымен қолдан.",
    },
  ];
  return cached;
}

export function searchDoshaKnowledge(
  query: string,
  context: DoshaUserContext = {},
  limit = 6,
) {
  const queryTerms = terms(query);
  const normalizedQuery = normalize(query);
  return doshaKnowledge()
    .map((source) => {
      const title = normalize(source.title);
      const body = normalize(source.excerpt);
      let score = title.includes(normalizedQuery) && normalizedQuery ? 18 : 0;
      for (const term of queryTerms) {
        const titleMatch = title
          .split(" ")
          .some(
            (word) =>
              word.includes(term) ||
              term.includes(word) ||
              (term.length >= 5 && word.startsWith(term.slice(0, 5))),
          );
        if (titleMatch) score += 8;
        if (body.includes(term)) score += 2;
      }
      if (
        context.currentLesson &&
        source.id === `lesson-${context.currentLesson}`
      )
        score += 30;
      if (
        context.currentRegion &&
        normalize(`${source.title} ${source.excerpt}`).includes(
          normalize(context.currentRegion),
        )
      )
        score += 16;
      if (
        context.selectedTrack &&
        normalize(`${source.category} ${source.title}`).includes(
          normalize(context.selectedTrack),
        )
      )
        score += 8;
      return { source, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 6)))
    .map(({ source }) => source);
}

export function formatKnowledgeContext(sources: KnowledgeSource[]) {
  return sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.title} (${source.category})\n${source.excerpt.slice(0, 1200)}`,
    )
    .join("\n\n");
}

export function formatUserContext(context: DoshaUserContext) {
  const entries = Object.entries(context).filter(([, value]) =>
    Array.isArray(value) ? value.length : value !== undefined && value !== "",
  );
  return entries.length
    ? entries
        .map(
          ([key, value]) =>
            `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
        )
        .join("\n")
    : "Оқу прогресі берілмеген.";
}
