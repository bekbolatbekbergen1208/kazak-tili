/** Next.js may build req.url with its internal hostname. Compare the browser's
 * Origin against the actual Host header and the proxy's protocol instead. */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const url = new URL(req.url);
    const host = req.headers.get("host") ?? url.host;
    const protocol =
      req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
      url.protocol.slice(0, -1);
    return (
      parsed.origin === origin &&
      parsed.host === host &&
      parsed.protocol === `${protocol}:`
    );
  } catch {
    return false;
  }
}
