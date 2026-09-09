"use client";
import Link from "next/link";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { national } from "@/lib/national/state";
import { nationalGames } from "@/lib/national/catalog";
import { levelFor } from "@/lib/learning/state";
import { NationalFrame, Landscape } from "./shared";
export function NationalHub() {
  const { state, dispatch, busy } = useLearning(),
    n = national(state),
    level = levelFor(state.progress.xp);
  return (
    <NationalFrame title="Ұлттық ойындар">
      <div className="ng-village">
        <Landscape />
        <div className="ng-village-copy">
          <span className="ng-eyebrow">QAZAQDOS · ОЙЫН АУЫЛЫ</span>
          <h2>
            Далаға шық.
            <br />
            Ойна. Қазақша үйрен!
          </h2>
          <p>Дәстүрлі ойындар, жаңа сөздер және сенің сүйікті досың.</p>
          <span className="ng-badge">
            🔥 {state.progress.streak.current} күндік серия · {level}-деңгей
          </span>
        </div>
        <CharacterArt
          characterId={selectedCharacter(state).id}
          equipped={equipmentFor(state)}
          mood="greeting"
        />
      </div>
      {!n.settings.onboarded && (
        <section className="ng-card ng-onboarding">
          <h2>Ойын ауылына қош келдің!</h2>
          <p>
            1. Ойынды таңда. 2. Қазақша тапсырманы орында. 3. Марапат жинап,
            досыңды дамыт.
          </p>
          <p>
            Күніне алғашқы үш ойынға марапат беріледі. Одан кейін жаттыға бер!
            Дыбыс пен әуенді жоғарыдан қосуға болады.
          </p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() =>
              void dispatch({
                type: "national-settings",
                settings: { ...n.settings, onboarded: true },
              })
            }
          >
            Түсіндім, бастайық!
          </button>
        </section>
      )}
      {n.session && !n.session.finished && (
        <Link className="ng-resume" href={`/learn/national/${n.session.kind}`}>
          ▶ Аяқталмаған ойынды жалғастыру
        </Link>
      )}
      <div className="ng-grid">
        {nationalGames.map((g) => (
          <article className={`ng-card ng-game-card ng-${g.id}`} key={g.id}>
            <span className="ng-game-icon" aria-hidden="true">
              {g.icon}
            </span>
            <span className="ng-badge">
              {level >= g.level ? "🔓 Ашық" : `🔒 ${g.level}-деңгейде ашылады`}
            </span>
            <h2>{g.title}</h2>
            <p>{g.description}</p>
            <p>{g.difficulty} · 20+ XP · 20–50 🪙 · жеңіске 2 💎</p>
            {level >= g.level ? (
              <Link className="btn primary" href={`/learn/national/${g.id}`}>
                Ойнау →
              </Link>
            ) : (
              <Link className="btn ghost" href="/learn/map">
                Сабақ оқып, деңгейді көтер
              </Link>
            )}
          </article>
        ))}
      </div>
    </NationalFrame>
  );
}
