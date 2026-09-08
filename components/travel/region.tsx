"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Card, Region } from "@/lib/travel/types";
import { coreSections, sectionNames } from "@/lib/travel/types";
import { travelOf, emptyRegion } from "@/lib/travel/state";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { TravelIcon } from "./art";
import { VocabularyCards, RegionGames } from "./games";
import { AnimationSettings } from "./settings";
import { useTravelMotion } from "./motion";
export function RegionPage({ region: r }: { region: Region }) {
  const { state, dispatch, busy } = useLearning();
  const p = travelOf(state).regions[r.id] ?? emptyRegion();
  const [section, setSection] = useState<string>("nature"),
    [object, setObject] = useState<Card | null>(null);
  const initiated = useRef("");
  const { ref, mode, paused } = useTravelMotion();
  useEffect(() => {
    if (initiated.current === r.id) return;
    initiated.current = r.id;
    void dispatch({ type: "travel-visit", regionId: r.id });
  }, [r.id, dispatch]);
  const sections: Record<string, Card[]> = {
    nature: [...r.nature, ...r.plants],
    animals: r.animals,
    history: [...r.history, ...r.famousPeople],
    landmarks: r.landmarks,
    culture: [...r.culture, ...r.foods],
    industry: [...r.resources, ...r.industries, ...r.agriculture],
    importance: r.importance,
  };
  const char = selectedCharacter(state);
  return (
    <div
      ref={ref}
      className={`travel-page motion-${mode} ${paused ? "motion-paused" : ""}`}
      lang="kk"
    >
      <nav className="travel-breadcrumb">
        <Link href="/kazakhstan">← Қазақстан картасы</Link>
        <span>{r.nameKk}</span>
      </nav>
      <header className={`travel-region-hero theme-${r.theme}`}>
        <div>
          <span className="travel-eyebrow">
            {r.type === "city"
              ? "РЕСПУБЛИКАЛЫҚ МАҢЫЗЫ БАР ҚАЛА"
              : `ОБЛЫС ОРТАЛЫҒЫ · ${r.capital}`}
          </span>
          <h1>{r.nameKk}</h1>
          <p>{r.shortDescription}</p>
          <div className="travel-hero-links">
            <a href="#vocabulary">{r.vocabulary.length} сөзді үйрену ↓</a>
            <a href="#games">Ойындарға өту ↓</a>
          </div>
        </div>
        <div className="travel-region-character">
          <CharacterArt
            characterId={char.id}
            mood={p.stampUnlocked ? "celebration" : "greeting"}
            equipped={equipmentFor(state, char.id)}
          />
        </div>
      </header>
      {!p.visited && (
        <button
          className="btn primary"
          disabled={busy}
          onClick={() =>
            void dispatch({ type: "travel-visit", regionId: r.id })
          }
        >
          Саяхатты бастау
        </button>
      )}
      {r.contentStatus === "partial" && (
        <p className="travel-content-note">
          Өңірді зерттеуге болады. Толық контент тексеріліп жатқандықтан, аяқтау
          мөрі әзірге жабық.
        </p>
      )}
      <div className="travel-region-progress">
        <span>{p.xpEarned} XP</span>
        <span>
          Бөлімдер: {p.sectionsViewed.length}/{coreSections.length}
        </span>
        <span>
          Сөздер: {p.vocabularyLearned.length}/{r.vocabulary.length}
        </span>
        <span>{p.stampUnlocked ? "✓ Мөр алынды" : "○ Мөр әлі ашылмады"}</span>
      </div>
      <section
        className={`travel-world theme-${r.theme}`}
        aria-label="Өңірдің интерактивті көрінісі"
      >
        <div className="travel-world-sky" aria-hidden="true">
          <span className="ambient ambient-cloud">☁</span>
          <TravelIcon kind="bird" className="ambient ambient-bird" />
        </div>
        <div className="travel-world-hills" aria-hidden="true">
          <TravelIcon kind={r.theme === "city" ? "city" : "mountain"} />
          <TravelIcon kind={r.theme === "sea" ? "wave" : "tree"} />
          <TravelIcon kind={r.theme === "city" ? "monument" : "mountain"} />
        </div>
        <div className="travel-world-objects">
          {r.mapObjects.map((o) => (
            <button
              key={o.id}
              className={`travel-world-object ambient ambient-${o.icon}`}
              aria-label={`${o.title} зерттеу`}
              onClick={async () => {
                setObject(o);
                if (p.visited)
                  await dispatch({
                    type: "travel-object",
                    regionId: r.id,
                    objectId: o.id,
                  });
              }}
            >
              <TravelIcon kind={o.icon} />
              <span>
                {p.objectsExplored.includes(o.id) ? "✓ " : ""}
                {o.title}
              </span>
            </button>
          ))}
        </div>
        <small>
          Нысанды түртіп, оның тарихын аш. Иллюстрациялық көрініс; нысандардың
          арақашықтығы шартты.
        </small>
      </section>
      {object && (
        <section className="travel-object-detail" aria-live="polite">
          <button
            className="travel-close"
            aria-label="Нысан карточкасын жабу"
            onClick={() => setObject(null)}
          >
            ×
          </button>
          <TravelIcon kind={object.icon} />
          <div>
            <h2>{object.title}</h2>
            <p>{object.text}</p>
            {object.wordId && (
              <p>
                Жаңа сөз:{" "}
                <strong>
                  {r.vocabulary.find((w) => w.id === object.wordId)?.kk}
                </strong>
              </p>
            )}
            <a href="#vocabulary" className="btn ghost">
              Жаңа сөзді үйрену
            </a>
            <a href="#games" className="btn ghost">
              Тапсырманы орындау
            </a>
          </div>
        </section>
      )}
      <section className="travel-panel">
        <nav className="travel-tabs" aria-label="Өңір бөлімдері">
          {coreSections.map((id) => (
            <button
              key={id}
              aria-pressed={section === id}
              onClick={() => setSection(id)}
            >
              {p.sectionsViewed.includes(id) ? "✓ " : ""}
              {sectionNames[id]}
            </button>
          ))}
        </nav>
        <h2>{sectionNames[section]}</h2>
        <div className="travel-content-grid">
          {sections[section].map((c) => (
            <article key={c.id}>
              <TravelIcon kind={c.icon} />
              <div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                {c.status && <small>{c.status}</small>}
                {c.source && (
                  <a href={c.source} target="_blank" rel="noreferrer">
                    Дереккөз ↗
                  </a>
                )}
                {section === "animals" && (
                  <button
                    className="btn ghost"
                    disabled={busy || p.objectsExplored.includes(c.id)}
                    onClick={() =>
                      void dispatch({
                        type: "travel-object",
                        regionId: r.id,
                        objectId: c.id,
                      })
                    }
                  >
                    {p.objectsExplored.includes(c.id)
                      ? "✓ Зерттелді"
                      : "Жануарды зерттеу"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!sections[section].length ? (
          <p className="travel-content-note">
            Бұл бөлімнің деректері әлі тексеріліп жатыр. Ол өңірдің толық
            аяқталуына есептелмейді.
          </p>
        ) : (
          <button
            className="btn primary"
            disabled={busy || !p.visited || p.sectionsViewed.includes(section)}
            onClick={() =>
              void dispatch({
                type: "travel-section",
                regionId: r.id,
                sectionId: section,
              })
            }
          >
            {p.sectionsViewed.includes(section)
              ? "✓ Бөлім қаралды"
              : "Оқып шықтым"}
          </button>
        )}
      </section>
      <section className="travel-panel">
        <h2>Есте сақта</h2>
        <ul>
          {r.interestingFacts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      <VocabularyCards region={r} />
      <RegionGames region={r} />
      <AnimationSettings />
      <details className="travel-sources">
        <summary>Дереккөздер және контент күйі</summary>
        <p>
          {r.contentStatus === "ready"
            ? "Негізгі контент дайын."
            : "Контент толықтырылуда. Осы өңірдің толық аяқтау мөрі әзірге жабық."}
        </p>
        {r.missingContent.length > 0 && (
          <ul>
            {r.missingContent.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
        <ul>
          {r.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p>Иллюстрациялар: QazaqDos авторлық SVG. Бұл фотосуреттер емес.</p>
      </details>
      <Link href="/kazakhstan#passport" className="btn ghost">
        Паспортқа оралу →
      </Link>
    </div>
  );
}
