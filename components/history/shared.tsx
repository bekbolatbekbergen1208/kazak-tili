"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { equipmentFor, selectedCharacter } from "@/lib/characters/state";
import { historyRank, historyProgress } from "@/lib/history/state";
import { Mascot } from "@/components/icons";
import type { Point } from "@/lib/travel/types";

export function HistoryHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { state, busy, dispatch, demo, localOnly } = useLearning();
  return (
    <header className="hs-header">
      <div className="hs-topline">
        <Link href="/learn/history">← Тарих</Link>
        <Link href="/learn/history/notebook">Менің тарих дәптерім ↗</Link>
      </div>
      <div className="hs-heading">
        <div>
          <p className="hs-eyebrow">QAZAQDOS · ҰЛЫ ДАЛА ІЗДЕРІ</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button
          className="hs-button hs-soft"
          disabled={busy}
          onClick={() =>
            void dispatch({
              type: "history-night",
              night: !historyProgress(state).night,
            })
          }
        >
          {historyProgress(state).night ? "☀ Күндіз" : "☾ Түнгі көрініс"}
        </button>
      </div>
      <div className="hs-stats">
        <span>✧ {historyRank(state).title}</span>
        <span>{state.progress.xp} XP</span>
        <span>🪙 {state.progress.coins}</span>
        <span>💎 {state.progress.national?.crystals ?? 0}</span>
        <small>
          {demo || localOnly
            ? "Осы браузерде сақталады"
            : "Аккаунтта сақталады"}
        </small>
      </div>
    </header>
  );
}
export function Dossha({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="hs-dossha"
      role="complementary"
      aria-label="Досшаның кеңесі"
    >
      <Mascot />
      <div>
        <strong>Досша</strong>
        <div aria-live="polite">{children}</div>
      </div>
    </div>
  );
}
export function Traveler({ point }: { point: Point }) {
  const { state } = useLearning();
  return (
    <div
      className="hs-traveler"
      data-testid="history-traveler"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
      aria-hidden="true"
    >
      <CharacterArt
        characterId={selectedCharacter(state).id}
        equipped={equipmentFor(state)}
        mood="joy"
        decorative
      />
      <Mascot />
    </div>
  );
}
export function HistoryModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="hs-modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="hs-close" aria-label="Жабу" onClick={onClose}>
        ×
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}
