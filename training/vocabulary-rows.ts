import { siteVocabulary, normalizeWord } from "../lib/translation/vocabulary";
import { expandedVocabulary } from "../lib/translation/expanded";
import { dosshaInstructions } from "../lib/dosha/prompt";

export function vocabularyTrainingRows() {
  return siteVocabulary().flatMap((entry) => {
    const group = `vocabulary-${normalizeWord(entry.kk)}`;
    const examples: { task: string; question: string; answer: string }[] = [];
    for (const language of ["ru", "en"] as const) {
      const translation = entry.translation[language];
      if (!translation) continue;
      const name = language === "ru" ? "орыс" : "ағылшын";
      examples.push(
        {
          task: `translate-${language}`,
          question: `«${entry.kk}» сөзін не тіркесін ${name} тіліне аудар.`,
          answer: translation,
        },
        {
          task: `from-${language}`,
          question: `${name === "орыс" ? "Орыс" : "Ағылшын"} тіліндегі «${translation.split(";")[0].trim()}» сөзінің қазақша бір аудармасын бер.`,
          answer: entry.kk,
        },
      );
    }
    const example = expandedVocabulary.find(
      (word) => normalizeWord(word.kk) === normalizeWord(entry.kk),
    )?.example;
    if (example)
      examples.push({
        task: "example",
        question: `«${entry.kk}» сөзімен немесе оның түрленген тұлғасымен қазақша сөйлем құра.`,
        answer: example,
      });
    return examples.map(({ task, question, answer }) => ({
      id: `${group}-${task}`,
      group,
      source: "vocabulary-practice",
      messages: [
        { role: "system" as const, content: dosshaInstructions },
        { role: "user" as const, content: question },
        { role: "assistant" as const, content: answer },
      ],
    }));
  });
}
