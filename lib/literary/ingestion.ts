import { rights, type CorpusItem, type Chunk } from "./types";
import { levels } from "../q-level/types";
import { schoolUnsafe } from "./quality";
export function parseSource(value: unknown): CorpusItem {
  if (!value || typeof value !== "object")
    throw Error("Материал дерегі жарамсыз.");
  const b = value as Record<string, unknown>;
  if (!rights.includes(b.copyright_status as CorpusItem["copyright_status"]))
    throw Error(
      "Құқық мәртебесі анық емес немесе шектелген. Материал қабылданбайды.",
    );
  const read = (key: string, max: number, min = 1) => {
    const v = typeof b[key] === "string" ? (b[key] as string).trim() : "";
    if (v.length < min || v.length > max)
      throw Error(`${key}: ${min}–${max} таңба қажет.`);
    return v;
  };
  const license = read("license", 300),
    evidence = read("rights_evidence", 1500, 15),
    text = read("text", 20000, 20);
  if (/[^\s]{801,}/u.test(text))
    throw Error("Мәтінде шамадан тыс ұзын сөз немесе код бар.");
  if (b.copyright_status === "short_approved_excerpt" && text.length > 1200)
    throw Error("Қысқа мақұлданған үзінді 1200 таңбадан аспауы керек.");
  if (!levels.includes(b.level as CorpusItem["level"]))
    throw Error("Деңгейді таңдаңыз.");
  if (
    ![
      "simple",
      "daily",
      "academic",
      "literary",
      "formal",
      "friendly",
      "storytelling",
    ].includes(String(b.style))
  )
    throw Error("Стильді таңдаңыз.");
  if (!["all", "school", "adult"].includes(String(b.age_group)))
    throw Error("Жас тобын таңдаңыз.");
  if (
    !["educational", "dictionary", "literature", "teacher"].includes(
      String(b.source_type),
    )
  )
    throw Error("Дереккөз түрін таңдаңыз.");
  if (b.age_group !== "adult" && schoolUnsafe(text))
    throw Error("Материал мектеп жасына сай емес.");
  if (
    /ignore (all |previous )?instructions|system prompt|алдыңғы нұсқауларды елеме/iu.test(
      text,
    )
  )
    throw Error(
      "Оқу мәтінінде жүйелік пәрменге ұқсас мазмұн бар. Оны тексеріңіз.",
    );
  const metrics = [
    "quality_score",
    "language_quality",
    "educational_value",
    "age_suitability",
  ] as const;
  const score = (key: (typeof metrics)[number]) => {
    const n = b[key];
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 100)
      throw Error("Сапа көрсеткіштері 0–100 аралығында болуы керек.");
    return Math.round(n);
  };
  return {
    id:
      typeof b.id === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(b.id)
        ? b.id
        : crypto.randomUUID(),
    title: read("title", 150),
    author: read("author", 200),
    source_type: b.source_type as CorpusItem["source_type"],
    copyright_status: b.copyright_status as CorpusItem["copyright_status"],
    license,
    rights_evidence: evidence,
    level: b.level as CorpusItem["level"],
    genre: read("genre", 80),
    style: b.style as CorpusItem["style"],
    topic: read("topic", 100),
    region: read("region", 100),
    age_group: b.age_group as CorpusItem["age_group"],
    text,
    keywords: Array.isArray(b.keywords)
      ? b.keywords
          .filter((x): x is string => typeof x === "string")
          .slice(0, 20)
          .map((x) => x.slice(0, 80))
      : [],
    approved_by: null,
    status: "draft",
    created_at: new Date().toISOString(),
    quality_score: score("quality_score"),
    language_quality: score("language_quality"),
    educational_value: score("educational_value"),
    age_suitability: score("age_suitability"),
    revision: 1,
  };
}
export function chunkSource(source: CorpusItem): Chunk[] {
  const sentences = source.text.split(/(?<=[.!?])\s+|\n+/u).filter(Boolean);
  const result: Chunk[] = [];
  let current = "";
  const push = () => {
    if (current.trim())
      result.push({
        id: crypto.randomUUID(),
        corpus_id: source.id,
        text: current.trim(),
        position: result.length,
        revision: source.revision,
      });
    current = "";
  };
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (const word of words) {
      if (current.length + word.length > 800) push();
      current += (current ? " " : "") + word;
    }
  }
  push();
  return result;
}
export function eligible(source: CorpusItem, school = true) {
  return (
    source.status === "approved" &&
    !!source.approved_by &&
    rights.includes(source.copyright_status) &&
    !!source.rights_evidence &&
    source.quality_score >= 70 &&
    source.language_quality >= 70 &&
    source.educational_value >= 60 &&
    (!school || source.age_group !== "adult") &&
    source.age_suitability >= 70
  );
}
