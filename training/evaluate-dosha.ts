import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { runEvaluation, type EvaluationMode } from "./evaluation";

async function main() {
  const { values } = parseArgs({
    options: {
      mode: { type: "string", default: "reference" },
      output: { type: "string" },
      limit: { type: "string" },
    },
  });
  if (values.mode !== "reference" && values.mode !== "model")
    throw Error("--mode must be reference or model");
  const report = await runEvaluation({
    mode: values.mode as EvaluationMode,
    limit: values.limit === undefined ? undefined : Number(values.limit),
  });
  const filename = path.resolve(
    values.output ??
      `training/artifacts/evaluation-${values.mode}-${Date.now()}.json`,
  );
  await mkdir(path.dirname(filename), { recursive: true });
  // Avoid silently replacing a reviewer-edited report.
  await writeFile(filename, JSON.stringify(report, null, 2) + "\n", {
    encoding: "utf8",
    flag: "wx",
  });
  console.log(JSON.stringify({ filename, ...report.summary }, null, 2));
  if (report.summary.failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Evaluation failed");
  process.exitCode = 1;
});
