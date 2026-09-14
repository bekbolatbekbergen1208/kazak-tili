import { visionWords } from "./words";
import { requestLocalChat } from "@/lib/ai/local";

export type DetectedObject = {
  id: string | null;
  kk: string;
  ru: string;
  en: string;
  plural: string;
  example: string;
  description: string;
  confidence: number;
};
export type VisionResult = {
  quality: "clear" | "blurry" | "dark" | "uncertain" | "no_objects";
  summary: string;
  tip: string;
  objects: DetectedObject[];
  word: { id: string; kk: string } | null;
  confidence: number;
  alternatives: { id: string; kk: string }[];
};
const qualities = ["clear", "blurry", "dark", "uncertain", "no_objects"];
const fields = ["kk", "ru", "en", "plural", "example", "description"] as const;
export const visionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["quality", "summary", "tip", "objects"],
  properties: {
    quality: { type: "string", enum: qualities },
    summary: { type: "string" },
    tip: { type: "string" },
    objects: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", ...fields, "confidence"],
        properties: {
          id: {
            type: ["string", "null"],
            enum: [null, ...visionWords.map((w) => w.id)],
          },
          ...Object.fromEntries(
            fields.map((field) => [field, { type: "string" }]),
          ),
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  },
};
export function validateVisionImage(value: unknown): string {
  if (typeof value !== "string" || value.length > 4_500_000)
    throw Error("INVALID_IMAGE");
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) throw Error("INVALID_IMAGE");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 12 || bytes.toString("base64") !== match[2])
    throw Error("INVALID_IMAGE");
  const valid =
    match[1] === "jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : match[1] === "png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw Error("INVALID_IMAGE");
  return value;
}
export function parseVisionResult(input: unknown): VisionResult {
  if (!input || typeof input !== "object") throw Error("INVALID_VISION_RESULT");
  const b = input as Record<string, unknown>;
  if (
    !qualities.includes(String(b.quality)) ||
    typeof b.summary !== "string" ||
    b.summary.length > 1200 ||
    typeof b.tip !== "string" ||
    b.tip.length > 600 ||
    !Array.isArray(b.objects) ||
    b.objects.length > 6
  )
    throw Error("INVALID_VISION_RESULT");
  const objects: DetectedObject[] = b.objects.map((o) => {
    if (
      !o ||
      typeof o !== "object" ||
      !(o.id === null || visionWords.some((w) => w.id === o.id)) ||
      fields.some(
        (field) =>
          typeof o[field] !== "string" ||
          !o[field].trim() ||
          o[field].length >
            (field === "description" || field === "example" ? 600 : 100),
      ) ||
      typeof o.confidence !== "number" ||
      !Number.isFinite(o.confidence) ||
      o.confidence < 0 ||
      o.confidence > 1
    )
      throw Error("INVALID_VISION_RESULT");
    const known = visionWords.find((w) => w.id === o.id);
    return {
      id: o.id,
      kk: known?.kk ?? o.kk.trim(),
      ru: known?.ru ?? o.ru.trim(),
      en: known?.en ?? o.en.trim(),
      plural: known?.plural ?? o.plural.trim(),
      example: known?.easy ?? o.example.trim(),
      description: o.description.trim(),
      confidence:
        b.quality === "clear" ? o.confidence : Math.min(o.confidence, 0.65),
    };
  });
  const unique =
    b.quality === "no_objects"
      ? []
      : objects.filter(
          (o, i) =>
            objects.findIndex(
              (other) =>
                (o.id && other.id === o.id) ||
                other.kk.toLocaleLowerCase() === o.kk.toLocaleLowerCase(),
            ) === i,
        );
  const main = unique[0];
  return {
    quality: b.quality as VisionResult["quality"],
    summary: b.summary.trim(),
    tip: b.tip.trim(),
    objects: unique,
    word: main?.id ? { id: main.id, kk: main.kk } : null,
    confidence: main?.confidence ?? 0,
    alternatives: unique
      .slice(1)
      .filter((o) => o.id)
      .map((o) => ({ id: o.id!, kk: o.kk })),
  };
}
export async function requestVision({
  key: _key,
  model,
  image,
  signal,
  fetcher = fetch,
}: {
  key: string;
  model: string;
  image: string;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
}): Promise<VisionResult> {
  const text = await requestLocalChat({
    model,
    fetcher,
    signal,
    maxTokens: 3000,
    messages: [
      {
        role: "system",
        content: `Сен QazaqDos платформасының көру арқылы сөз үйрететін көмекшісісің.
Суреттегі күнделікті заттарды таны. Ең көрініп тұрған 1-6 затты қайтар. Каталогтағы зат болса exact id қолдан, сәйкес келмесе id=null. Адамды, жеке құжатты, сезімтал деректі анықтама.
Жауап тек JSON болсын, markdown жазба. Пішім:
{"quality":"clear|blurry|dark|uncertain|no_objects","summary":"қысқа қазақша сипаттама","tip":"қысқа кеңес","objects":[{"id":null,"kk":"қазақша атау","ru":"орысша","en":"english","plural":"көпше түрі","example":"қазақша сөйлем","description":"қысқа сипаттама","confidence":0.8}]}
Catalog: ${visionWords.map((w) => `${w.id}=${w.en} (${w.kk})`).join("; ")}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Суреттегі заттарды танып, JSON қайтар." },
          { type: "image_url", image_url: { url: validateVisionImage(image) } },
        ],
      },
    ],
  });
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return parseVisionResult(JSON.parse(json));
}
