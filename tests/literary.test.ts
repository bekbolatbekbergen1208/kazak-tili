import test from "node:test";
import assert from "node:assert/strict";
import { approvedCorpus, literatureLessons } from "../lib/literary/corpus";
import { parseSource, chunkSource, eligible } from "../lib/literary/ingestion";
import { lexicalRetrieve } from "../lib/literary/retrieval";
import {
  chooseStyle,
  learnerLevel,
  languageInstructions,
} from "../lib/literary/style";
import {
  qualityScore,
  qualityGate,
  repairNaturalness,
} from "../lib/literary/quality";
import {
  applyLanguageAction,
  initialLanguageState,
} from "../lib/literary/state";
import { visionDescription, enrichVision } from "../lib/literary/vision";
import { referenceCoach } from "../lib/literary/coach";
import { findWord } from "../lib/literary/words";
import { embedTexts } from "../lib/literary/embeddings";
test("corpus ingestion blocks unknown rights and requires evidence; approval is never accepted from input", () => {
  for (const status of [
    "unknown_rights",
    "restricted",
    "copyrighted_full_text_without_permission",
  ])
    assert.throws(() =>
      parseSource({ ...approvedCorpus[0], copyright_status: status }),
    );
  assert.throws(() =>
    parseSource({ ...approvedCorpus[0], rights_evidence: "" }),
  );
  assert.throws(() =>
    parseSource({
      ...approvedCorpus[0],
      copyright_status: "short_approved_excerpt",
      text: "x ".repeat(700),
    }),
  );
  const source = parseSource(approvedCorpus[0]);
  assert.equal(source.status, "draft");
  assert.equal(source.approved_by, null);
  assert.equal(eligible(source), false);
  assert.ok(approvedCorpus.every((x) => eligible(x)));
  for (const source of approvedCorpus) {
    assert.ok(chunkSource(source).every((c) => c.text.length <= 800));
  }
});
test("retrieval only returns approved, legal, suitable level/age material, with no invented source for an unrelated question", () => {
  const hits = lexicalRetrieve("кітап дәптер мектеп", "A1", "simple");
  assert.ok(hits.length);
  assert.ok(hits.every((h) => h.level === "A1"));
  assert.deepEqual(lexicalRetrieve("xyzzzzzz", "B2", "literary"), []);
  const poisoned = {
    ...approvedCorpus[0],
    id: "poison",
    status: "rejected" as const,
  };
  assert.ok(!lexicalRetrieve("мектеп", "A1", "simple", [poisoned]).length);
  const adult = { ...approvedCorpus[0], age_group: "adult" as const };
  assert.ok(!lexicalRetrieve("мектеп", "A1", "simple", [adult]).length);
});
test("style respects Q-Level rather than XP; beginners do not receive literary register automatically", () => {
  assert.equal(learnerLevel("Деңгей 99"), "A1");
  assert.equal(chooseStyle("көркем мәтін", "A1"), "simple");
  assert.equal(chooseStyle("ғылыми эссе", "B2"), "academic");
  assert.ok(languageInstructions("A1", "simple").includes("Қиын сөз"));
});
test("quality flags calques and repeated Kazakh words; neutral modern loanwords are not blanket banned", async () => {
  assert.ok(
    qualityScore("Бұл өте үлкен рөл ойнайды.", "B1", "friendly").issues.length,
  );
  assert.ok(qualityScore("Сөз сөз айтылды.", "B1", "friendly").issues.length);
  assert.ok(
    !qualityScore("Мен компьютермен жұмыс істеймін.", "A1", "friendly").issues
      .length,
  );
  assert.equal(
    repairNaturalness("Бұл үлкен рөл ойнайды.").text,
    "Бұл маңызды рөл атқарады.",
  );
  let calls = 0;
  const out = await qualityGate(
    async () =>
      ++calls === 1
        ? "Сіздің сұрағыңыз бойынша ақпарат ұсынылады. Үлкен рөл ойнайды. Менің ойым бойынша."
        : "Бұл жерде негізгі ой мынау: сөзді орнымен қолдан.",
    "A1",
    "friendly",
    "Алдымен мысалға қара.",
  );
  assert.equal(calls, 2);
  assert.equal(out.regenerated, true);
});
test("Vision explanations vary by proficiency and never change recognized identity or confidence", () => {
  assert.notEqual(
    visionDescription("бауырсақ", "A1"),
    visionDescription("бауырсақ", "B2"),
  );
  const out = enrichVision(
    {
      quality: "clear",
      summary: "Домбыра тұр.",
      tip: "",
      objects: [
        {
          id: null,
          kk: "домбыра",
          ru: "домбра",
          en: "dombra",
          plural: "домбыралар",
          example: "Ол аспап.",
          description: "Ол зат.",
          confidence: 0.82,
        },
      ],
      word: null,
      confidence: 0.82,
      alternatives: [],
    },
    "A1",
  );
  assert.equal(out.objects[0].confidence, 0.82);
  assert.ok(out.objects[0].description.includes("ұлттық"));
  assert.ok(out.objects[0].lesson?.forms.includes("домбыраны"));
});
test("spaced repetition checks recall, schedules due dates and rejects early replays; saving gives no XP", () => {
  let state = initialLanguageState();
  const now = new Date("2026-10-05T12:00:00Z");
  const saved = applyLanguageAction(
    state,
    { type: "save-word", wordId: "apple", source: "vision" },
    now,
  );
  state = saved.state;
  assert.equal(saved.xp, 0);
  const reviewed = applyLanguageAction(
    state,
    { type: "review-word", wordId: "apple", answer: "Алма." },
    now,
  );
  assert.equal(reviewed.correct, true);
  assert.equal(reviewed.state.vocabulary.apple.intervalDays, 1);
  assert.throws(() =>
    applyLanguageAction(
      reviewed.state,
      { type: "review-word", wordId: "apple", answer: "алма" },
      now,
    ),
  );
  const failed = applyLanguageAction(
    state,
    { type: "review-word", wordId: "apple", answer: "кітап" },
    now,
  );
  assert.equal(failed.correct, false);
  assert.equal(failed.state.vocabulary.apple.repetitions, 0);
  assert.equal(
    Date.parse(failed.state.vocabulary.apple.dueAt) - now.getTime(),
    600000,
  );
});
test("literature rewards require comprehension plus an original response and cannot be collected twice", () => {
  let state = initialLanguageState();
  const lesson = literatureLessons[0];
  assert.throws(() =>
    applyLanguageAction(state, {
      type: "literature-finish",
      lessonId: lesson.id,
    }),
  );
  for (const q of lesson.questions)
    state = applyLanguageAction(state, {
      type: "literature-answer",
      lessonId: lesson.id,
      questionId: q.id,
      answer: q.answer,
    }).state;
  assert.throws(() =>
    applyLanguageAction(state, {
      type: "literature-finish",
      lessonId: lesson.id,
    }),
  );
  state = applyLanguageAction(state, {
    type: "literature-writing",
    lessonId: lesson.id,
    text: "Мен мектепке барамын.",
  }).state;
  const out = applyLanguageAction(state, {
    type: "literature-finish",
    lessonId: lesson.id,
  });
  assert.equal(out.xp, 20);
  assert.equal(
    applyLanguageAction(out.state, {
      type: "literature-finish",
      lessonId: lesson.id,
    }).xp,
    0,
  );
  for (const l of literatureLessons) {
    assert.ok(approvedCorpus.some((c) => c.id === l.corpusId));
    assert.ok(l.wordIds.every((id) => !!findWord(id)));
  }
});
test("writing coach preserves original and explains its contextual word correction", () => {
  const out = referenceCoach("Мен магазинге бардым.", "A2", "speaking");
  assert.equal(out.original, "Мен магазинге бардым.");
  assert.equal(out.suggested, "Мен дүкенге бардым.");
  assert.ok(out.changes.length);
  assert.notEqual(
    referenceCoach("Күн жақсы болды.", "A2", "enrich").suggested,
    referenceCoach("Күн жақсы болды.", "B2", "enrich").suggested,
  );
});
test("embedding pipeline uses real vectors with matching dimensions and rejects zero/wrong size output", async () => {
  const oldBase = process.env.OLLAMA_BASE_URL,
    oldModel = process.env.QAZAQDOS_EMBEDDING_MODEL;
  process.env.OLLAMA_BASE_URL = "http://localhost:11434";
  process.env.QAZAQDOS_EMBEDDING_MODEL = "test";
  try {
    const vectors = await embedTexts(["Сәлем"], async (_url, init) => {
      const b = JSON.parse(String(init?.body));
      assert.equal(b.dimensions, 768);
      return new Response(
        JSON.stringify({ embeddings: [Array(768).fill(0.1)] }),
      );
    });
    assert.equal(vectors[0].length, 768);
    await assert.rejects(
      embedTexts(
        ["Сәлем"],
        async () => new Response(JSON.stringify({ embeddings: [[1, 2]] })),
      ),
    );
  } finally {
    process.env.OLLAMA_BASE_URL = oldBase;
    process.env.QAZAQDOS_EMBEDDING_MODEL = oldModel;
  }
});
import { visionLanguageGate } from "../lib/literary/vision";
test("Vision retries poor language without losing the validated object result", async () => {
  let calls = 0;
  const out = await visionLanguageGate(async () => {
    calls++;
    return {
      quality: "clear",
      summary:
        calls === 1
          ? "Сіздің сұрағыңыз бойынша ақпарат ұсынылады. Менің ойым бойынша бұл үлкен рөл ойнайды. Сөз сөз болып табылады."
          : "Бұл — алма.",
      tip: "",
      objects: [
        {
          id: "apple",
          kk: "алма",
          ru: "яблоко",
          en: "apple",
          plural: "алмалар",
          example: "Мен алма жедім.",
          description: "Алма — жеміс.",
          confidence: 0.9,
        },
      ],
      word: { id: "apple", kk: "алма" },
      confidence: 0.9,
      alternatives: [],
    };
  }, "A1");
  assert.equal(calls, 2);
  assert.equal(out.languageRegenerated, true);
  assert.equal(out.objects[0].kk, "алма");
  assert.equal(out.objects[0].confidence, 0.9);
});
import { retrieveApproved } from "../lib/literary/retrieval";
import { isCorpusAdmin } from "../lib/literary/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
test("retired shipped sources cannot reappear through lexical fallback; corpus read errors fail closed", async () => {
  const builder = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    limit: async () => ({ error: null, data: [] }),
    in: async () => ({
      error: null,
      data: [{ ...approvedCorpus[0], status: "rejected", approved_by: null }],
    }),
  };
  const db = { from: () => builder } as unknown as SupabaseClient;
  const retired = await retrieveApproved(db, "мектеп", "A1", "simple");
  assert.equal(retired.hits.length, 0);
  const broken = {
    ...builder,
    limit: async () => ({ error: { message: "offline" }, data: [] }),
  };
  assert.equal(
    (
      await retrieveApproved(
        { from: () => broken } as unknown as SupabaseClient,
        "мектеп",
        "A1",
        "simple",
      )
    ).hits.length,
    0,
  );
});
test("corpus admin authority comes from server-managed roles, not nickname or user-editable metadata", () => {
  assert.equal(isCorpusAdmin({ app_metadata: { role: "admin" } }), true);
  assert.equal(
    isCorpusAdmin({ app_metadata: { role: "corpus_editor" } }),
    true,
  );
  assert.equal(isCorpusAdmin({ app_metadata: { role: "student" } }), false);
  assert.equal(
    isCorpusAdmin({
      app_metadata: {},
      email: "unapproved-student@example.org",
    }),
    false,
  );
});
