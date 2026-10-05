import type { Level } from "../q-level/types";

export type LiteraryDnaDimensions = {
  lexicalRichness: number;
  dialogueNaturalness: number;
  descriptionDepth: number;
  emotionalNuance: number;
  sentenceComplexity: number;
  figurativeDensity: number;
  culturalContext: number;
  narrativeDynamics: number;
};

export type LiteraryDnaProfile = {
  id: string;
  workTitle: string;
  author: string;
  rightsMode: "metadata_and_analysis_only";
  recommendedLevels: Level[];
  dimensions: LiteraryDnaDimensions;
  traits: string[];
  learningGoals: string[];
};

export const literaryDnaProfiles: LiteraryDnaProfile[] = [
  {
    id: "abai-zholy-analysis",
    workTitle: "Абай жолы",
    author: "Мұхтар Әуезов",
    rightsMode: "metadata_and_analysis_only",
    recommendedLevels: ["B1", "B2", "C1"],
    dimensions: {
      lexicalRichness: 0.92,
      dialogueNaturalness: 0.82,
      descriptionDepth: 0.95,
      emotionalNuance: 0.84,
      sentenceComplexity: 0.88,
      figurativeDensity: 0.72,
      culturalContext: 0.96,
      narrativeDynamics: 0.74,
    },
    traits: [
      "rich_nature_description",
      "cultural_context",
      "character_detail",
      "complex_narration",
      "subtle_imagery",
    ],
    learningGoals: [
      "Табиғат пен ортаны нақты деталь арқылы сипаттау",
      "Сөйлем құрылымын түрлендіріп, мағынаны жоғалтпау",
      "Мәдени контексті түсінікті сөзбен жеткізу",
    ],
  },
  {
    id: "ulpan-analysis",
    workTitle: "Ұлпан",
    author: "Ғабит Мүсірепов",
    rightsMode: "metadata_and_analysis_only",
    recommendedLevels: ["B1", "B2", "C1"],
    dimensions: {
      lexicalRichness: 0.82,
      dialogueNaturalness: 0.91,
      descriptionDepth: 0.72,
      emotionalNuance: 0.8,
      sentenceComplexity: 0.74,
      figurativeDensity: 0.58,
      culturalContext: 0.9,
      narrativeDynamics: 0.78,
    },
    traits: [
      "strong_character_voice",
      "concise_dialogue",
      "social_context",
      "traditional_register",
      "leadership_language",
    ],
    learningGoals: [
      "Қысқа әрі нық диалог құру",
      "Кейіпкер мінезін ісі мен сөзі арқылы көрсету",
      "Құрмет пен жауапкершілікті табиғи тілмен білдіру",
    ],
  },
  {
    id: "mahabbat-kyzyk-analysis",
    workTitle: "Махаббат, қызық мол жылдар",
    author: "Әзілхан Нұршайықов",
    rightsMode: "metadata_and_analysis_only",
    recommendedLevels: ["A2", "B1", "B2"],
    dimensions: {
      lexicalRichness: 0.76,
      dialogueNaturalness: 0.95,
      descriptionDepth: 0.64,
      emotionalNuance: 0.92,
      sentenceComplexity: 0.65,
      figurativeDensity: 0.52,
      culturalContext: 0.72,
      narrativeDynamics: 0.7,
    },
    traits: [
      "emotional_dialogue",
      "relationship_language",
      "soft_narration",
      "natural_conversation",
      "youth_communication",
    ],
    learningGoals: [
      "Сезімді асыра сілтемей табиғи жеткізу",
      "Жастар арасындағы жылы диалогты қазақша құру",
      "Қарапайым сөйлемді эмоциялық реңкпен байыту",
    ],
  },
  {
    id: "shakan-sheri-analysis",
    workTitle: "Шақан-Шері",
    author: "Мұхтар Мағауин",
    rightsMode: "metadata_and_analysis_only",
    recommendedLevels: ["B1", "B2", "C1"],
    dimensions: {
      lexicalRichness: 0.86,
      dialogueNaturalness: 0.68,
      descriptionDepth: 0.87,
      emotionalNuance: 0.82,
      sentenceComplexity: 0.79,
      figurativeDensity: 0.66,
      culturalContext: 0.76,
      narrativeDynamics: 0.95,
    },
    traits: [
      "dynamic_narration",
      "nature_vocabulary",
      "tension",
      "psychological_description",
      "atmosphere",
    ],
    learningGoals: [
      "Қимылды динамикалық етістікпен беру",
      "Кеңістік пен атмосфераны қысқа детальмен сезіндіру",
      "Кейіпкердің ішкі күйін әрекет арқылы көрсету",
    ],
  },
];

export function literaryDnaForLevel(level: Level) {
  return literaryDnaProfiles.filter((profile) =>
    profile.recommendedLevels.includes(level),
  );
}
