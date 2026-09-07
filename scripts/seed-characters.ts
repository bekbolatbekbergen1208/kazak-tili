import { writeFileSync } from "node:fs";
import {
  animations,
  characters,
  characterShop,
  unlockRequirements,
} from "../lib/characters/config";
const quote = (v: unknown) =>
  v === null
    ? "null"
    : `'${(typeof v === "string" ? v : JSON.stringify(v)).replaceAll("'", "''")}'`;
const lines = [
  "-- Generated companion catalog; source: lib/characters/config.ts",
  "begin;",
];
function insert(table: string, columns: string[], values: unknown[]) {
  lines.push(
    `insert into public.${table} (${columns.join(",")}) values (${values.map(quote).join(",")}) on conflict do nothing;`,
  );
}
for (const c of characters) {
  insert(
    "qd_characters",
    [
      "id",
      "name",
      "animal_type",
      "primary_color",
      "secondary_color",
      "unlock_xp",
      "rarity",
      "image_url",
      "is_legendary",
      "content",
    ],
    [
      c.id,
      c.name,
      c.animalType,
      c.primaryColor,
      c.secondaryColor,
      c.unlockXP,
      c.rarity,
      c.imageUrl,
      c.isLegendary,
      c,
    ],
  );
  for (const a of animations)
    insert(
      "qd_character_animations",
      ["character_id", "mood", "content"],
      [c.id, a.id, a],
    );
}
for (const r of unlockRequirements)
  insert(
    "qd_character_unlock_requirements",
    ["character_id", "xp"],
    [r.characterId, r.xp],
  );
for (const i of characterShop) {
  insert(
    "qd_shop_items",
    ["id", "price", "slot", "rarity", "content"],
    [i.id, i.price, i.slot ?? null, i.rarity, i],
  );
  if (i.slot === "skin")
    insert("qd_character_skins", ["item_id", "content"], [i.id, i]);
  if (
    i.slot &&
    ["outfit", "hat", "eyewear", "back", "hand", "neck"].includes(i.slot)
  )
    insert("qd_character_accessories", ["item_id", "content"], [i.id, i]);
}
insert(
  "qd_achievements",
  ["id", "content"],
  [
    "legendary",
    {
      id: "legendary",
      title: {
        ru: "Аңыз деңгейі · Уровень легенды",
        en: "Аңыз деңгейі · Legend level",
      },
      icon: "✦",
    },
  ],
);
lines.push("commit;");
writeFileSync(
  "supabase/migrations/202609070004_character_catalog.sql",
  lines.join("\n") + "\n",
);
console.log(
  `Seed: ${characters.length} characters and ${characterShop.length} fixed-price items.`,
);
