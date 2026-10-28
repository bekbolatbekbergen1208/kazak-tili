import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/utils/request-origin";
import { boundedJson } from "@/utils/bounded-body";

export const runtime = "nodejs";
const model = path.join(process.cwd(), ".voice/models/kk_KZ-iseke-x_low.onnx");
const piper = path.join(process.cwd(), ".voice/piper/piper");
const cache = new Map<string, Buffer>();

function synthesize(text: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(piper, ["--model", model, "--output_file", output], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let settled = false;
    let stderr = "";
    const timer = setTimeout(() => child.kill(), 20000);
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString().slice(0, 1000);
    });
    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `Piper exited with code ${code}`));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(`${text}\n`);
  });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req))
    return NextResponse.json({ error: "Жарамсыз сұрау." }, { status: 403 });
  let text: string;
  try {
    const body = (await boundedJson(req, 3000)) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 500) throw Error();
  } catch {
    return NextResponse.json({ error: "Мәтін тым ұзын." }, { status: 400 });
  }
  try {
    await Promise.all([access(model), access(piper)]);
  } catch {
    return NextResponse.json(
      { error: "Қазақша дауыс әлі орнатылмаған." },
      { status: 503 },
    );
  }
  let audio = cache.get(text);
  if (!audio) {
    const output = path.join(tmpdir(), `dossha-voice-${randomUUID()}.wav`);
    try {
      await synthesize(text, output);
      audio = await readFile(output);
      if (!audio.length) throw Error("Empty audio");
      if (cache.size >= 40) cache.delete(cache.keys().next().value!);
      cache.set(text, audio);
    } catch {
      return NextResponse.json(
        { error: "Дауысты ойнату мүмкін болмады." },
        { status: 503 },
      );
    } finally {
      await unlink(output).catch(() => {});
    }
  }
  return new NextResponse(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, no-store",
    },
  });
}
