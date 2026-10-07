import test from "node:test";
import assert from "node:assert/strict";
import { songLessons } from "../lib/songs/content";
import { applyAction, initialState } from "../lib/learning/state";
import { compareSpeech, syncedLine, validTimings } from "../lib/songs/practice";
import {
  sttConfig,
  parseTranscript,
  readAudio,
  requestTranscript,
  durationFromProbe,
  MAX_AUDIO_BYTES,
  supportsKazakh,
} from "../lib/songs/transcription";
test("five shared songs have 30 valid word tasks, 20 excerpts and honest draft media", () => {
  const ids = new Set<string>();
  for (const l of songLessons) {
    assert.equal(l.mediaStatus, "draft");
    assert(l.rights?.text);
    assert(!l.audio);
    assert(!l.instrumental);
    assert(!validTimings(l));
    assert.equal(l.wordFind?.length, 6);
    assert.equal(l.excerpts?.length, 4);
    for (const t of l.wordFind!) {
      assert(!ids.has(t.id));
      ids.add(t.id);
      assert.equal(new Set(t.options).size, 4);
      assert(t.options.includes(t.answer));
      assert.equal(
        l.lyrics[t.line].text
          .split(/\s+/)
          [t.token].replace(/[^\p{L}\p{N}]/gu, ""),
        t.answer,
      );
      assert(t.explanation);
    }
  }
});
test("speech alignment preserves Kazakh letters, detects substitutions, missing and added words, and does not blame uncertainty", () => {
  assert(
    compareSpeech(
      "Менің туған жерім — Ақтау.",
      "  МЕНІҢ туған елім, Ақтау!",
      0.9,
    ).words.some(
      (w) =>
        w.status === "different" &&
        w.expected === "жерім" &&
        w.recognized === "елім",
    ),
  );
  assert(
    compareSpeech(
      "Менің туған жерім Ақтау",
      "Менің жерім Ақтау",
      0.9,
    ).words.some((w) => w.status === "missing" && w.expected === "туған"),
  );
  assert(
    compareSpeech("Сәлем досым", "Сәлем жаңа досым", 0.9).words.some(
      (w) => w.status === "extra",
    ),
  );
  for (const [a, b] of [
    ["қала", "кала"],
    ["әке", "аке"],
    ["аң", "ан"],
  ])
    assert.equal(compareSpeech(a, b, 0.9).words[0].status, "different");
  assert(compareSpeech("Сәлем досым", "Сәлем досым", 0.2).uncertain);
  assert(compareSpeech("Сәлем досым", "", undefined).uncertain);
  assert(!compareSpeech("Сәлем, досым!", "СӘЛЕМ досым").confidenceKnown);
});
test("mode progression gates draft audio, persists independent participation and never duplicates XP", () => {
  let state = initialState();
  state.profile.onboarded = true;
  const l = songLessons[0],
    old = JSON.stringify(l);
  assert.throws(() =>
    applyAction(state, {
      type: "song-mode-answer",
      lessonId: l.id,
      taskId: l.wordFind![0].id,
      answer: l.wordFind![0].answer,
    }),
  );
  assert.throws(() =>
    applyAction(state, {
      type: "song-mode-complete",
      lessonId: l.id,
      mode: "karaoke",
    }),
  );
  state = applyAction(state, {
    type: "song-mode-complete",
    lessonId: l.id,
    mode: "speak",
    excerptId: l.excerpts![0].id,
    text: "Сәлем досым",
    source: "stt",
    confidence: 0.1,
  });
  assert.equal(state.progress.xp, 5);
  assert.equal(state.progress.songs?.lessons[l.id].stage, 0);
  const action = {
    type: "song-mode-complete",
    lessonId: l.id,
    mode: "speak",
    excerptId: l.excerpts![0].id,
    text: "Сәлем досым",
    source: "manual",
  } as const;
  state = applyAction(JSON.parse(JSON.stringify(state)), action);
  assert.equal(state.progress.xp, 5);
  try {
    l.audio = { src: "/fixture.wav", license: "Synthetic test fixture only" };
    l.mediaStatus = "ready";
    l.lyrics.forEach((line, i) => {
      line.start = i * 2;
      line.end = i * 2 + 1.5;
    });
    assert(validTimings(l));
    assert.equal(syncedLine(l, 2.1), 1);
    assert.equal(syncedLine(l, 1.6), -1);
    assert.equal(syncedLine(l, 3.5), -1);
    assert.throws(() =>
      applyAction(state, {
        type: "song-mode-complete",
        lessonId: l.id,
        mode: "find",
      }),
    );
    for (const t of l.wordFind!)
      state = applyAction(state, {
        type: "song-mode-answer",
        lessonId: l.id,
        taskId: t.id,
        answer: ` ${t.answer.toLocaleUpperCase("kk-KZ")}! `,
      });
    state = applyAction(state, {
      type: "song-mode-complete",
      lessonId: l.id,
      mode: "find",
    });
    assert.equal(state.progress.xp, 15);
    state = applyAction(state, {
      type: "song-mode-complete",
      lessonId: l.id,
      mode: "karaoke",
    });
    assert.equal(state.progress.xp, 20);
    state = applyAction(state, {
      type: "song-mode-complete",
      lessonId: l.id,
      mode: "find",
    });
    assert.equal(state.progress.xp, 20);
    state = applyAction(state, {
      type: "song-mode-answer",
      lessonId: l.id,
      taskId: l.wordFind![0].id,
      answer: "wrong",
    });
    assert.equal(state.progress.xp, 20);
    l.lyrics[1].start = 0;
    assert(!validTimings(l));
    l.lyrics[1].start = 2;
    l.lyrics[l.lyrics.length - 1].end = Infinity;
    assert(!validTimings(l));
  } finally {
    Object.assign(l, JSON.parse(old));
    delete l.audio;
  }
});
test("audio requests enforce format, streaming size and actual duration; STT confidence is never invented", async (t) => {
  assert.equal(sttConfig({}), null);
  assert.throws(() =>
    sttConfig({
      SONG_STT_URL: "http://external.example/",
      SONG_STT_KAZAKH_ENABLED: "true",
    }),
  );
  assert.equal(
    parseTranscript({ text: " Сәлем ", language: "kk" }).confidence,
    undefined,
  );
  assert.throws(() => parseTranscript({ text: "hi", language: "en" }));
  assert.throws(() => parseTranscript({ text: "hi", confidence: 95 }));
  await assert.rejects(
    readAudio(
      new Request("http://localhost", {
        method: "POST",
        body: "hi",
        headers: { "content-type": "text/plain" },
      }),
    ),
  );
  await assert.rejects(
    readAudio(
      new Request("http://localhost", {
        method: "POST",
        body: new Uint8Array(MAX_AUDIO_BYTES + 1),
        headers: { "content-type": "audio/webm" },
      }),
    ),
    /AUDIO_SIZE/,
  );
  assert.equal(
    durationFromProbe({
      streams: [{ codec_type: "audio" }],
      format: { duration: "20" },
    }),
    20,
  );
  assert.equal(
    durationFromProbe({
      streams: [{ codec_type: "audio" }],
      packets: [{ pts_time: "1", duration_time: "0.5" }],
    }),
    1.5,
  );
  assert.throws(
    () =>
      durationFromProbe({
        streams: [{ codec_type: "audio" }],
        format: { duration: "61" },
      }),
    /DURATION/,
  );
  assert.throws(
    () =>
      durationFromProbe({
        streams: [{ codec_type: "video" }],
        format: { duration: "10" },
      }),
    /TYPE/,
  );
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: RequestInfo | URL, options?: RequestInit) => {
      const form = options?.body as FormData;
      assert.equal(form.get("language"), "kk");
      assert(form.get("file") instanceof Blob);
      assert.equal(form.get("prompt"), null);
      return Response.json({
        text: "Сәлем досым",
        language: "kk",
        confidence: 0.7,
      });
    },
  );
  const out = await requestTranscript(
    { url: "http://localhost/stt" },
    new Uint8Array([1, 2]),
    "audio/webm",
  );
  assert.equal(out.text, "Сәлем досым");
  assert.equal(out.confidence, 0.7);
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("offline", { status: 503 }),
  );
  await assert.rejects(
    requestTranscript(
      { url: "http://localhost/stt" },
      new Uint8Array([1]),
      "audio/webm",
    ),
    /UNAVAILABLE/,
  );
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ languages: ["en"] }),
  );
  assert.equal(await supportsKazakh({ url: "http://localhost/stt" }), false);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ languages: ["kk", "ru"] }),
  );
  assert.equal(await supportsKazakh({ url: "http://localhost/stt" }), true);
});
