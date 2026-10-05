import type { VisionResult } from "../vision/recognize";
import type { Level } from "../q-level/types";
import { findWord } from "./words";
import { qualityScore, repairNaturalness, schoolUnsafe } from "./quality";
export function visionDescription(word: string, level: Level, current = "") {
  const beginner = ["A0", "A1", "A2"].includes(level);
  if (word === "бауырсақ")
    return beginner
      ? "Бұл — бауырсақ. Бауырсақ — қазақтың дәстүрлі тағамы."
      : level === "B1"
        ? "Бұл — бауырсақ. Қазақ дастарқанында бауырсақ қонаққа жиі ұсынылады."
        : "Бауырсақ — қазақ дастарқанында кең тараған дәстүрлі қамыр тағамдарының бірі.";
  if (word === "домбыра")
    return beginner
      ? "Бұл — домбыра. Домбыра — қазақтың ұлттық музыкалық аспабы."
      : level === "C1"
        ? "Домбыра — қазақтың күй дәстүрі мен ән өнерінде ерекше орын алатын қос ішекті аспап. Оның үні орындаушының қағысы мен шығарма сипатына қарай түрленеді."
        : "Домбыра — қазақ мәдениетіндегі маңызды музыкалық аспаптардың бірі.";
  const known = findWord(word);
  if (known && known.meaning && !known.meaning.includes("("))
    return `Бұл — ${word}. ${known.meaning}`;
  if (!beginner && current && qualityScore(current, level, "daily").score >= 78)
    return repairNaturalness(current).text;
  return `Бұл заттың қазақша атауы — «${word}».`;
}
export function enrichVision(result: VisionResult, level: Level) {
  return {
    ...result,
    summary: schoolUnsafe(result.summary)
      ? "Суреттегі заттар төменде көрсетілген."
      : repairNaturalness(result.summary).text,
    tip: schoolUnsafe(result.tip)
      ? "Затты анық түсіріп көр."
      : repairNaturalness(result.tip).text,
    languageLevel: level,
    objects: result.objects
      .filter((o) => !schoolUnsafe(o.kk))
      .map((o) => {
        const word = findWord(o.id ?? o.kk);
        return {
          ...o,
          description: visionDescription(o.kk, level, o.description),
          example:
            word?.example ??
            (schoolUnsafe(o.example)
              ? `Қазақша атауы — «${o.kk}».`
              : o.example),
          lesson: word ?? null,
        };
      }),
  };
}
export function visionLanguageScore(result: VisionResult, level: Level) {
  return qualityScore(
    [
      result.summary,
      result.tip,
      ...result.objects.flatMap((o) => [o.description, o.example]),
    ].join("\n"),
    level,
    "daily",
  );
}
export async function visionLanguageGate(
  generate: (repair?: string) => Promise<VisionResult>,
  level: Level,
) {
  let result = await generate();
  let quality = visionLanguageScore(result, level),
    regenerated = false;
  if (quality.score < 78 || quality.issues.length > 0) {
    regenerated = true;
    try {
      const candidate = await generate(
        `Сипаттама мен сөйлемдерді ${level} деңгейіне сай қысқа, табиғи қазақша бер. ${quality.issues.join(" ")}`,
      );
      const checked = visionLanguageScore(candidate, level);
      if (checked.score > quality.score) {
        result = candidate;
        quality = checked;
      }
    } catch {
      /* Curated enrichment remains available if a retry fails. */
    }
  }
  const enriched = enrichVision(result, level);
  return {
    ...enriched,
    languageQuality: qualityScore(
      [
        enriched.summary,
        ...enriched.objects.flatMap((o) => [o.description, o.example]),
      ].join("\n"),
      level,
      "daily",
    ),
    languageRegenerated: regenerated,
  };
}
