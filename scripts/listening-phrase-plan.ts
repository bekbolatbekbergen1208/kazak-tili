import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { lessons } from "../lib/learning/content";
import { courseLessons } from "../lib/curriculum";
import { questionBank } from "../lib/q-level/questions";
import { listeningSsml } from "../lib/listening/ssml";
import { voices, type Voice } from "../lib/listening/content";
const texts = [...new Set([
  ...questionBank.filter(q => q.skill === "listening").map(q => q.text_content!),
  ...lessons.flatMap(l => l.exercises).filter(e => e.kind === "listening" || e.kind === "speaking").map(e => e.audio ?? e.example),
  ...courseLessons.map(l => l.sentence),
])];
const quiz: Record<string, { url: string; voice: string }> = {};
const assets: Record<string, { url: string; voice: string }> = {};
const plan = texts.map((text, i) => {
  const voice: Voice = i % 2 ? "daulet" : "aigul";
  const id = `phrase-${createHash("sha256").update(text).digest("hex").slice(0, 12)}`;
  const lesson = { id, title: "", level: "", turns: [{ voice, text }], questions: [] };
  const hash = createHash("sha256").update(listeningSsml(lesson)).digest("hex").slice(0, 16);
  const asset = { url: `/audio/listening/${id}-${hash}.mp3`, voice: voices[voice].name };
  const question = questionBank.find(q => q.skill === "listening" && q.text_content === text);
  if (question) quiz[question.id] = asset;
  else assets[text] = asset;
  return { id, hash, turns: [{ text, voice: voices[voice].azure }] };
});
writeFileSync("lib/listening/phrase-assets.json", JSON.stringify(assets, null, 2) + "\n");
writeFileSync("lib/listening/q-level-assets.json", JSON.stringify(quiz, null, 2) + "\n");
console.log(JSON.stringify(plan, null, 2));
