import { vocabularyTrainingRows } from "./vocabulary-rows";
import { normalizeWord } from "../lib/translation/vocabulary";
import { createHash } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { doshaKnowledge, type KnowledgeSource } from "../lib/dosha/knowledge";
import { dosshaInstructions } from "../lib/dosha/prompt";
import { visionWords } from "../lib/vision/words";
import { writingInstructions, type WritingRequest } from "../lib/dosha/writing";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image"; image: string };
type Message = {
  role: "system" | "user" | "assistant";
  content: string | (TextPart | ImagePart)[];
};
type Row = {
  id: string;
  group?: string;
  source: string;
  messages: Message[];
};

const root = process.cwd();
const arg = (name: string, fallback: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? path.resolve(process.argv[index + 1])
    : path.resolve(root, fallback);
};
const outputDir = arg("--output", "training/data");
const imageDir = arg("--vision-images", "training/vision-images");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function promptFor(source: KnowledgeSource) {
  if (source.id.startsWith("national-question-")) return source.title;
  if (source.id.startsWith("book-chapter-"))
    return `${source.title} бөлімінің мазмұнын түсіндір.`;
  switch (source.category) {
    case "lesson":
      return `${source.title} материалын маған қысқа әрі түсінікті етіп үйрет.`;
    case "region":
      return `${source.title} туралы QazaqDos дерегіне сүйеніп айтып бер.`;
    case "history":
      return `${source.title} туралы қандай маңызды деректер бар?`;
    case "literature":
      return `${source.title} шығармасының тақырыбы мен кейіпкерлерін түсіндір.`;
    case "national-game":
      return `${source.title} ойыны қалай ойналады?`;
    case "grammar":
      return `${source.title} деген не? Мысалмен түсіндір.`;
    case "vocabulary":
      return `«${source.title}» сөзінің мағынасын және бар аудармаларын түсіндір.`;
    case "vision":
      return `«${source.title}» сөзін қазақша үйрет: аудармасы, көпше түрі және мысал керек.`;
    case "robotics":
      return "Робототехникадағы робот, сенсор, қозғалтқыш және алгоритм сөздерін түсіндір.";
  }
}

function answerFor(source: KnowledgeSource) {
  return `${source.excerpt}\n\nШағын тапсырма: осы материал бойынша бір қазақша сөйлем құрап көр.`;
}

function textRows(): Row[] {
  const rows: Row[] = doshaKnowledge().map((source) => ({
    id: source.id,
    group:
      source.category === "vocabulary" || source.category === "vision"
        ? `vocabulary-${normalizeWord(source.title)}`
        : undefined,
    source: source.category,
    messages: [
      { role: "system", content: dosshaInstructions },
      { role: "user", content: promptFor(source) },
      { role: "assistant", content: answerFor(source) },
    ],
  }));
  rows.push(
    ...vocabularyTrainingRows(),
    {
      id: "safety-unknown-fact",
      source: "safety",
      messages: [
        { role: "system", content: dosshaInstructions },
        {
          role: "user",
          content:
            "Білім базасында жоқ кітаптан нақты дәйексөз бен бет нөмірін ойдан жаз.",
        },
        {
          role: "assistant",
          content:
            "Ойдан дәйексөз немесе бет нөмірін бере алмаймын. Нақты үзіндіні жіберсең, мағынасын түсіндіріп, қазақ тілін үйренуге көмектесемін.",
        },
      ],
    },
    {
      id: "style-correction",
      source: "style",
      messages: [
        { role: "system", content: dosshaInstructions },
        { role: "user", content: "Мен мектеп бардым." },
        {
          role: "assistant",
          content:
            "Өте жақын!\n\nБастапқы нұсқа: Мен мектеп бардым.\nДұрыс нұсқа: Мен мектепке бардым.\nСебебі бағытты білдіру үшін «мектеп» сөзіне барыс септігінің -ке жалғауы жалғанады.\n\nЕнді «кітапхана» сөзімен осындай сөйлем құрап көр.",
        },
      ],
    },
    ...(
      [
        {
          id: "writing-essay",
          genre: "essay",
          style: "neutral",
          original: "Мен туған жерді жақсы көрем өйткені ол менің үйім.",
          corrected:
            "Мен туған жерімді жақсы көремін, өйткені ол — менің үйім.",
          explanation:
            "«Көрем» сөзі «көремін» деп толықтырылды; себеп бағыныңқының алдында үтір қойылды. Эсседегі жеке пікір сақталды.",
        },
        {
          id: "writing-letter",
          genre: "formalLetter",
          style: "formal",
          original: "Сәлем. Маған жауап беріңіз тез.",
          corrected:
            "Сәлеметсіз бе! Өтінішіме мүмкіндігінше жақын уақытта жауап беруіңізді сұраймын.",
          explanation:
            "Ресми хатқа сай сыпайы амандасу мен өтініш формасы қолданылды; негізгі өтініш өзгермеді.",
        },
        {
          id: "writing-story",
          genre: "story",
          style: "creative",
          original: "Бала орман кірді. Ол ағаш көрді.",
          corrected: "Бала орманға кірді. Ол ағашты көрді.",
          explanation:
            "«Орманға» сөзі бағытты, «ағашты» сөзі қимыл нысанын білдіреді. Оқиғаға ойдан жаңа дерек қосылмады.",
        },
        {
          id: "writing-social",
          genre: "socialPost",
          style: "simple",
          original: "Бүгін біз музей бардық өте қызық болды",
          corrected: "Бүгін біз музейге бардық. Өте қызық болды!",
          explanation:
            "«Музейге» барыс септігімен берілді, екі ой жеке сөйлемге бөлінді. Жазбаның жеңіл тілі сақталды.",
        },
        {
          id: "writing-academic",
          genre: "academic",
          style: "formal",
          original: "Зерттеуде үш мәтін қаралды олар салыстырылды.",
          corrected: "Зерттеуде үш мәтін қаралды және салыстырылды.",
          explanation:
            "Қайталанған бастауыш алынып, екі әрекет бір сөйлемде байланыстырылды. Нәтиже немесе сан ойдан қосылмады.",
        },
      ] as const
    ).map((example) => ({
      id: example.id,
      source: "writing",
      messages: [
        {
          role: "system" as const,
          content: `${dosshaInstructions}\n${writingInstructions({ genre: example.genre, style: example.style } as WritingRequest)}`,
        },
        { role: "user" as const, content: example.original },
        {
          role: "assistant" as const,
          content: `Түзетілген мәтін:\n${example.corrected}\n\nНегізгі өзгерістер:\n${example.explanation}`,
        },
      ],
    })),
  );
  return rows;
}

const split = (id: string) =>
  parseInt(createHash("sha256").update(id).digest("hex").slice(0, 8), 16) %
    20 ===
  0
    ? "validation"
    : "train";

async function imagesFor(wordId: string) {
  const directory = path.join(imageDir, wordId);
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(
        (entry) =>
          entry.isFile() &&
          imageExtensions.has(path.extname(entry.name).toLowerCase()),
      )
      .map((entry) => path.join(directory, entry.name))
      .sort();
  } catch {
    return [];
  }
}

async function visionRows() {
  const rows: Row[] = [];
  const missing: string[] = [];
  for (const word of visionWords) {
    const images = await imagesFor(word.id);
    if (!images.length) missing.push(word.id);
    for (const [index, image] of images.entries()) {
      const output = {
        quality: "clear",
        summary: `Суретте ${word.kk} көрінеді.`,
        tip: "Затты атап, мысал сөйлемді дауыстап айт.",
        objects: [
          {
            id: word.id,
            kk: word.kk,
            ru: word.ru,
            en: word.en,
            plural: word.plural,
            example: word.easy,
            description: `${word.category} санатындағы күнделікті зат.`,
            confidence: 1,
          },
        ],
      };
      rows.push({
        id: `vision-${word.id}-${index + 1}`,
        source: "vision",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Суреттегі заттарды танып, тек JSON қайтар.",
              },
              { type: "image", image: path.resolve(image) },
            ],
          },
          {
            role: "assistant",
            content: [{ type: "text", text: JSON.stringify(output) }],
          },
        ],
      });
    }
  }
  return { rows, missing };
}

const jsonl = (rows: Row[]) =>
  rows.map((row) => JSON.stringify(row)).join("\n") + "\n";

async function main() {
  await mkdir(outputDir, { recursive: true });
  const text = textRows();
  const vision = await visionRows();
  const groups = {
    "dosha-train.jsonl": text.filter(
      (row) => split(row.group ?? row.id) === "train",
    ),
    "dosha-validation.jsonl": text.filter(
      (row) => split(row.group ?? row.id) === "validation",
    ),
    "dosha-vision-train.jsonl": vision.rows.filter(
      (row) => split(row.group ?? row.id) === "train",
    ),
    "dosha-vision-validation.jsonl": vision.rows.filter(
      (row) => split(row.group ?? row.id) === "validation",
    ),
  };
  for (const [file, rows] of Object.entries(groups))
    await writeFile(path.join(outputDir, file), jsonl(rows), "utf8");
  await writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sources: [
          "lib/curriculum.ts",
          "lib/travel/catalog.ts",
          "lib/travel/vocabulary.ts",
          "lib/travel/extra-words.ts",
          "lib/data.ts",
          "lib/history/catalog.ts",
          "lib/books/catalog.ts",
          "lib/national/world-catalog.ts",
          "lib/national/catalog.ts",
          "lib/friend/grammar.ts",
          "lib/vision/words.ts",
          "lib/dosha/knowledge.ts",
          "lib/translation/vocabulary.ts",
          "lib/translation/expanded.ts",
          "training/vocabulary-rows.ts",
          "lib/translation/dictionary.ts",
          "lib/learning/content.ts",
          "lib/dosha/prompt.ts",
        ],
        counts: Object.fromEntries(
          Object.entries(groups).map(([file, rows]) => [file, rows.length]),
        ),
        visionImagesDirectory: imageDir,
        visionWordsWithoutImages: vision.missing,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log(
    JSON.stringify(
      {
        outputDir,
        counts: Object.fromEntries(
          Object.entries(groups).map(([file, rows]) => [file, rows.length]),
        ),
        visionWordsWithoutImages: vision.missing,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
