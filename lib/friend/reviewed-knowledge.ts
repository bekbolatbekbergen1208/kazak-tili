export type ReviewedKnowledge = {
  question: string;
  answer: string;
  keywords?: string[] | null;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("kk")
    .replace(/[^a-zа-яәғқңөұүһі0-9\s-]/giu, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        !["деген", "дегеніміз", "қандай", "қалай", "туралы", "үшін"].includes(
          word,
        ),
    );

export function selectReviewedKnowledge(
  message: string,
  rows: ReviewedKnowledge[],
  limit = 3,
) {
  const query = new Set(normalize(message));
  return rows
    .map((row) => {
      const terms = new Set([
        ...normalize(row.question),
        ...(row.keywords ?? []).flatMap(normalize),
      ]);
      const score = [...query].reduce(
        (total, word) => total + (terms.has(word) ? word.length : 0),
        0,
      );
      return { row, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row }) => row);
}

export function reviewedKnowledgeContext(rows: ReviewedKnowledge[]) {
  if (!rows.length) return "";
  return rows
    .map(
      (row, index) =>
        `${index + 1}. Сұрақ: ${row.question}\nДұрыс жауап: ${row.answer}`,
    )
    .join("\n\n");
}
