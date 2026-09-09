import type { CSSProperties } from "react";
import type { RewardEntry } from "@/lib/national/types";
export function RewardPresentation({ reward }: { reward: RewardEntry }) {
  return (
    <div className="ng-reward-presentation">
      <div className="ng-reward-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            style={
              {
                "--flight-x": `${(i - 3.5) * 35}px`,
                "--flight-y": `${-50 - Math.abs(i - 3.5) * 12}px`,
                animationDelay: `${0.3 + i * 0.07}s`,
              } as CSSProperties
            }
          >
            {i % 3 === 0 ? "✦" : "🪙"}
          </span>
        ))}
      </div>
      <div className="ng-chest" aria-hidden="true">
        🎁<span>✦</span>
      </div>
      <h2>Марапатың дайын!</h2>
      <div className="ng-reward-values">
        <strong>🪙 +{reward.coins}</strong>
        <strong>✦ +{reward.xp} XP</strong>
        <strong>💎 +{reward.crystals}</strong>
      </div>
      <progress aria-label="Марапат ашылды" max={100} value={100} />
    </div>
  );
}
