import type { Level } from "../q-level/types";
import type { Quality, Style } from "./types";
export const calquePatterns = [
  {
    pattern: /Сіздің сұрағыңыз бойынша ақпарат ұсынылады/giu,
    replacement: "Бұл жерде негізгі ой мынау",
    reason: "Қалыпты түсіндіруде артық кеңселік оралым.",
  },
  {
    pattern: /Сізге келесі әрекеттерді орындау қажет/giu,
    replacement: "Алдымен мынаны жасап көр",
    reason: "Достық кеңесте қарапайым етістік табиғи естіледі.",
  },
  {
    pattern: /болып табылады/giu,
    replacement: "",
    reason:
      "Анықтамада «болып табылады» көбіне артық; сөйлемді қайта құру керек.",
  },
  {
    pattern: /үлкен рөл ойнайды/giu,
    replacement: "маңызды рөл атқарады",
    reason: "«Рөл атқару» — осы мағынадағы қалыпты тіркес.",
  },
  {
    pattern: /шешім қабылдау жасау/giu,
    replacement: "шешім қабылдау",
    reason: "Қайталанған көмекші етістік қажет емес.",
  },
  {
    pattern: /менің ойым бойынша/giu,
    replacement: "меніңше",
    reason: "Қысқа пікірде «меніңше» ықшам әрі табиғи.",
  },
];
export const schoolUnsafe = (text: string) =>
  /порнограф|эротикалық|нақты жыныстық|есірткіні (жасау|дайындау)/iu.test(text);
export function qualityScore(
  text: string,
  level: Level,
  style: Style,
): Quality {
  const words = text.match(/[\p{L}\p{N}-]+/gu) ?? [];
  const sentences = text
    .split(/[.!?\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const issues: string[] = [];
  let natural = 100,
    grammar = 100,
    levelMatch = 100,
    styleMatch = 100;
  for (const item of calquePatterns) {
    item.pattern.lastIndex = 0;
    if (item.pattern.test(text)) {
      natural -= 12;
      issues.push(item.reason);
    }
  }
  if (/(?<!\p{L})(\p{L}{3,})\s+\1(?!\p{L})/iu.test(text)) {
    grammar -= 12;
    issues.push("Қатар қайталанған сөзді тексер.");
  }
  if (/\s+[,.!?]/u.test(text)) {
    grammar -= 5;
    issues.push("Тыныс белгісінің алдындағы бос орынды тексер.");
  }
  if (!words.length) {
    grammar = 0;
    natural = 0;
    issues.push("Мағыналы мәтін жоқ.");
  }
  const longest = Math.max(
    0,
    ...sentences.map((s) => (s.match(/\p{L}+/gu) ?? []).length),
  );
  const limit =
    level === "A0" || level === "A1" ? 14 : level === "A2" ? 20 : 36;
  if (longest > limit) {
    levelMatch -= Math.min(45, (longest - limit) * 3);
    issues.push("Кей сөйлем оқушы деңгейіне тым ұзақ.");
  }
  if (
    ["A0", "A1", "A2"].includes(level) &&
    /парадигма|герменевтика|эпистемология|дискурс|экзистенциал/iu.test(text)
  ) {
    levelMatch -= 25;
    issues.push("Терминді күнделікті сөзбен түсіндір.");
  }
  const ratio = words.length
    ? new Set(words.map((w) => w.toLowerCase())).size / words.length
    : 0;
  const lexical =
    words.length < 8 ? 85 : Math.round(Math.min(100, 55 + ratio * 50));
  if (
    style === "friendly" &&
    /жоғарыда аталған|тиісті шаралар|жүзеге асыру қажет/iu.test(text)
  ) {
    styleMatch -= 20;
    issues.push("Достық стильге тым ресми оралым.");
  }
  if (schoolUnsafe(text)) {
    natural = 0;
    styleMatch = 0;
    issues.push("Мектеп жасына сай емес мазмұн.");
  }
  const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
  return {
    score: clamp(
      grammar * 0.2 +
        natural * 0.3 +
        lexical * 0.1 +
        levelMatch * 0.25 +
        styleMatch * 0.15,
    ),
    grammar_score: clamp(grammar),
    naturalness_score: clamp(natural),
    lexical_richness_score: lexical,
    level_match_score: clamp(levelMatch),
    style_match_score: clamp(styleMatch),
    issues,
    heuristic: true,
  };
}
export function repairNaturalness(text: string): {
  text: string;
  changes: string[];
} {
  let output = text;
  const changes: string[] = [];
  for (const item of calquePatterns) {
    item.pattern.lastIndex = 0;
    if (!item.replacement || !item.pattern.test(output)) continue;
    item.pattern.lastIndex = 0;
    output = output.replace(item.pattern, (match) =>
      match[0] !== match[0].toLocaleLowerCase("kk-KZ")
        ? item.replacement[0].toLocaleUpperCase("kk-KZ") +
          item.replacement.slice(1)
        : item.replacement,
    );
    changes.push(item.reason);
  }
  return { text: output, changes };
}
export async function qualityGate(
  generate: (repair?: string) => Promise<string>,
  level: Level,
  style: Style,
  fallback: string,
  age: "school" | "adult" = "school",
) {
  let text = await generate();
  let quality = qualityScore(text, level, style),
    regenerated = false;
  if (quality.score < 78 || quality.issues.length > 0) {
    regenerated = true;
    try {
      const candidate = await generate(
        `Алдыңғы жауаптың тіл сапасын жақсарт. Мағынасын сақта. ${quality.issues.join(" ")} Қысқа, табиғи әрі оқушы деңгейіне сай қайта жаз. Қайталанған қателерді түзет.`,
      );
      const next = qualityScore(candidate, level, style);
      if (next.score > quality.score) {
        text = candidate;
        quality = next;
      }
    } catch {
      /* Keep the available answer unless it fails the final gate. */
    }
  }
  if (quality.score < 65 || (age === "school" && schoolUnsafe(text))) {
    text =
      age === "school" && schoolUnsafe(fallback)
        ? "Оқу үшін мектеп жасына сай мысал таңда. Қазақ тілін қауіпсіз әрі түсінікті тақырыптармен жаттықтырайық."
        : fallback;
    quality = qualityScore(text, level, style);
  }
  return { text, quality, regenerated };
}
