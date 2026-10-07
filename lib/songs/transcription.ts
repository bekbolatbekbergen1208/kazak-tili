import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const exec = promisify(execFile);
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 60;
export function sttConfig(
  env: Record<string, string | undefined> = process.env,
): { url: string; key?: string; model?: string } | null {
  if (!env.SONG_STT_URL || env.SONG_STT_KAZAKH_ENABLED !== "true") return null;
  const url = new URL(env.SONG_STT_URL);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      ))
  )
    throw Error("Invalid STT server configuration");
  return {
    url: url.toString(),
    key: env.SONG_STT_API_KEY,
    model: env.SONG_STT_MODEL,
  };
}
export async function canProbeAudio() {
  try {
    await exec("ffprobe", ["-version"], { timeout: 2000, maxBuffer: 100000 });
    return true;
  } catch {
    return false;
  }
}
export async function supportsKazakh(
  config: NonNullable<ReturnType<typeof sttConfig>>,
) {
  try {
    const r = await fetch(config.url, {
      method: "GET",
      headers: config.key ? { Authorization: `Bearer ${config.key}` } : {},
      signal: AbortSignal.timeout(3000),
      redirect: "error",
    });
    if (!r.ok || Number(r.headers.get("content-length")) > 30000) return false;
    const text = await r.text();
    if (text.length > 30000) return false;
    const body = JSON.parse(text);
    return Array.isArray(body.languages) && body.languages.includes("kk");
  } catch {
    return false;
  }
}
export async function readAudio(req: Request) {
  const type = (req.headers.get("content-type") ?? "").split(";")[0];
  if (
    ![
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/wav",
      "audio/x-wav",
      "audio/mpeg",
      "audio/flac",
    ].includes(type)
  )
    throw Error("AUDIO_TYPE");
  if (Number(req.headers.get("content-length")) > MAX_AUDIO_BYTES)
    throw Error("AUDIO_SIZE");
  const reader = req.body?.getReader();
  if (!reader) throw Error("AUDIO_EMPTY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Error("AUDIO_TIMEOUT")), 15000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUDIO_BYTES) throw Error("AUDIO_SIZE");
      chunks.push(value);
    }
    if (!size) throw Error("AUDIO_EMPTY");
    return { bytes: Buffer.concat(chunks), type };
  } catch (e) {
    void reader.cancel().catch(() => {});
    throw e;
  } finally {
    clearTimeout(timer!);
    reader.releaseLock();
  }
}
export async function probeDuration(bytes: Uint8Array) {
  const directory = await mkdtemp(join(tmpdir(), "qd-song-"));
  try {
    const path = join(directory, "recording");
    await writeFile(path, bytes, { mode: 0o600 });
    const { stdout } = await exec(
      "ffprobe",
      [
        "-v",
        "error",
        "-protocol_whitelist",
        "file,pipe",
        "-select_streams",
        "a:0",
        "-show_entries",
        "format=duration:stream=codec_type:packet=pts_time,duration_time",
        "-of",
        "json",
        path,
      ],
      { timeout: 6000, maxBuffer: 2000000 },
    );
    return durationFromProbe(JSON.parse(stdout));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
export function durationFromProbe(body: {
  format?: { duration?: string };
  streams?: { codec_type: string }[];
  packets?: { pts_time: string; duration_time: string }[];
}) {
  if (!body.streams?.some((s) => s.codec_type === "audio"))
    throw Error("AUDIO_TYPE");
  const packetEnd = Math.max(
    0,
    ...(body.packets ?? [])
      .map(
        (p: { pts_time: string; duration_time: string }) =>
          Number(p.pts_time) + Number(p.duration_time ?? 0),
      )
      .filter(Number.isFinite),
  );
  const duration = Math.max(Number(body.format?.duration) || 0, packetEnd);
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > MAX_AUDIO_SECONDS + 0.5
  )
    throw Error("AUDIO_DURATION");
  return duration;
}
export function parseTranscript(body: unknown) {
  const b = body as {
    text?: unknown;
    confidence?: unknown;
    language?: unknown;
  };
  if (
    !b ||
    typeof b.text !== "string" ||
    b.text.length > 5000 ||
    (b.language !== undefined && !["kk", "kk-KZ"].includes(String(b.language)))
  )
    throw Error("STT_RESPONSE");
  if (
    b.confidence !== undefined &&
    (typeof b.confidence !== "number" ||
      !Number.isFinite(b.confidence) ||
      b.confidence < 0 ||
      b.confidence > 1)
  )
    throw Error("STT_RESPONSE");
  return {
    text: b.text.trim(),
    confidence: b.confidence as number | undefined,
  };
}
export async function requestTranscript(
  config: NonNullable<ReturnType<typeof sttConfig>>,
  bytes: Uint8Array,
  type: string,
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type }), "recording");
  form.append("language", "kk");
  if (config.model) form.append("model", config.model);
  const response = await fetch(config.url, {
    method: "POST",
    headers: config.key ? { Authorization: `Bearer ${config.key}` } : {},
    body: form,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
      : AbortSignal.timeout(25000),
    redirect: "error",
  });
  if (!response.ok) throw Error("STT_UNAVAILABLE");
  // Bound provider output too; never log or persist audio/transcripts here.
  const reader = response.body?.getReader();
  if (!reader) throw Error("STT_RESPONSE");
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 30000) {
        await reader.cancel();
        throw Error("STT_RESPONSE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return parseTranscript(JSON.parse(Buffer.concat(chunks).toString("utf8")));
}
