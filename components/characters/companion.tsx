"use client";
import Link from "next/link";
import { useLearning } from "@/components/learning/provider";
import { equipmentFor, selectedCharacter } from "@/lib/characters/state";
import { nextLesson } from "@/lib/learning/state";
import { books, lessonById } from "@/lib/learning/content";
import { localized } from "@/lib/learning/languages";
import type { CharacterMood } from "@/lib/characters/types";
import type { Exercise } from "@/lib/learning/types";
import { CharacterArt } from "./character-art";
export function Companion({
  mood = "greeting",
  text,
  exercise,
  context,
}: {
  mood?: CharacterMood;
  text?: string;
  exercise?: Exercise;
  context?: "map" | "books" | "profile";
}) {
  const { state, t } = useLearning(),
    c = selectedCharacter(state),
    lang = state.profile.language;
  let actualMood = mood,
    extra = "";
  if (mood === "joy" && c.id === "aibar" && state.progress.combo >= 3)
    actualMood = "victory";
  if (
    exercise?.kind === "timed" &&
    !["support", "joy", "victory"].includes(mood) &&
    c.id === "balapan"
  )
    actualMood = "running";
  if (c.id === "tilmash" && exercise && (mood === "thinking" || mood === "joy"))
    extra = `${exercise.example} — ${localized(exercise.translation, lang)}`;
  if (c.id === "qyran" && context === "map")
    extra = `${t("Следующая цель", "Next goal")}: ${localized(lessonById(nextLesson(state))?.title ?? { ru: "", en: "" }, lang)}`;
  if (
    c.id === "danaqulaq" &&
    (context === "books" || state.profile.goal === "books")
  )
    extra = (
      books.find(
        (b) =>
          b.id ===
          (exercise
            ? lessonById(exercise.id.replace(/-\d+$/, ""))?.bookId
            : undefined),
      ) ?? books[0]
    ).summary[lang] ?? (books.find(
      (b) =>
        b.id ===
        (exercise
          ? lessonById(exercise.id.replace(/-\d+$/, ""))?.bookId
          : undefined),
    ) ?? books[0]).summary.ru;
  const equipment = equipmentFor(state);
  if (c.id === "tilmash" && exercise && !equipment.hand)
    equipment.hand = "dictionary";
  if (c.id === "aqbota" && state.profile.goal === "tourism") {
    equipment.hand ??= "map";
    equipment.back ??= "backpack";
  }
  if (c.id === "danaqulaq" && (context === "books" || mood === "thinking"))
    equipment.hand ??= "book";
  return (
    <div
      className={`qd-companion char-companion ${c.isLegendary ? "char-legendary" : ""} ${equipment.room === "room-steppe" ? "char-room" : ""} ${equipment.victory === "victory-stars" && ["joy", "victory", "celebration"].includes(actualMood) ? "char-stars" : ""}`}
    >
      <CharacterArt characterId={c.id} mood={actualMood} equipped={equipment} />
      <div className="char-speech">
        <Link className="char-companion-name" href="/learn/characters">
          {c.name} <span>↗</span>
        </Link>
        <p>
          {localized(c.dialogueLines[actualMood], lang)}
          {text && <span className="char-context">{text}</span>}
        </p>
        {extra && <small>{extra}</small>}
      </div>
    </div>
  );
}
