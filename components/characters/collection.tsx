"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Check,
  LockKeyhole,
  Sparkles,
  ArrowRight,
  Palette,
} from "lucide-react";
import {
  animations,
  characters,
  rarityLabels,
  unlockedCharacters,
} from "@/lib/characters/config";
import { equipmentFor, selectedCharacter } from "@/lib/characters/state";
import type { CharacterMood } from "@/lib/characters/types";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "./character-art";
export default function CharacterCollection() {
  const { state, t, dispatch, busy } = useLearning(),
    lang = state.profile.language,
    xp = state.progress.xp,
    selected = selectedCharacter(state),
    [mood, setMood] = useState<CharacterMood>("waiting"),
    [previewKey, setPreviewKey] = useState(0),
    next = characters.find((c) => c.unlockXP > xp),
    unlocked = unlockedCharacters(xp);
  return (
    <div className="page char-collection">
      <header className="char-page-heading">
        <div>
          <span className="char-kicker">
            <Sparkles size={16} /> QAZAQDOS COMPANIONS
          </span>
          <h1>
            {t(
              "Менің кейіпкерлерім · Мои друзья",
              "Менің кейіпкерлерім · My companions",
            )}
          </h1>
          <p>
            {t(
              "Учитесь вместе. У каждого друга — свой характер.",
              "Learn together. Every companion has a personality of their own.",
            )}
          </p>
        </div>
        <span className="char-counter">
          {unlocked.length} / {characters.length} {t("открыто", "unlocked")}
        </span>
      </header>
      <section
        className="char-featured"
        style={
          {
            "--char-feature-color": selected.primaryColor,
          } as React.CSSProperties
        }
      >
        <div className="char-feature-stage">
          <span className="char-orbit" />
          <CharacterArt
            key={`${selected.id}-${mood}-${previewKey}`}
            characterId={selected.id}
            mood={mood}
            equipped={equipmentFor(state)}
          />
          <span className="char-selected-badge">
            <Check size={14} />
            {t("Ваш помощник", "Your companion")}
          </span>
        </div>
        <div className="char-feature-copy">
          <span className={`char-rarity ${selected.rarity}`}>
            {rarityLabels[selected.rarity][lang]}
          </span>
          <h2>{selected.name}</h2>
          <span className="char-species">{selected.animalType[lang]}</span>
          <p>{selected.description[lang]}</p>
          <p className="char-muted">{selected.quirk[lang]}</p>
          <fieldset className="char-animation-picker">
            <legend>{t("Попробуйте эмоции", "Try the emotions")}</legend>
            {animations.map((a) => (
              <button
                type="button"
                aria-pressed={mood === a.id}
                key={a.id}
                onClick={() => {
                  setMood(a.id);
                  setPreviewKey((k) => k + 1);
                }}
              >
                {a.label[lang]}
              </button>
            ))}
          </fieldset>
          <Link className="btn ghost" href="/learn/inventory">
            <Palette size={17} />
            {t("Одеть персонажа", "Dress your companion")}
          </Link>
        </div>
      </section>
      <section
        className="char-unlock-track"
        aria-label={t("Прогресс открытия", "Unlock progress")}
      >
        <div>
          <b>
            {next
              ? t(
                  `До ${next.name} осталось ${next.unlockXP - xp} XP`,
                  `${next.unlockXP - xp} XP to unlock ${next.name}`,
                )
              : t("Все друзья уже с вами!", "All your friends are here!")}
          </b>
          <span>
            {xp} {next ? `/ ${next.unlockXP}` : ""} XP
          </span>
        </div>
        <progress
          aria-label={t("Общий опыт", "Total experience")}
          value={next ? xp : 1}
          max={next?.unlockXP ?? 1}
        />
        <small>
          {t(
            "Новые друзья открываются за общий XP. Покупки не уменьшают опыт.",
            "New friends unlock with total XP. Shopping never reduces your experience.",
          )}
        </small>
      </section>
      <div className="char-collection-grid">
        {characters.map((c) => {
          const open = xp >= c.unlockXP,
            active = c.id === selected.id;
          return (
            <article
              className={`char-card ${open ? "" : "is-locked"} ${active ? "is-selected" : ""} ${c.isLegendary ? "is-legendary" : ""}`}
              key={c.id}
              aria-label={c.name}
              data-testid={`character-card-${c.id}`}
            >
              <div className="char-card-stage">
                <CharacterArt
                  characterId={c.id}
                  mood="waiting"
                  silhouette={!open}
                  equipped={open ? equipmentFor(state, c.id) : {}}
                  label={
                    open
                      ? `${c.name}, ${c.animalType[lang]}`
                      : t(`Силуэт ${c.name}`, `${c.name} silhouette`)
                  }
                />
                {!open && (
                  <span className="char-lock">
                    <LockKeyhole size={22} />
                  </span>
                )}
              </div>
              <div className="char-card-copy">
                <span className="char-xp">{c.unlockXP} XP</span>
                <h3>{c.name}</h3>
                {open ? (
                  <>
                    <p>{c.personality[lang]}</p>
                    <button
                      className={`btn ${active ? "ghost" : "primary"}`}
                      disabled={busy || active}
                      onClick={() =>
                        void dispatch({
                          type: "select-character",
                          characterId: c.id,
                        })
                      }
                    >
                      {active ? (
                        <>
                          <Check size={16} />
                          {t("Выбран", "Selected")}
                        </>
                      ) : (
                        <>
                          {t("Выбрать", "Choose")}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      {t(
                        `Ещё ${c.unlockXP - xp} XP — и вы познакомитесь.`,
                        `${c.unlockXP - xp} more XP until you meet.`,
                      )}
                    </p>
                    <progress
                      aria-label={t(`Открытие ${c.name}`, `Unlock ${c.name}`)}
                      max={c.unlockXP}
                      value={xp}
                    />
                    <span className="char-locked-label">
                      <LockKeyhole size={13} />
                      {t("Пока недоступен", "Not unlocked yet")}
                    </span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
