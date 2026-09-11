import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSameOrigin } from "@/utils/request-origin";
import { visionWords } from "@/lib/vision/words";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  return json({
    configured: !!process.env.OPENAI_API_KEY,
    words: visionWords.map(({ id, kk, category }) => ({ id, kk, category })),
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const db = createClient(await cookies()),
    {
      data: { user },
    } = await db.auth.getUser();
  if (!user)
    return json(
      {
        error:
          "AI арқылы тану үшін аккаунтпен кір. Төмендегі қолмен растау жұмыс істейді.",
      },
      401,
    );
  const key = process.env.OPENAI_API_KEY;
  if (!key)
    return json(
      {
        error:
          "Затты автоматты тану әлі бапталмаған. Сурет сақталмады — сөзді қолмен таңда.",
      },
      503,
    );
  let image = "";
  try {
    const raw = await req.text();
    if (raw.length > 5_000_000) throw Error();
    const body = JSON.parse(raw);
    if (
      typeof body.image !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,/.test(body.image)
    )
      throw Error();
    image = body.image;
  } catch {
    return json({ error: "Кадр жарамсыз немесе тым үлкен." }, 400);
  }
  const list = visionWords.map((w) => `${w.id}: ${w.en}`).join(", ");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          process.env.OPENAI_VISION_MODEL ||
          process.env.OPENAI_MODEL ||
          "gpt-4.1-mini",
        store: false,
        max_output_tokens: 120,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Identify the main object only from this closed list: ${list}. Return strict JSON {"id":string|null,"confidence":number,"alternatives":string[]} with up to 3 ids. Never identify a person, face, document text, location or private data.`,
              },
              { type: "input_image", image_url: image },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    image = "";
    if (!response.ok) throw Error();
    const data = await response.json();
    const text = (
      data.output_text ??
      data.output
        ?.flatMap((o: { content?: { text?: string }[] }) => o.content ?? [])
        .map((x: { text?: string }) => x.text ?? "")
        .join("") ??
      ""
    )
      .replace(/^```json|```$/g, "")
      .trim();
    const result = JSON.parse(text);
    const word = visionWords.find((w) => w.id === result.id);
    const alternatives: (typeof visionWords)[number][] = (
      Array.isArray(result.alternatives) ? result.alternatives : []
    )
      .map((id: string) => visionWords.find((w) => w.id === id))
      .filter(Boolean)
      .slice(0, 3);
    return json({
      word: word ? { id: word.id, kk: word.kk } : null,
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
      alternatives: alternatives.map((w: (typeof visionWords)[number]) => ({
        id: w.id,
        kk: w.kk,
      })),
    });
  } catch {
    image = "";
    return json(
      { error: "Досша затты тани алмады. Кадр сақталмады — сөзді өзің раста." },
      503,
    );
  }
}
