"use client";
import Link from "next/link";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { travelOf, travelTitle, travelXP } from "@/lib/travel/state";
import { KazakhstanMap } from "./map";
import { AnimationSettings } from "./settings";
import { ProgressOverview, TravelPassport } from "./passport";
export function TravelHome() {
  const { state, dispatch, busy } = useLearning();
  const t = travelOf(state);
  return (
    <div className="travel-page" lang="kk">
      <div className="travel-intro-heading">
        <div>
          <span className="travel-eyebrow">ҰЛЫ ДАЛА · ҮЛКЕН САЯХАТ</span>
          <h1>
            Қазақстанға <em>саяхат</em>
          </h1>
          <p>Қазақстанды таны. Қазақша үйрен. Саяхатта!</p>
          <span className="travel-title-badge">
            {travelTitle(travelXP(state))}
          </span>
        </div>
        <div className="travel-home-character">
          <CharacterArt
            characterId={selectedCharacter(state).id}
            mood="greeting"
            equipped={equipmentFor(state)}
          />
        </div>
      </div>
      <ProgressOverview />
      {!t.settings.introSeen && (
        <section className="travel-welcome">
          <h2>Сәлем, саяхатшы!</h2>
          <p>
            Картадан өңірді таңда → кейіпкермен саяхатта → нысандарды зертте →
            сөздер мен ойындарды орында → паспортқа мөр жина.
          </p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() =>
              void dispatch({
                type: "travel-settings",
                settings: { ...t.settings, introSeen: true },
              })
            }
          >
            Түсінікті, бастайық
          </button>
          <button
            className="btn ghost"
            disabled={busy}
            onClick={() =>
              void dispatch({
                type: "travel-settings",
                settings: { ...t.settings, introSeen: true },
              })
            }
          >
            Кіріспені өткізу
          </button>
        </section>
      )}
      <div className="travel-quick-links">
        <a href="#passport">Саяхат паспорты ↓</a>
        {t.lastRegion && (
          <Link href={`/kazakhstan/${t.lastRegion}`}>
            Соңғы өңірді жалғастыру →
          </Link>
        )}
        <span>
          Ортақ баланс: {state.progress.xp} XP · {state.progress.coins} тиын
        </span>
      </div>
      <KazakhstanMap />
      <AnimationSettings />
      <TravelPassport />
    </div>
  );
}
