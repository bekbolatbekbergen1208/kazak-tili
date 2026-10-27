import { loadEnvConfig } from "@next/env";
import { mkdir, access, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { listeningLessons } from "../lib/listening/content";
import { listeningSsml } from "../lib/listening/ssml";
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
async function main() {
  const generate = process.argv.includes("--generate");
  const total = listeningLessons.reduce((n, l) => n + listeningSsml(l).length, 0);
  console.log(`${listeningLessons.length} тыңдалым, ${total} SSML таңбасы; Айгүл + Дәулет. ${generate ? "Аудио жасау" : "Жоспар ғана: API шақырылмайды"}.`);
  if (!generate) return;
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) throw new Error(".env.local ішінде AZURE_SPEECH_KEY және AZURE_SPEECH_REGION қажет.");
  if (!/^[a-z][a-z0-9]+$/.test(region)) throw new Error("Azure region атауы жарамсыз.");
  // A small fixed batch only. Never expose an arbitrary public synthesis endpoint.
  if (total > 20000) throw new Error("Осы сынақ топтамасының 20000 таңба шегінен асты.");
  const dir = join(process.cwd(), "public/audio/listening");
  await mkdir(dir, { recursive: true });
  for (const lesson of listeningLessons) {
    const ssml = listeningSsml(lesson);
    const hash = createHash("sha256").update(ssml).digest("hex").slice(0, 16);
    const file = join(dir, `${lesson.id}-${hash}.mp3`);
    try { await access(file); console.log(`${lesson.id}: бар, қайта жасалмайды`); continue; } catch {}
    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3", "User-Agent": "QazaqDos-listening" }, body: ssml, signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`Azure HTTP ${response.status}. Құпия деректерді қорғау үшін жауап денесі көрсетілмеді.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.headers.get("content-type")?.startsWith("audio/") || bytes.length < 1000 || !(bytes.subarray(0,3).toString() === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224))) throw new Error("Жарамды MP3 аудио алынбады.");
    const temp = `${file}.tmp`;
    try { await writeFile(temp, bytes, { flag: "wx" }); await rename(temp, file); } finally { await unlink(temp).catch(() => {}); }
    await writeFile(file.replace(/\.mp3$/, ".json"), JSON.stringify({ provider: "azure", sourceHash: hash, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), voices: ["kk-KZ-AigulNeural", "kk-KZ-DauletNeural"] }, null, 2));
    console.log(`${lesson.id}: MP3 сақталды (${bytes.length} байт)`);
  }
}
main().catch(e => { console.error(e instanceof Error ? e.message : "Аудио жасау қатесі"); process.exitCode = 1; });
