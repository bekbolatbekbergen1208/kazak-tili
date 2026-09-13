export async function boundedJson(
  req: Request,
  maxBytes: number,
): Promise<unknown> {
  if (Number(req.headers.get("content-length")) > maxBytes)
    throw Error("BODY_TOO_LARGE");
  const reader = req.body?.getReader();
  if (!reader) throw Error("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw Error("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}
