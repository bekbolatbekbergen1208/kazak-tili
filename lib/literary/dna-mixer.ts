import type { Level } from "../q-level/types";
import { literaryDnaProfiles, type LiteraryDnaDimensions } from "./dna";
import type { Style } from "./types";

type DimensionKey = keyof LiteraryDnaDimensions;

const intentWeights: Array<{
  pattern: RegExp;
  dimensions: DimensionKey[];
}> = [
  {
    pattern: /диалог|сөйлес|әңгімелес|реплика|conversation/iu,
    dimensions: ["dialogueNaturalness", "emotionalNuance", "culturalContext"],
  },
  {
    pattern: /табиғат|теңіз|дала|тау|күз|көктем|қыс|жаз|сипатта|көрініс/iu,
    dimensions: ["descriptionDepth", "lexicalRichness", "figurativeDensity"],
  },
  {
    pattern: /сезім|қуаныш|сағыныш|өкініш|толқу|көңіл|эмоци/iu,
    dimensions: ["emotionalNuance", "dialogueNaturalness", "lexicalRichness"],
  },
  {
    pattern: /оқиға|шиеленіс|қимыл|әрекет|динами|сюжет|әңгіме құра/iu,
    dimensions: ["narrativeDynamics", "descriptionDepth", "sentenceComplexity"],
  },
  {
    pattern: /көркем|әдеби|эссе|ойтолғау|метафора|теңеу/iu,
    dimensions: [
      "lexicalRichness",
      "descriptionDepth",
      "figurativeDensity",
      "sentenceComplexity",
    ],
  },
];

const labels: Record<DimensionKey, string> = {
  lexicalRichness: "сөздік байлық",
  dialogueNaturalness: "табиғи диалог",
  descriptionDepth: "нақты сипаттау",
  emotionalNuance: "эмоциялық реңк",
  sentenceComplexity: "сөйлем құрылымының түрленуі",
  figurativeDensity: "бейнелі тіл",
  culturalContext: "мәдени контекст",
  narrativeDynamics: "баяндау динамикасы",
};

const levelCap: Record<Level, number> = {
  A0: 0.15,
  A1: 0.2,
  A2: 0.4,
  B1: 0.62,
  B2: 0.82,
  C1: 1,
};

function requestedDimensions(message: string, style: Style): DimensionKey[] {
  const found = new Set<DimensionKey>();
  for (const item of intentWeights)
    if (item.pattern.test(message))
      for (const dimension of item.dimensions) found.add(dimension);

  if (style === "literary" || style === "storytelling") {
    found.add("lexicalRichness");
    found.add("descriptionDepth");
    found.add("emotionalNuance");
  }

  return [...found];
}

export function literaryDnaGuidance(
  message: string,
  level: Level,
  style: Style,
): string {
  const dimensions = requestedDimensions(message, style);
  if (!dimensions.length || ["A0", "A1"].includes(level)) return "";

  const candidates = literaryDnaProfiles.filter((profile) =>
    profile.recommendedLevels.includes(level),
  );
  if (!candidates.length) return "";

  const ranked = candidates
    .map((profile) => ({
      profile,
      score: dimensions.reduce(
        (sum, key) => sum + profile.dimensions[key],
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const cap = levelCap[level];
  const mixed = dimensions
    .map((key) => {
      const value =
        ranked.reduce((sum, item) => sum + item.profile.dimensions[key], 0) /
        ranked.length;
      return [key, Math.min(value, cap)] as const;
    })
    .sort((a, b) => b[1] - a[1]);

  const emphasis = mixed
    .filter(([, value]) => value >= Math.min(0.45, cap))
    .slice(0, 4)
    .map(([key, value]) => `${labels[key]}=${value.toFixed(2)}`)
    .join(", ");

  const goals = [...new Set(ranked.flatMap((item) => item.profile.learningGoals))]
    .slice(0, 4)
    .join("; ");

  if (!emphasis) return "";

  return [
    "Literary DNA guidance (абстракт тілдік принциптер ғана):",
    emphasis,
    `Оқу мақсаты: ${goals}`,
    "Белгілі автордың стилін қайталама, шығарма мәтінін көшірме және дәйексөз ойлап таппа. Осы белгілерді тек жаңа, түпнұсқа қазақша сөйлем құруға пайдалан.",
  ].join("\n");
}
