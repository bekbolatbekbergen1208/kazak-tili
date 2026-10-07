import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { learningCatalogRows } from "../lib/learning/catalog-rows";

test("editorial import is atomic, repeatable and hides unpublished material", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated,anon,service_role;`,
    );
    for (const file of [
      "202609070001_learning_mvp.sql",
      "202609070002_learning_content.sql",
      "202610070017_content_editorial.sql",
    ])
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    const before = (await db.query("select * from qd_learning_states")).rows;
    const payload = learningCatalogRows();
    await db.exec("set role service_role");
    for (let i = 0; i < 2; i++)
      await db.query("select qd_import_learning_catalog($1::jsonb)", [
        JSON.stringify(payload),
      ]);
    await db.exec("reset role");
    assert.equal(
      (await db.query<{ n: number }>("select count(*)::int n from qd_lessons"))
        .rows[0].n,
      105,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from qd_exercises",
        )
      ).rows[0].n,
      535,
    );
    assert.deepEqual(
      (await db.query("select * from qd_learning_states")).rows,
      before,
    );
    const id = payload.qd_lessons.find((l) => l.content.objective)!.id;
    await db.query(
      "update qd_lessons set content=jsonb_set(content,'{status}','\"draft\"') where id=$1",
      [id],
    );
    await db.exec("set role authenticated");
    assert.equal(
      (await db.query("select * from qd_lessons where id=$1", [id])).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query("select * from qd_exercises where lesson_id=$1", [id]))
        .rows.length,
      0,
    );
    await assert.rejects(
      db.query("select qd_import_learning_catalog($1::jsonb)", [
        JSON.stringify(payload),
      ]),
    );
    await db.exec("reset role");
    const count = (
      await db.query<{ n: number }>("select count(*)::int n from qd_lessons")
    ).rows[0].n;
    const broken = {
      ...payload,
      qd_lessons: [
        ...payload.qd_lessons,
        { ...payload.qd_lessons[0], id: "invalid", section_id: "missing" },
      ],
    };
    await assert.rejects(
      db.query("select qd_import_learning_catalog($1::jsonb)", [
        JSON.stringify(broken),
      ]),
    );
    assert.equal(
      (await db.query<{ n: number }>("select count(*)::int n from qd_lessons"))
        .rows[0].n,
      count,
    );
    await db.query("select qd_import_learning_catalog($1::jsonb)", [
      JSON.stringify({ archiveIds: [id] }),
    ]);
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select content->>'status' status from qd_lessons where id=$1",
          [id],
        )
      ).rows[0].status,
      "archived",
    );
  } finally {
    await db.close();
  }
});
