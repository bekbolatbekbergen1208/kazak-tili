import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { initialState } from "../lib/learning/state";
test("migrations execute; RLS isolates two users and protects curriculum", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
    );
    await db.exec(
      readFileSync("supabase/migrations/202609070001_learning_mvp.sql", "utf8"),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202609070002_learning_content.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202609070003_character_system.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202609070004_character_catalog.sql",
        "utf8",
      ),
    );
    const a = "00000000-0000-0000-0000-000000000001",
      b = "00000000-0000-0000-0000-000000000002";
    await db.query("insert into auth.users values ($1),($2)", [a, b]);
    await db.query(
      "insert into public.qd_learning_states(user_id,state) values ($1,$3),($2,$3)",
      [a, b, JSON.stringify(initialState())],
    );
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${a}';`);
    assert.equal(
      (await db.query("select * from public.qd_learning_states")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.qd_user_profiles")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select * from public.qd_lessons")).rows.length,
      45,
    );
    assert.equal(
      (await db.query("select * from public.qd_exercises")).rows.length,
      225,
    );
    assert.equal(
      (
        await db.query(
          "update public.qd_learning_states set revision=2 where user_id=$1 returning user_id",
          [b],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.qd_learning_states(user_id,state) values ($1,$2)",
        [b, JSON.stringify(initialState())],
      ),
    );
    await assert.rejects(db.exec("update public.qd_courses set title='{}'"));
    assert.equal(
      (await db.query("select * from public.qd_characters")).rows.length,
      8,
    );
    assert.equal(
      (await db.query("select * from public.qd_character_skins")).rows.length,
      3,
    );
    assert.equal(
      (await db.query("select * from public.qd_user_characters")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec("update public.qd_characters set unlock_xp=0"),
    );
    await db.exec("reset role");
    await db.exec(
      readFileSync(
        "supabase/migrations/202609080005_travel_progress.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202609080006_server_owned_progress.sql",
        "utf8",
      ),
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202609090007_national_games.sql",
        "utf8",
      ),
    );
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${a}';`);
    assert.equal(
      (await db.query("select * from public.qd_learning_states")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec(
        "update public.qd_learning_states set state=jsonb_set(state,'{progress,xp}','999999')",
      ),
    );
    assert.equal(
      (await db.query("select * from public.qd_wallet")).rows.length,
      1,
    );
    await assert.rejects(db.exec("update public.qd_wallet set coins=999999"));
    await db.exec(`reset role; set role anon;`);
    await assert.rejects(db.exec("select * from public.qd_wallet"));
    await assert.rejects(db.exec("select * from public.qd_learning_states"));
  } finally {
    await db.close();
  }
});
