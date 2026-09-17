"use client";
import { useLearning } from "@/components/learning/provider";
import { travelOf, travelAchievements } from "@/lib/travel/state";
import { CharacterModal } from "@/components/characters/modal";
import { TravelIcon, RegionStamp } from "./art";
import { regions } from "@/lib/travel/catalog";
export function TravelRewards() {
  const { state, dispatch, busy } = useLearning();
  const t = travelOf(state);
  const stamp = regions.find(
    (r) =>
      t.regions[r.id]?.stampUnlocked && !t.announced.includes(`stamp:${r.id}`),
  );
  const id =
    t.achievements.find((id) => !t.announced.includes(id)) ??
    (stamp ? `stamp:${stamp.id}` : undefined);
  if (!id) return null;
  const close = () => {
    if (!busy) void dispatch({ type: "travel-announce", id });
  };
  return (
    <CharacterModal titleId="travel-reward-title" onClose={close}>
      <TravelIcon kind="book" />
      <p>Саяхат жетістігі</p>
      <h2 id="travel-reward-title">
        {id.startsWith("stamp:") ? "Жаңа мөр ашылды!" : travelAchievements[id]}
      </h2>
      {id.startsWith("stamp:") && stamp && (
        <RegionStamp
          name={stamp.nameKk}
          icon={stamp.stamp}
          index={regions.indexOf(stamp)}
          unlocked
        />
      )}
      <p>Әр қадам — жаңа білім.</p>
      <button className="btn primary" disabled={busy} onClick={close}>
        Саяхатты жалғастыру
      </button>
    </CharacterModal>
  );
}
