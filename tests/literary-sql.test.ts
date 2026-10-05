import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { approvedCorpus } from "../lib/literary/corpus";
import { initialLanguageState } from "../lib/literary/state";
import { initialState } from "../lib/learning/state";
test("literary SQL protects drafts, rights metadata, private vocabulary and atomic rewards/revisions", async () => {
  const db = new PGlite(),
    a = "00000000-0000-0000-0000-000000000001",
    b = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;`,
    );
    await db.exec(
      readFileSync("supabase/migrations/202609070001_learning_mvp.sql", "utf8"),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202610050014_literary_intelligence.sql",
        "utf8",
      ),
    );
    await db.query("insert into auth.users values($1),($2)", [a, b]);
    await db.query(
      "insert into qd_learning_states(user_id,state) values($1,$2)",
      [a, JSON.stringify(initialState())],
    );
    const source = approvedCorpus[0];
    await db.query("select kazakh_source_save($1,0,$2,$3)", [
      JSON.stringify(source),
      a,
      "create",
    ]);
    await db.query("select kazakh_source_save($1,0,$2,$3)", [
      JSON.stringify({
        ...source,
        id: "draft",
        status: "draft",
        approved_by: null,
      }),
      a,
      "create",
    ]);
    await assert.rejects(
      db.query("select kazakh_source_save($1,0,$2,$3)", [
        JSON.stringify({
          ...source,
          id: "bad",
          copyright_status: "unknown_rights",
        }),
        a,
        "create",
      ]),
    );
    await db.query("select qd_language_save($1,$2,0,20)", [
      a,
      JSON.stringify(initialLanguageState()),
    ]);
    await assert.rejects(
      db.query("select qd_language_save($1,$2,0,20)", [
        a,
        JSON.stringify(initialLanguageState()),
      ]),
    );
    assert.equal(
      (
        await db.query<{ xp: string }>(
          "select state#>>'{progress,xp}' xp from qd_learning_states where user_id=$1",
          [a],
        )
      ).rows[0].xp,
      "20",
    );
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${b}';`);
    assert.equal(
      (await db.query("select * from qd_language_states")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from kazakh_corpus")).rows.length,
      1,
    );
    await assert.rejects(db.exec("update kazakh_corpus set status='approved'"));
    await assert.rejects(
      db.query("select qd_language_save($1,$2,1,20)", [
        a,
        JSON.stringify(initialLanguageState()),
      ]),
    );
    await assert.rejects(db.exec("select * from kazakh_corpus_audit"));
    await db.exec("reset role");
    await db.query(
      "insert into kazakh_corpus_chunks(corpus_id,text,position,revision) values($1,$2,0,1)",
      [source.id, source.text],
    );
    await db.query("select kazakh_source_save($1,1,$2,$3)", [
      JSON.stringify({ ...source, status: "rejected", approved_by: null }),
      a,
      "reject",
    ]);
    assert.equal(
      (await db.query("select * from kazakh_corpus_chunks")).rows.length,
      0,
    );
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${a}';`);
    assert.equal(
      (await db.query("select * from kazakh_corpus")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from qd_language_states")).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
