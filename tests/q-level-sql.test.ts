import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { initialState } from "../lib/learning/state";
import { getQuestion, startAttempt, submitAnswer } from "../lib/q-level/engine";
test("Q-Level migration isolates private answers, commits result atomically, and rewards only once", async () => {
  const db = new PGlite();
  const u = "00000000-0000-0000-0000-000000000001",
    v = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to authenticated,anon;`,
    );
    await db.exec(
      readFileSync("supabase/migrations/202609070001_learning_mvp.sql", "utf8"),
    );
    await db.exec(
      readFileSync("supabase/migrations/202610050013_q_level.sql", "utf8"),
    );
    await db.query("insert into auth.users values ($1),($2)", [u, v]);
    await db.query(
      "insert into qd_learning_states(user_id,state) values ($1,$2)",
      [u, JSON.stringify(initialState())],
    );
    async function run() {
      let a = startAttempt("quick");
      await db.query(
        "insert into q_level_attempts(id,user_id,test_type,state) values($1,$2,$3,$4)",
        [a.id, u, a.type, JSON.stringify(a)],
      );
      let revision = 0;
      while (!a.completed) {
        a = submitAnswer(a, String(getQuestion(a)!.correct_answer), 3);
        await db.query("select q_level_save($1,$2,$3,$4)", [
          u,
          JSON.stringify(a),
          revision++,
          a.result ? JSON.stringify(a.result) : null,
        ]);
      }
      await assert.rejects(
        db.query("select q_level_save($1,$2,$3,$4)", [
          u,
          JSON.stringify(a),
          revision - 1,
          JSON.stringify(a.result),
        ]),
      );
      return a;
    }
    const a = await run();
    assert.equal(
      (await db.query("select * from q_level_answers")).rows.length,
      16,
    );
    assert.equal(
      (await db.query("select * from q_level_section_results")).rows.length,
      6,
    );
    await run();
    assert.equal(
      (
        await db.query<{ xp: string }>(
          "select state#>>'{progress,xp}' xp from qd_learning_states",
        )
      ).rows[0].xp,
      "50",
    );
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${v}';`);
    assert.equal(
      (await db.query("select * from q_level_answers")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from q_level_profiles")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select q_level_save($1,$2,$3,$4)", [
        u,
        JSON.stringify(a),
        0,
        null,
      ]),
    );
    await assert.rejects(
      db.exec(`update q_level_profiles set overall_score=100`),
    );
    await db.exec(`set request.jwt.claim.sub='${u}';`);
    assert.equal(
      (await db.query("select * from q_level_answers")).rows.length,
      32,
    );
  } finally {
    await db.close();
  }
});
