import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { visionWords } from "@/lib/vision/words";
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
    configured: false,
    signedIn: !!user,
    words: visionWords.map(({ id, kk, category }) => ({ id, kk, category })),
  });
}
export async function POST(req: Request) {
  req.body?.cancel().catch(() => {});
  return json(
    {
      error:
        "Автоматты AI тануы өшірілген. Төменнен сөзді қолмен таңда.",
    },
    503,
  );
}
