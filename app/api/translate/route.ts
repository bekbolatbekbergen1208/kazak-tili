import { NextResponse } from "next/server";
import { boundedJson } from "@/utils/bounded-body";
import { isSameOrigin } from "@/utils/request-origin";
import { interfaceLanguages } from "@/lib/learning/languages";
import { commonDictionary } from "@/lib/translation/dictionary";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return json({ error: "Жарамсыз сұрау." }, 403);
  let input: { word?: unknown; language?: unknown; context?: unknown };
  try {
    input = await boundedJson(req, 4096) as { word?: unknown; language?: unknown; context?: unknown };
    if (!input || typeof input.word !== "string" || !input.word.trim() || input.word.length > 300 ||
        !/[\p{L}\p{N}]/u.test(input.word) || /[\u0000-\u001f\u007f]/u.test(input.word) ||
        !interfaceLanguages.some(x => x.code === input.language) ||
        (input.context !== undefined && (typeof input.context !== "string" || input.context.length > 600))) throw Error();
  } catch { return json({ error: "Сөз бен аударма тілін дұрыс таңдаңыз." }, 400); }
  const word = (input.word as string).trim();
  const language = interfaceLanguages.find(x => x.code === input.language)!;
  const known = commonDictionary.find(x => x.kk.toLocaleLowerCase() === word.toLocaleLowerCase());
  if (known?.translation[language.code]) return json({ translation: known.translation[language.code] });
  return json({ error: "Бұл сөз әзірге сөздікте жоқ." }, 404);
}
