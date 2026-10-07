import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { learningCatalogRows } from "../lib/learning/catalog-rows";
import { learningContentRevision } from "../lib/learning/content";
import { validateContent } from "../lib/learning/editorial/validate";
async function main() {
  const args = process.argv.slice(2),
    restore = args.includes("--restore")
      ? args[args.indexOf("--restore") + 1]
      : undefined;
  if (args.includes("--restore") && !restore)
    throw Error("Backup filename required.");
  if (!restore) {
    const validation = validateContent();
    if (validation.errors.length) throw Error(validation.errors.join("\n"));
  }
  if (!args.includes("--apply") && !restore) {
    mkdirSync("supabase/generated", { recursive: true });
    writeFileSync(
      "supabase/generated/editorial-content.json",
      JSON.stringify(learningCatalogRows(), null, 2) + "\n",
    );
    console.log(
      "Dry run: supabase/generated/editorial-content.json. No database was changed.",
    );
    process.exit(0);
  }
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw Error(
      "Server Supabase configuration required. Apply migration 017 first.",
    );
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tableNames = [
    "qd_courses",
    "qd_sections",
    "qd_lessons",
    "qd_exercises",
    "qd_exercise_options",
  ] as const;
  if (restore) {
    const data = JSON.parse(readFileSync(restore, "utf8"));
    if (!data.snapshot || !data.receipt?.newLessonIds)
      throw Error("Invalid backup.");
    const out = await db.rpc("qd_import_learning_catalog", {
      p_data: { ...data.snapshot, archiveIds: data.receipt.newLessonIds },
    });
    if (out.error) throw Error(out.error.message);
    console.log(
      "Catalog mirror restored; new lessons archived. Restore the previous source release separately.",
    );
    process.exit(0);
  }
  const snapshot: Record<string, unknown[]> = {};
  for (const table of tableNames) {
    const all: unknown[] = [];
    for (let from = 0; ; from += 500) {
      const r = await db
        .from(table)
        .select("*")
        .order(table === "qd_exercise_options" ? "exercise_id" : "id")
        .order("id")
        .range(from, from + 499);
      if (r.error) throw Error(`Backup failed for ${table}: ${r.error.code}`);
      all.push(...r.data);
      if (r.data.length < 500) break;
    }
    snapshot[table] = all;
  }
  const payload = learningCatalogRows(),
    oldIds = new Set(
      (snapshot.qd_lessons as { id: string }[]).map((l) => l.id),
    );
  mkdirSync("content-backups", { recursive: true, mode: 0o700 });
  const backup = `content-backups/${Date.now()}-${learningContentRevision}.json`;
  writeFileSync(
    backup,
    JSON.stringify(
      {
        snapshot,
        receipt: {
          revision: learningContentRevision,
          newLessonIds: payload.qd_lessons
            .filter((l) => !oldIds.has(l.id))
            .map((l) => l.id),
        },
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  const out = await db.rpc("qd_import_learning_catalog", { p_data: payload });
  if (out.error)
    throw Error(
      `Atomic catalog import failed: ${out.error.message}. Backup: ${backup}`,
    );
  console.log(
    `Imported ${payload.qd_lessons.length} lessons and ${payload.qd_exercises.length} tasks. Backup: ${backup}`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
