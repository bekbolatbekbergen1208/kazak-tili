"use client";
import { useState } from "react";
import { CharacterModal } from "@/components/characters/modal";
import { RewardPresentation } from "./reward-presentation";
import type { RewardEntry } from "@/lib/national/types";
export function LessonReward({ reward }: { reward: RewardEntry }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <CharacterModal titleId="ng-lesson-reward" onClose={() => setOpen(false)}>
      <div lang="kk">
        <h2 id="ng-lesson-reward">Сабақ аяқталды!</h2>
        <RewardPresentation reward={reward} />
        <button className="btn primary" onClick={() => setOpen(false)}>
          Жалғастыру
        </button>
      </div>
    </CharacterModal>
  );
}
