import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { CharacterArt } from "../components/characters/character-art";
import { characters } from "../lib/characters/config";
for (const c of characters) {
  const markup = renderToStaticMarkup(<CharacterArt characterId={c.id} />);
  const svg = markup.slice(
    markup.indexOf("<svg"),
    markup.lastIndexOf("</svg>") + 6,
  );
  writeFileSync(`public/characters/${c.id}.svg`, svg + "\n");
}
console.log("Rendered eight original SVG character assets.");
