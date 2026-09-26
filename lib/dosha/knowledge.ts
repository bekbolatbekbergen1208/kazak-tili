import { exerciseKnowledge } from "./exercises";
import { grammarTopics } from "../friend/grammar";
import { questions } from "../national/catalog";
import {
  siteVocabulary,
  vocabularyText,
  findVocabulary,
} from "../translation/vocabulary";
import { readingBooks } from "@/lib/books/catalog";
import { courseLessons } from "@/lib/curriculum";
import { historyCities } from "@/lib/history/catalog";
import { worldGames } from "@/lib/national/world-catalog";
import { regions } from "@/lib/travel/catalog";
import { visionWords } from "@/lib/vision/words";

export type DoshaUserContext = {
  level?: string;
  currentLesson?: number | string;
  currentRegion?: string;
  selectedTrack?: string;
  xp?: number;
  recentlyCompletedLessons?: string[];
  preferredLanguage?: string;
};

export type KnowledgeSource = {
  id: string;
  category:
    | "exercise"
    | "lesson"
    | "region"
    | "history"
    | "literature"
    | "national-game"
    | "vision"
    | "robotics"
    | "vocabulary"
    | "grammar";
  title: string;
  href?: string;
  excerpt: string;
  question?: string;
  lessonId?: string | number;
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
    ...exerciseKnowledge(),
    ...siteVocabulary().map((entry) => ({
      id: `vocabulary-${entry.kk.toLocaleLowerCase("kk")}`,
      category: "vocabulary" as const,
      title: entry.kk,
      excerpt: vocabularyText(entry),
    })),
    ...grammarTopics.map((topic, index) => ({
      id: `grammar-${index + 1}`,
      category: "grammar" as const,
      title: topic.title,
      excerpt: `${topic.text} Мысал: ${topic.example}`,
    })),
    ...regions.flatMap((region) =>
      [
        ...region.nature,
        ...region.animals,
        ...region.plants,
        ...region.history,
        ...region.landmarks,
        ...region.culture,
        ...region.foods,
        ...region.famousPeople,
        ...region.resources,
        ...region.industries,
        ...region.agriculture,
        ...region.importance,
      ].map((card, index) => ({
        id: `region-detail-${region.id}-${index}`,
        category: "region" as const,
        title: `${region.nameKk}: ${card.title}`,
        href: `/kazakhstan/${region.slug}`,
        excerpt: card.text,
      })),
    ),
    ...readingBooks.flatMap((book) =>
      book.chapters.map((chapter, index) => ({
        id: `book-chapter-${book.id}-${index}`,
        category: "literature" as const,
        title: `${book.title}: ${chapter.title}`,
        href: `/learn/books/${book.id}`,
        excerpt: chapter.text,
      })),
    ),
    ...historyCities.flatMap((city) =>
      city.objects.map((object) => ({
        id: `history-object-${city.id}-${object.id}`,
        category: "history" as const,
        title: `${city.name}: ${object.title}`,
        href: `/learn/history/${city.id}`,
        excerpt: `${object.fact} ${object.word.term}: ${object.word.meaning}`,
      })),
    ),
    ...questions.map((question, index) => ({
      id: `national-question-${index}`,
      category: "national-game" as const,
      title: question.prompt,
      excerpt: question.explanation,
    })),
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
  const requestedLesson = query.match(
    /(?:сабақ|урок|lesson)\s*#?\s*(\d+)|(?:^|\s)(\d+)[ -]*(?:сабақ|урок)/i,
  );
  const lessonId = requestedLesson
    ? Number(requestedLesson[1] ?? requestedLesson[2])
    : context.currentLesson;
  const word = findVocabulary(query);
  return doshaKnowledge()
    .map((source) => {
      const title = normalize(source.title);
      const body = normalize(source.excerpt);
      let score = title.includes(normalizedQuery) && normalizedQuery ? 18 : 0;
      if (
        source.question &&
        source.question
          .split(" / ")
          .map(normalize)
          .some(
            (q) =>
              q === normalizedQuery ||
              (q.length > 12 && normalizedQuery.includes(q)),
          )
      )
        score += 100;
      if (
        source.lessonId !== undefined &&
        String(source.lessonId) === String(lessonId)
      )
        score += 25;
      if (word && source.category === "vocabulary" && source.title === word.kk)
        score += 60;
      for (const term of queryTerms) {
        const titleMatch = title
          .split(" ")
          .some(
            (word) =>
              word === term ||
              (word.length >= 4 && term.startsWith(word)) ||
              (term.length >= 4 && word.startsWith(term)) ||
              (term.length >= 5 && word.startsWith(term.slice(0, 5))),
          );
        if (titleMatch) score += source.category === "vocabulary" ? 2 : 8;
        if (body.includes(term)) score += 2;
      }
      if (lessonId && source.id === `lesson-${lessonId}`) score += 30;
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
