import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isSameOrigin } from "@/utils/request-origin";
import { boundedJson } from "@/utils/bounded-body";
import { isCorpusAdmin } from "@/lib/literary/admin";
import { parseSource, chunkSource, eligible } from "@/lib/literary/ingestion";
import { approvedCorpus } from "@/lib/literary/corpus";
import { levelRules } from "@/lib/literary/style";
import { dailyExpression } from "@/lib/literary/words";
import { embedTexts, embeddingModel } from "@/lib/literary/embeddings";
import type { CorpusItem } from "@/lib/literary/types";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function auth() {
  const {
    data: { user },
  } = await createClient(await cookies()).auth.getUser();
  return user && isCorpusAdmin(user) ? user : null;
}
export async function GET() {
  const user = await auth();
  if (!user)
    return json({ error: "Корпусты тек уәкілетті әкімші басқара алады." }, 403);
  const db = createAdminClient();
  if (!db) return json({ error: "Сервер кілті бапталмаған." }, 503);
  const found = await db
    .from("kazakh_corpus")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return found.error
    ? json({ error: "Корпус миграциясын қолданыңыз." }, 503)
    : json({ items: found.data, embeddingConfigured: !!embeddingModel() });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const user = await auth();
  if (!user) return json({ error: "Рұқсат жоқ." }, 403);
  const db = createAdminClient();
  if (!db) return json({ error: "Сервер кілті бапталмаған." }, 503);
  try {
    const b = (await boundedJson(req, 100000)) as Record<string, unknown>;
    if (b.action === "seed") {
      const saved = await db
        .from("kazakh_corpus")
        .upsert(approvedCorpus, { onConflict: "id", ignoreDuplicates: true });
      if (saved.error)
        return json({ error: "Оқу корпусын сақтау мүмкін болмады." }, 503);
      const rules = await db.from("kazakh_style_rules").upsert(
        Object.entries(levelRules).map(([level, text]) => ({
          id: `level-${level}`,
          level,
          style: "simple",
          text,
          approved: true,
        })),
        { ignoreDuplicates: true },
      );
      const phrase = await db.from("kazakh_phrase_bank").upsert(
        {
          id: dailyExpression.id,
          phrase: dailyExpression.word,
          meaning: dailyExpression.meaning,
          example: dailyExpression.example,
          level: dailyExpression.level,
          corpus_id: "lit-samal",
          approved: true,
        },
        { ignoreDuplicates: true },
      );
      if (rules.error || phrase.error)
        return json(
          { error: "Мәтіндер сақталды, стиль/тіркес кестелерін тексеріңіз." },
          503,
        );
      return json({ saved: true });
    }
    if (b.action === "save") {
      const item = parseSource(b.item);
      const revision = typeof b.revision === "number" ? b.revision : 0;
      const result = await db.rpc("kazakh_source_save", {
        p_item: item,
        p_expected: revision,
        p_actor: user.id,
        p_action: "save",
      });
      if (result.error)
        return json(
          {
            error:
              "Материал сақталмады немесе басқа әкімші өзгерткен. Қайта жүктеңіз.",
          },
          409,
        );
      return json({ saved: true });
    }
    if (
      typeof b.id !== "string" ||
      !["approve", "reject", "delete", "rebuild", "preview"].includes(
        String(b.action),
      )
    )
      throw Error("Әрекет жарамсыз.");
    const found = await db
      .from("kazakh_corpus")
      .select("*")
      .eq("id", b.id)
      .maybeSingle();
    if (found.error || !found.data)
      return json({ error: "Материал табылмады." }, 404);
    const item = found.data as CorpusItem;
    if (b.action === "preview") return json({ chunks: chunkSource(item) });
    if (b.action === "rebuild") {
      if (!eligible(item, false))
        throw Error(
          "Тек мақұлданған, сапасы жеткілікті материал индекстеледі.",
        );
      const chunks = chunkSource(item);
      const vectors = await embedTexts(chunks.map((c) => c.text));
      const result = await db.rpc("kazakh_rebuild_embeddings", {
        p_source: item.id,
        p_revision: item.revision,
        p_model: embeddingModel(),
        p_chunks: chunks.map((c, i) => ({
          ...c,
          embedding: JSON.stringify(vectors[i]),
        })),
      });
      if (result.error)
        return json(
          {
            error:
              "Индекс сақталмады. Vector миграциясын және материал нұсқасын тексеріңіз.",
          },
          409,
        );
      return json({ saved: true, chunks: chunks.length });
    }
    if (b.action === "approve" && b.rightsConfirmed !== true)
      throw Error("Құқық дәлелін қарап, рұқсатты растаңыз.");
    // Revalidate even stored material before approval. Client-supplied approval identity is ignored.
    const checked = parseSource(item);
    checked.created_at = item.created_at;
    checked.revision = item.revision;
    checked.status = b.action === "approve" ? "approved" : "rejected";
    checked.approved_by = b.action === "approve" ? user.id : null;
    if (checked.status === "approved" && !eligible(checked, false))
      throw Error("Тіл сапасы немесе жас сәйкестігі жеткіліксіз.");
    // Shipped seed retirement remains as a tombstone, so the lexical fallback cannot resurrect it.
    const action =
      b.action === "delete" && approvedCorpus.some((s) => s.id === item.id)
        ? "reject"
        : String(b.action);
    const result = await db.rpc("kazakh_source_save", {
      p_item: checked,
      p_expected: item.revision,
      p_actor: user.id,
      p_action: action,
    });
    if (result.error)
      return json(
        { error: "Материал өзгерді немесе сақтау орындалмады." },
        409,
      );
    return json({ saved: true });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Материал жарамсыз." },
      400,
    );
  }
}
