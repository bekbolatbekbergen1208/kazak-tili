import { normalizeKazakhQuery } from "../lib/dosha/kazakh-examples";
import { kazakhEvaluationCases } from "./evaluation-cases";

type TrainingRow = {
  id: string;
  group?: string;
  messages: { role: string; content: unknown }[];
};

export function assertNoEvaluationLeakage(rows: TrainingRow[]) {
  const heldOut = new Set(
    kazakhEvaluationCases
      .flatMap((item) => [
        item.prompt,
        ...(item.history ?? [])
          .filter((message) => message.role === "user")
          .map((message) => message.content),
      ])
      .map(normalizeKazakhQuery),
  );
  for (const row of rows)
    for (const message of row.messages)
      if (
        message.role === "user" &&
        typeof message.content === "string" &&
        heldOut.has(normalizeKazakhQuery(message.content))
      )
        throw Error(
          `Held-out evaluation prompt found in training row: ${row.id}`,
        );
}

export function prepareTextRows<T extends TrainingRow>(input: T[]) {
  const parents = new Map<string, string>();
  const find = (key: string) => {
    const visited: string[] = [];
    let root = key;
    while (parents.has(root) && parents.get(root) !== root) {
      visited.push(root);
      root = parents.get(root)!;
    }
    for (const item of visited) parents.set(item, root);
    return root;
  };
  const ids = new Set<string>();
  const prompts = new Map<string, string>();
  let mergedGroups = 0;
  for (const row of input) {
    if (!row.id.trim() || ids.has(row.id))
      throw Error(`Duplicate or empty training ID: ${row.id}`);
    ids.add(row.id);
    const group = row.group ?? row.id;
    // Alternative correct answers to the same complete model input must not
    // appear on opposite sides of the train/validation split either.
    const signature = JSON.stringify(
      row.messages.slice(0, -1).map(({ role, content }) => [role, content]),
    );
    const previous = prompts.get(signature);
    if (previous !== undefined) {
      const roots = [find(group), find(previous)].sort();
      if (roots[0] !== roots[1]) {
        parents.set(roots[1], roots[0]);
        mergedGroups += 1;
      }
    }
    prompts.set(signature, group);
  }
  const seen = new Set<string>();
  const rows: T[] = [];
  for (const row of input) {
    const signature = JSON.stringify(
      row.messages.map(({ role, content }) => [role, content]),
    );
    if (seen.has(signature)) continue;
    seen.add(signature);
    rows.push({ ...row, group: find(row.group ?? row.id) });
  }
  return { rows, removedDuplicates: input.length - rows.length, mergedGroups };
}
