import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { initialState, applyAction } from "../lib/learning/state";
test("song progress uses existing own-user RLS and server-only revision writes; stale saves cannot replay rewards", async () => {
  const db = new PGlite();
  const a = "00000000-0000-0000-0000-000000000001",
    b = "00000000-0000-0000-0000-000000000002";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;`,
    );
    for (const f of [
      "202609070001_learning_mvp.sql",
      "202609080006_server_owned_progress.sql",
    ])
      await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
    await db.query("insert into auth.users values($1),($2)", [a, b]);
    let s = initialState();
    s.profile.onboarded = true;
    s = applyAction(s, { type: "song-start", lessonId: "salem" });
    await db.query(
      "insert into qd_learning_states(user_id,state,revision) values($1,$3,1),($2,$3,1)",
      [a, b, JSON.stringify(s)],
    );
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${a}'`);
    const rows = await db.query<{ user_id: string; state: unknown }>(
      "select user_id,state from qd_learning_states",
    );
    assert.equal(rows.rows.length, 1);
    assert.equal(rows.rows[0].user_id, a);
    await assert.rejects(db.exec("update qd_learning_states set revision=99"));
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          "update qd_learning_states set revision=2 where user_id=$1 and revision=1 returning revision",
          [a],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update qd_learning_states set revision=2 where user_id=$1 and revision=1 returning revision",
          [a],
        )
      ).rows.length,
      0,
    );
    await db.exec("set role anon");
    await assert.rejects(db.exec("select * from qd_learning_states"));
  } finally {
    await db.close();
  }
});
