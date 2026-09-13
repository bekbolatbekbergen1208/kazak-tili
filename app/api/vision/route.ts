import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSameOrigin } from "@/utils/request-origin";
import { boundedJson } from "@/utils/bounded-body";
import { visionWords } from "@/lib/vision/words";
import { requestVision, validateVisionImage } from "@/lib/vision/recognize";
import { createVisionLimiter } from "@/lib/vision/limit";
const acquire = createVisionLimiter();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  const {
    data: { user },
  } = await createClient(await cookies()).auth.getUser();
  return json({
    configured: !!process.env.OPENAI_API_KEY,
    signedIn: !!user,
    words: visionWords.map(({ id, kk, category }) => ({ id, kk, category })),
  });
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const {
    data: { user },
  } = await createClient(await cookies()).auth.getUser();
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
  const release = acquire(user.id);
  if (!release)
    return json(
      {
        error:
          "Сурет тану шегіне жеттің. Бір минуттан кейін қайта байқап көр; сағаттық шек болса, ұзағырақ күту керек.",
      },
      429,
    );
  let image = "";
  try {
    try {
      const body = (await boundedJson(req, 4_600_000)) as {
        image?: unknown;
      } | null;
      image = validateVisionImage(body?.image);
    } catch {
      return json(
        {
          error:
            "Кадр жарамсыз немесе тым үлкен. JPG, PNG немесе WebP суретін қайта таңда.",
        },
        400,
      );
    }
    return json(
      await requestVision({
        key,
        image,
        signal: req.signal,
        model:
          process.env.OPENAI_VISION_MODEL ||
          process.env.OPENAI_MODEL ||
          "gpt-4.1-mini",
      }),
    );
  } catch (error) {
    const busy = error instanceof Error && error.message === "AI_BUSY";
    return json(
      {
        error: busy
          ? "Досшаға қазір сұрау көп. Біраздан кейін қайта байқап көр."
          : "Досша затты тани алмады. Қайта байқап көр немесе сөзді қолмен таңда.",
      },
      busy ? 429 : 503,
    );
  } finally {
    image = "";
    release();
  }
}
