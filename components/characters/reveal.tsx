"use client";
import { Sparkles, ArrowRight } from "lucide-react";
import { pendingReveals } from "@/lib/characters/state";
import { rarityLabels } from "@/lib/characters/config";
import { CharacterArt } from "./character-art";
import { CharacterModal } from "./modal";
import { useLearning } from "@/components/learning/provider";
import { usePathname } from "next/navigation";
export function CharacterReveal() {
  const { state, dispatch, busy, t } = useLearning();
  const historyMode = usePathname().startsWith("/learn/history");
  const character = pendingReveals(state)[0];
  if (!state.profile.onboarded || !character) return null;
  const acknowledge = (select: boolean) => {
    if (!busy)
      void dispatch({
        type: "reveal-character",
        characterId: character.id,
        select,
      });
  };
  return (
    <CharacterModal
      key={character.id}
      titleId="char-reveal-title"
      onClose={() => acknowledge(false)}
    >
      <div
        className={`char-reveal ${character.isLegendary ? "is-legendary" : ""}`}
      >
        <span className="char-reveal-rays" aria-hidden />
        <span className="char-kicker">
          <Sparkles size={16} /> Жаңа дос ашылды!
        </span>
        <h2 id="char-reveal-title">
          {t("Новый друг открыт!", "A new friend unlocked!")}
        </h2>
        <CharacterArt characterId={character.id} mood="celebration" />
        <h3>{character.name}</h3>
        <span className={`char-rarity ${character.rarity}`}>
          {historyMode
            ? "Саяхат серігі"
            : rarityLabels[character.rarity][state.profile.language]}{" "}
          · {character.unlockXP} XP
        </span>
        <p>
          {historyMode
            ? "Тарихты зерттеген сайын жаңа достар ашылады. Бұл кейіпкер енді коллекцияңда!"
            : character.personality[state.profile.language]}
        </p>
        {!historyMode && (
          <p className="char-muted">
            {character.quirk[state.profile.language]}
          </p>
        )}
        {character.isLegendary && (
          <p className="char-legend-award">
            Аңыз деңгейі ·{" "}
            {t("Достижение и 50 монет", "Achievement and 50 coins")}
          </p>
        )}
        <div className="char-reveal-actions">
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => acknowledge(true)}
          >
            {t("Выбрать помощником", "Choose as companion")}
            <ArrowRight size={17} />
          </button>
          <button
            className="btn ghost"
            disabled={busy}
            onClick={() => acknowledge(false)}
          >
            {t("Оставить в коллекции", "Keep in collection")}
          </button>
        </div>
      </div>
    </CharacterModal>
  );
}
