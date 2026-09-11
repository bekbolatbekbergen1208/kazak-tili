import QRCode from "qrcode";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const url = new URL(req.url),
    code = url.searchParams.get("code")?.toUpperCase();
  if (!code || !/^[A-Z0-9]{8}$/.test(code))
    return new NextResponse("Invalid code", { status: 400 });
  const invite = `${url.origin}/learn/friends?invite=${code}`,
    svg = await QRCode.toString(invite, {
      type: "svg",
      margin: 2,
      width: 240,
      color: { dark: "#33285eff", light: "#ffffffff" },
    });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, max-age=300",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
