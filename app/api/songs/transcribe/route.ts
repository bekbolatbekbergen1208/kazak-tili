import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSameOrigin } from "@/utils/request-origin";
import { createVisionLimiter } from "@/lib/vision/limit";
import { songLesson } from "@/lib/songs/content";
import {
  sttConfig,
  canProbeAudio,
  readAudio,
  probeDuration,
  requestTranscript,
  supportsKazakh,
} from "@/lib/songs/transcription";
import { compareSpeech } from "@/lib/songs/practice";
export const runtime = "nodejs";
const acquire = createVisionLimiter();
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  try {
    const config = sttConfig();
    const available =
      !!config && (await canProbeAudio()) && (await supportsKazakh(config));
    return json({
      available,
      language: "kk",
      reason: available
        ? null
        : "Қазақша тану сервисі қосылмаған. Жазбаны өзің тыңдап, мәтінмен жаттыға аласың.",
    });
  } catch {
    return json({
      available: false,
      reason: "Тану сервисінің баптауы дайын емес.",
    });
  }
}
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  const db = createClient(await cookies());
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return json({ error: "Жазбаны тексеру үшін аккаунтқа кір." }, 401);
  if (req.headers.get("x-audio-consent") !== "yes")
    return json(
      { error: "Жазбаны тану сервисіне жіберуге келісім керек." },
      400,
    );
  const lesson = songLesson(req.headers.get("x-song-id") ?? "");
  const excerpt = lesson?.excerpts?.find(
    (e) => e.id === req.headers.get("x-excerpt-id"),
  );
  if (!lesson || !excerpt)
    return json({ error: "Айту үзіндісі табылмады." }, 400);
  const release = acquire(user.id);
  if (!release) return json({ error: "Сәл күтіп, қайта тексер." }, 429);
  try {
    const config = sttConfig();
    if (!config || !(await canProbeAudio()) || !(await supportsKazakh(config)))
      return json(
        {
          error:
            "Қазақша тану сервисі қазір қолжетімсіз. Жазбаны өзің тыңда немесе музыкасыз қайта айт.",
        },
        503,
      );
    const { bytes, type } = await readAudio(req);
    const duration = await probeDuration(bytes);
    const result = await requestTranscript(config, bytes, type, req.signal);
    return json({
      ...result,
      duration,
      comparison: compareSpeech(
        lesson.lyrics[excerpt.line].text,
        result.text,
        result.confidence,
      ),
      retained: false,
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const status =
      code === "AUDIO_SIZE" ? 413 : code.startsWith("AUDIO_") ? 400 : 503;
    return json(
      {
        error:
          status === 413
            ? "Жазба 8 МБ-тан аспасын."
            : status === 400
              ? "60 секундтан аспайтын жарамды аудиожазба керек."
              : "Тану сәтсіз аяқталды немесе уақыт бітті. Бұл үзіндіні анық тани алмадық. Музыкасыз айтып көр.",
      },
      status,
    );
  } finally {
    release();
  }
}
