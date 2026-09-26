import { findKazakhExample } from "../dosha/kazakh-examples";
import { searchDoshaKnowledge } from "../dosha/knowledge";
import { findVocabulary, vocabularyText } from "../translation/vocabulary";
import { readingBooks } from "../books/catalog";
import { grammarTopics } from "./grammar";
export const friendSuggestions = [
  "Қазақ тілінде неше септік бар?",
  "Зат есім деген не?",
  "Менің сөйлемімді тексер",
  "Есімше мен көсемшенің айырмасы қандай?",
  "Ағылшыншадан қазақшаға аудар",
  "Неге аспан көк?",
];
export function referenceAnswer(
  message: string,
  history: { role: string; content: string }[] = [],
) {
  const example = findKazakhExample(message);
  if (example) return { reply: example.answer, topic: example.questions[0] };
  const clean = (s: string) =>
    s
      .toLocaleLowerCase()
      .replace(/[«»"“”?!.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  let text = clean(message);
  if (/^(тағы|мысал|мысалы|жалғастыр|пример)/.test(text))
    text +=
      " " +
      clean(
        [...history].reverse().find((x) => x.role === "user")?.content ?? "",
      );
  const sources = searchDoshaKnowledge(message);
  const exact = sources.filter((source) =>
    source.question?.split(" / ").some((question) => clean(question) === text),
  );
  if (exact.length) {
    const answers = new Set(
      exact.map((source) => source.excerpt.split("\n")[0]),
    );
    return answers.size === 1
      ? {
          reply: `${exact[0].title}\n\n${exact[0].excerpt}`,
          topic: exact[0].title,
        }
      : {
          reply:
            "Бұл сұрақ бірнеше сабақта кездеседі. Сабақтың нөмірін немесе кітаптың атауын және сұрақты бірге жібер.",
          topic: "Тапсырманы нақтылау",
        };
  }
  if (
    /(?:сабақ|урок|lesson)\s*#?\s*\d+|\d+[ -]*(?:сабақ|урок)/i.test(message) &&
    sources[0]?.category === "lesson"
  )
    return {
      reply: `${sources[0].title}\n\n${sources[0].excerpt}`,
      topic: sources[0].title,
    };
  const book = readingBooks.find(
    (b) =>
      text.includes(clean(b.title)) ||
      (b.id === "qozha" && text.includes("қожа")) ||
      (b.id === "qara-soz" && text.includes("қара сөз")),
  );
  if (book)
    return {
      reply: `${book.title} — ${book.author}.\n\n${book.summary}\n\n${book.chapters.map((c) => `${c.title}: ${c.text}`).join("\n\n")}\n\nКейіпкерлер: ${book.characters.map((c) => c.name).join(", ")}.\n\nОқу шолуы мен ойындар: /learn/books/${book.id}`,
      topic: book.title,
    };
  const letters: Record<string, string> = {
    ә: "а",
    ғ: "г",
    қ: "к",
    ң: "н",
    ө: "о",
    ұ: "у",
    ү: "у",
    һ: "х",
    і: "и",
  };
  const keyboardForm = (value: string) =>
    value.replace(/[әғқңөұүһі]/g, (letter) => letters[letter]);
  const search = keyboardForm(text);
  // Prefer specific phrases and tolerate keyboards without Kazakh letters.
  const matches = grammarTopics
    .map((topic) => ({
      topic,
      score: Math.max(
        0,
        ...topic.keys.map((key) =>
          search.includes(keyboardForm(key)) ? key.length : 0,
        ),
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  const selected = matches.slice(
    0,
    /айырма|салыстыр|разниц|сравни| мен | және /.test(text) ? 3 : 1,
  );
  if (selected.length)
    return {
      reply: selected
        .map(
          ({ topic }) =>
            `${topic.title}\n\n${topic.text}\n\nМысал және жаттығу:\n${topic.example}`,
        )
        .join("\n\n"),
      topic: selected.map(({ topic }) => topic.title).join(", "),
    };
  const word = findVocabulary(message);
  if (word)
    return {
      reply: `${vocabularyText(word)}\n\nШағын тапсырма: «${word.kk}» сөзімен сөйлем құрап көр.`,
      topic: word.kk,
    };
  return {
    reply:
      "Бұл сұраққа анықтамалығымда дайын жауап жоқ. Еркін сұрақтарға жауап беретін AI режимі әзірге қосылмаған.\n\nҚазір септік, сөз таптары, шақтар, жалғау, сөйлем мүшелері, синонимдер және «Кітап әлеміндегі» шығармалар бойынша көмектесе аламын. «Септіктерді түсіндір» немесе «Жусан иісі туралы айт» деп жаз.",
    topic: null,
  };
}
