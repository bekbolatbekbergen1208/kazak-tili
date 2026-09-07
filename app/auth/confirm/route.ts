import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export async function GET(req: Request) {
  const url = new URL(req.url),
    token_hash = url.searchParams.get("token_hash");
  if (token_hash) {
    const { error } = await createClient(await cookies()).auth.verifyOtp({
      token_hash,
      type: "email",
    });
    if (!error)
      return NextResponse.redirect(new URL("/learn?demo=0", url.origin));
  }
  return NextResponse.redirect(
    new URL("/login?error=confirmation", url.origin),
  );
}
