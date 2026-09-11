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
    await db.exec("reset role");
    await db.exec(
      readFileSync("supabase/migrations/202609090008_book_friends.sql", "utf8"),
    );
    await db.query(
      "insert into public.qd_reading_members(user_id,invite_code) values ($1,'111111111111'),($2,'222222222222')",
      [a, b],
    );
    await db.query(
      "insert into public.qd_reading_friends(user_a,user_b) values ($1,$2)",
      [a, b],
    );
    await assert.rejects(
      db.query(
        "insert into public.qd_reading_friends(user_a,user_b) values ($1,$2)",
        [b, a],
      ),
    );
    for (const role of ["authenticated", "anon"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.exec("select * from public.qd_reading_members"));
      await assert.rejects(db.exec("select * from public.qd_reading_friends"));
      await assert.rejects(db.exec("delete from public.qd_reading_friends"));
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    assert.equal(
      (await db.query("select * from public.qd_reading_friends")).rows.length,
      1,
    );
    await db.exec("reset role");
    await db.query("delete from public.qd_reading_members where user_id=$1", [
      b,
    ]);
    assert.equal(
      (await db.query("select * from public.qd_reading_friends")).rows.length,
      0,
    );
    await db.exec(
      readFileSync("supabase/migrations/202609090009_friend_chat.sql", "utf8"),
    );
    await db.query(
      "insert into public.qd_friend_conversations(user_id,messages) values ($1,'[]'),($2,'[]')",
      [a, b],
    );
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${a}'`);
    assert.equal(
      (await db.query("select * from public.qd_friend_conversations")).rows
        .length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update public.qd_friend_conversations set messages='[]' where user_id=$1 returning user_id",
          [b],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.qd_friend_conversations where user_id=$1 returning user_id",
          [b],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.qd_friend_conversations(user_id,messages) values ($1,'[]')",
        [b],
      ),
    );
    await db.query(
      "update public.qd_friend_conversations set messages=$1 where user_id=$2",
      [JSON.stringify([{ role: "user", content: "Септік деген не?" }]), a],
    );
    await assert.rejects(
      db.query(
        "update public.qd_friend_conversations set messages=$1 where user_id=$2",
        [JSON.stringify(Array(21).fill({ role: "user", content: "hi" })), a],
      ),
    );
    await db.exec("reset role; set role anon");
    await assert.rejects(
      db.exec("select * from public.qd_friend_conversations"),
    );
    await db.exec("reset role");
    await db.exec(
      readFileSync(
        "supabase/migrations/202609100010_friendships_vision.sql",
        "utf8",
      ),
    );
    await db.query(
      "insert into public.qd_friend_profiles(user_id,friend_code,username) values ($1,'AAA11111','learner_a'),($2,'BBB22222','learner_b')",
      [a, b],
    );
    await db.query(
      "insert into public.qd_friend_requests(sender_id,receiver_id) values ($1,$2)",
      [a, b],
    );
    await assert.rejects(
      db.query(
        "insert into public.qd_friend_requests(sender_id,receiver_id) values ($1,$2)",
        [b, a],
      ),
    );
    await db.query(
      "insert into public.qd_friendships(user_a,user_b) values ($1,$2)",
      [a, b],
    );
    await db.query(
      "insert into public.qd_friend_events(id,user_a,user_b,kind,points) values ('shared-day:test',$1,$2,'shared-day',5)",
      [a, b],
    );
    for (const role of ["authenticated", "anon"]) {
      await db.exec(`set role ${role}`);
      for (const table of [
        "qd_friend_profiles",
        "qd_friend_requests",
        "qd_friendships",
        "qd_friend_events",
      ])
        await assert.rejects(db.exec(`select * from public.${table}`));
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    assert.equal(
      (await db.query("select * from public.qd_friend_events")).rows.length,
      1,
    );
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});
