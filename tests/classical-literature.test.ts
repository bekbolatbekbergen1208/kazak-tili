import test from "node:test";
import assert from "node:assert/strict";
import { classicWorks, classicCorpus } from "../lib/literary/classics";
import { approvedCorpus } from "../lib/literary/corpus";
import { parseSource, eligible } from "../lib/literary/ingestion";
import { lexicalRetrieve, retrieveApproved } from "../lib/literary/retrieval";
import { referenceAnswer } from "../lib/friend/knowledge";
import { classicalLiteratureTrainingRows } from "../training/classical-literature-rows";
import {
  prepareTextRows,
  assertNoEvaluationLeakage,
} from "../training/dataset-quality";

test("classics are source-labelled, ingestible short excerpts in the approved corpus", () => {
  for (const source of classicCorpus) {
    assert.ok(approvedCorpus.some((item) => item.id === source.id));
    assert.ok(eligible(source));
    assert.doesNotThrow(() => parseSource(source));
    assert.ok(source.text.includes("автор дәйексөзі емес"));
    assert.ok(source.rights_evidence.includes("https://"));
  }
});

test("specific work retrieval respects learner level and unrelated questions", async () => {
  for (const work of classicWorks) {
    const { hits } = await retrieveApproved(null, work.title, "B1", "literary");
    assert.ok(hits.some((hit) => hit.id === `classic-${work.id}`));
  }
  assert.ok(
    !lexicalRetrieve("он жетінші", "A1", "simple").some(
      (hit) => hit.id === "classic-abai-seventeen",
    ),
  );
  assert.deepEqual(
    lexicalRetrieve("xyzzzz", "B2", "literary", classicCorpus),
    [],
  );
});

test("reference answers distinguish each work instead of returning a generic book summary", () => {
  for (const work of classicWorks) {
    for (const item of work.questions) {
      const answer = referenceAnswer(item.question);
      assert.ok(answer.reply.includes(item.answer), item.question);
      assert.ok(answer.reply.includes(work.sourceUrl));
    }
  }
});

test("named-work fallback provides source context and refuses invented page numbers", () => {
  const summary = referenceAnswer("Бақша ағаштары туралы айтып бер");
  assert.ok(summary.reply.includes(classicWorks[1].explanation));
  const quote = referenceAnswer(
    "Он жетінші сөз шығармасынан дәйексөзді бет нөмірімен жаз",
  );
  assert.ok(quote.reply.includes("Өзге дәйексөзді ойдан шығармаймын"));
  assert.ok(quote.reply.includes(classicWorks[0].excerpt));
});

test("all dialogues for a work share a split group; unprovided quotes are refused", () => {
  const rows = classicalLiteratureTrainingRows();
  assert.equal(rows.length, 21);
  assertNoEvaluationLeakage(rows);
  const prepared = prepareTextRows(rows);
  for (const work of classicWorks) {
    const matching = prepared.rows.filter((row) =>
      row.id.startsWith(`classic-training-${work.id}-`),
    );
    assert.equal(matching.length, 7);
    assert.equal(new Set(matching.map((row) => row.group)).size, 1);
    assert.ok(
      matching.every((row) => row.messages[0].content.includes(work.excerpt)),
    );
    assert.ok(
      matching.some((row) =>
        row.messages[2].content.includes("Оларды ойдан шығармаймын"),
      ),
    );
  }
});
