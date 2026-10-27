import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { listeningLessons } from "@/lib/listening/content";
import { listeningSsml } from "@/lib/listening/ssml";
import ListeningPractice from "@/components/listening/practice";
import "./listening.css";
export const dynamic = "force-dynamic";
export default function Page() {
  const lessons = listeningLessons.map(lesson => {
    const hash = createHash("sha256").update(listeningSsml(lesson)).digest("hex").slice(0, 16);
    const url = `/audio/listening/${lesson.id}-${hash}.mp3`;
    let provider: "azure" | "edge-tts" | null = null;
    try {
      const meta = JSON.parse(readFileSync(join(process.cwd(), "public", url.replace(/\.mp3$/, ".json")), "utf8"));
      if (meta.sourceHash === hash && (meta.provider === "azure" || meta.provider === "edge-tts") && existsSync(join(process.cwd(), "public", url))) provider = meta.provider;
    } catch {}
    return { ...lesson, audio: provider ? url : null, provider };
  });
  return <ListeningPractice lessons={lessons} />;
}
