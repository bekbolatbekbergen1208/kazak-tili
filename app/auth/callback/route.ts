import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export async function GET(req: Request) {
  const url = new URL(req.url),
    code = url.searchParams.get("code");
  if (code) {
    const { error } = await createClient(
      await cookies(),
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(new URL("/learn?demo=0", url.origin));
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
