import type { Level } from "../q-level/types";
import { qualityScore, repairNaturalness } from "./quality";
export function referenceCoach(
  text: string,
  level: Level,
  mode: "writing" | "enrich" | "speaking",
) {
  let suggested = text;
  const changes: string[] = [];
  if (
    mode === "enrich" &&
    text.trim().replace(/[.!?]$/, "") === "Күн жақсы болды"
  ) {
    suggested = ["A0", "A1", "A2"].includes(level)
      ? "Күн ашық әрі жылы болды."
      : level === "B1"
        ? "Күн ашық болып, ауа райы ерекше жайлы еді."
        : "Аспан шайдай ашылып, күн айналаны жылы нұрына бөледі.";
    changes.push(
      "«Жақсы» деген жалпы бағалаудың орнына күннің қандай болғаны нақты сипатталды. Бұл — көркемдету үшін ұсынылған мысал, жаңа факт емес.",
    );
  } else {
    const repaired = repairNaturalness(text);
    suggested = repaired.text;
    changes.push(...repaired.changes);
    if (/магазин/iu.test(suggested)) {
      suggested = suggested
        .replace(/магазинге/giu, "дүкенге")
        .replace(/магазиннен/giu, "дүкеннен")
        .replace(/магазинде/giu, "дүкенде")
        .replace(/магазинді/giu, "дүкенді")
        .replace(/магазин/giu, "дүкен");
      changes.push(
        "Бұл контексте «магазин» сөзінің қазақша баламасы — «дүкен». Жалғауы да балама сөзге сай сақталды.",
      );
    }
    if (!changes.length)
      changes.push(
        "Анықтамалық тексеру нақты түзету таппады. Бұл толық грамматикалық тексеру емес; ойыңды өзгертпей сақтадық.",
      );
  }
  return {
    original: text,
    suggested,
    changes,
    quality: qualityScore(
      suggested,
      level,
      mode === "enrich" ? "literary" : "friendly",
    ),
    mode: "reference" as const,
  };
}
