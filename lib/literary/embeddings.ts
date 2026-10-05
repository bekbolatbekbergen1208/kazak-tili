import { ollamaBaseUrl } from "../dosha/config";
export const embeddingDimensions = 768;
export const embeddingModel = () =>
  process.env.QAZAQDOS_EMBEDDING_MODEL?.trim();
export async function embedTexts(
  texts: string[],
  fetcher: typeof fetch = fetch,
): Promise<number[][]> {
  const model = embeddingModel(),
    base = ollamaBaseUrl();
  if (!model || !base) throw Error("EMBEDDINGS_DISABLED");
  if (!texts.length || texts.length > 32 || texts.some((t) => t.length > 3000))
    throw Error("INVALID_EMBEDDING_BATCH");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.QAZAQDOS_AI_KEY)
    headers.Authorization = `Bearer ${process.env.QAZAQDOS_AI_KEY}`;
  const res = await fetcher(`${base.replace(/\/v1$/, "")}/api/embed`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      input: texts,
      dimensions: embeddingDimensions,
      truncate: false,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw Error("EMBEDDINGS_UNAVAILABLE");
  const b = await res.json();
  if (
    !Array.isArray(b.embeddings) ||
    b.embeddings.length !== texts.length ||
    b.embeddings.some(
      (v: unknown) =>
        !Array.isArray(v) ||
        v.length !== embeddingDimensions ||
        v.some((x) => typeof x !== "number" || !Number.isFinite(x)) ||
        v.every((x) => x === 0),
    )
  )
    throw Error("INVALID_EMBEDDING_DIMENSIONS");
  return b.embeddings;
}
