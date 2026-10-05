import type { SupabaseClient } from "@supabase/supabase-js";
import { levels, type Level } from "../q-level/types";
import { approvedCorpus } from "./corpus";
import { eligible } from "./ingestion";
import { embedTexts, embeddingModel } from "./embeddings";
import type { CorpusItem, RetrievalHit, Style } from "./types";
const tokenize = (s: string) =>
  s.toLocaleLowerCase("kk-KZ").match(/\p{L}{3,}/gu) ?? [];
const priority = { educational: 5, dictionary: 4, literature: 3, teacher: 1 };
export function lexicalRetrieve(
  message: string,
  level: Level,
  style: Style,
  sources = approvedCorpus,
  school = true,
): RetrievalHit[] {
  const words = new Set(tokenize(message)),
    maxLevel = Math.max(1, levels.indexOf(level));
  return sources
    .filter((s) => eligible(s, school) && levels.indexOf(s.level) <= maxLevel)
    .map((s) => {
      const haystack = tokenize(
        s.title + " " + s.keywords.join(" ") + " " + s.topic + " " + s.text,
      );
      const hits = new Set(
        haystack.filter((token) =>
          [...words].some(
            (w) =>
              token === w ||
              (w.length >= 4 && (token.startsWith(w) || w.startsWith(token))),
          ),
        ),
      ).size;
      const rank =
        hits * 10 +
        priority[s.source_type] +
        (s.style === style ? 2 : 0) +
        (s.copyright_status === "public_domain" ? 1 : 0);
      return {
        id: s.id,
        title: s.title,
        text: s.text.slice(0, 800),
        level: s.level,
        style: s.style,
        author: s.author,
        copyright_status: s.copyright_status,
        source_type: s.source_type,
        score: rank,
        hits,
      };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ hits, ...rest }) => {
      void hits;
      return rest;
    });
}
export async function retrieveApproved(
  db: SupabaseClient | null,
  message: string,
  level: Level,
  style: Style,
  school = true,
): Promise<{ hits: RetrievalHit[]; mode: "vector" | "lexical" }> {
  // Cache immutable shipped language patterns only. DB material is rechecked on each request so revocations take effect immediately.
  if (db && embeddingModel())
    try {
      const [embedding] = await embedTexts([message.slice(0, 2000)]);
      const result = await db.rpc("match_kazakh_chunks", {
        query_embedding: JSON.stringify(embedding),
        query_model: embeddingModel(),
        allowed_levels: levels.slice(0, Math.max(1, levels.indexOf(level)) + 1),
        school_only: school,
        match_count: 6,
      });
      if (!result.error && Array.isArray(result.data) && result.data.length) {
        const hits = result.data
          .filter((x: RetrievalHit) => x.score >= 0.35)
          .slice(0, 6);
        if (hits.length) return { hits, mode: "vector" };
      }
    } catch {
      /* Fail open to the approved lexical corpus, never to uncontrolled web text. */
    }
  let stored: CorpusItem[] = [];
  if (db) {
    const [res, seeds] = await Promise.all([
      db.from("kazakh_corpus").select("*").eq("status", "approved").limit(200),
      db
        .from("kazakh_corpus")
        .select("*")
        .in(
          "id",
          approvedCorpus.map((s) => s.id),
        ),
    ]);
    if (res.error || seeds.error) return { hits: [], mode: "lexical" };
    if (!res.error) stored = res.data as CorpusItem[];
    if (!seeds.error)
      stored = [
        ...stored.filter((s) => !seeds.data.some((x) => x.id === s.id)),
        ...seeds.data,
      ] as CorpusItem[];
  }
  const merged = [
    ...approvedCorpus.filter((s) => !stored.some((d) => d.id === s.id)),
    ...stored,
  ];
  return {
    hits: lexicalRetrieve(message, level, style, merged, school),
    mode: "lexical",
  };
}
export function retrievalContext(hits: RetrievalHit[]) {
  return hits
    .map((h) =>
      JSON.stringify({
        source: h.id,
        title: h.title,
        author: h.author,
        rights: h.copyright_status,
        text: h.text,
      }),
    )
    .join("\n");
}
