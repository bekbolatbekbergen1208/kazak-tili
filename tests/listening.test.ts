import test from "node:test";
import assert from "node:assert/strict";
import { listeningLessons } from "../lib/listening/content";
import { listeningSsml } from "../lib/listening/ssml";
test("listening batch has valid answer keys and both Kazakh voices", () => {
  assert.equal(listeningLessons.length, 3);
  for (const lesson of listeningLessons) {
    assert.deepEqual(new Set(lesson.turns.map(t => t.voice)), new Set(["aigul", "daulet"]));
    assert.equal(lesson.questions.length, 4);
    for (const q of lesson.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(q.explanation.length > 20);
    }
  }
});
test("SSML escapes content while keeping both voice names", () => {
  const xml = listeningSsml({ ...listeningLessons[0], turns: [{ voice: "aigul", text: '<voice> & "test"' }, { voice: "daulet", text: "Сәлем!" }] });
  assert.ok(xml.includes("&lt;voice&gt; &amp; &quot;test&quot;"));
  assert.ok(xml.includes('name="kk-KZ-AigulNeural"'));
  assert.ok(xml.includes('name="kk-KZ-DauletNeural"'));
  assert.ok(!xml.includes("<voice>"));
});

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { phraseAudio } from "../lib/listening/phrases";
import { lessons } from "../lib/learning/content";
import { courseLessons } from "../lib/curriculum";
import { courseTasks } from "../lib/learning/course-tasks";
import { questionBank } from "../lib/q-level/questions";
test("all enabled quiz and lesson listening items have actual, verified MP3 assets", () => {
  const urls = new Set<string>();
  for (const q of questionBank.filter(q => q.skill === "listening")) {
    assert.ok(q.audio_url, q.id);
    urls.add(q.audio_url!);
  }
  for (const e of lessons.flatMap(l => l.exercises).filter(e => e.kind === "listening" || e.kind === "speaking")) {
    assert.ok(phraseAudio(e.audio ?? e.example), e.id);
    urls.add(phraseAudio(e.audio ?? e.example).url);
  }
  for (const lesson of courseLessons) {
    const tasks = courseTasks(lesson);
    assert.equal(tasks.filter(t => t.kind === "listening").length, 1);
    assert.equal(tasks[4].kind, "listening", "append listening without changing existing task IDs");
    assert.ok(phraseAudio(lesson.sentence), String(lesson.id));
    urls.add(phraseAudio(lesson.sentence).url);
  }
  assert.equal(urls.size, 46);
  for (const url of urls) {
    const file = join(process.cwd(), "public", url);
    assert.ok(existsSync(file), url);
    const bytes = readFileSync(file);
    assert.ok(bytes.length > 1000);
    const meta = JSON.parse(readFileSync(file.replace(/\.mp3$/, ".json"), "utf8"));
    assert.equal(meta.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(meta.bytes, bytes.length);
    assert.ok(meta.voices.every((v: string) => /kk-KZ-(Aigul|Daulet)Neural/.test(v)));
  }
});
