import { createHash } from "node:crypto";
import { listeningLessons, voices } from "../lib/listening/content";
import { listeningSsml } from "../lib/listening/ssml";
console.log(JSON.stringify(listeningLessons.map(lesson => ({
  id: lesson.id,
  hash: createHash("sha256").update(listeningSsml(lesson)).digest("hex").slice(0, 16),
  turns: lesson.turns.map(turn => ({ text: turn.text, voice: voices[turn.voice].azure })),
})), null, 2));
