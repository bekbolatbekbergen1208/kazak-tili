"use client";
import Link from "next/link";
import { regions } from "@/lib/travel/catalog";
import {
  travelOf,
  travelXP,
  travelTitle,
  travelAchievements,
} from "@/lib/travel/state";
import { useLearning } from "@/components/learning/provider";
import { RegionStamp } from "./art";
export function ProgressOverview() {
  const { state } = useLearning();
  const t = travelOf(state),
    p = Object.values(t.regions);
  return (
    <div className="travel-stats">
      <div>
        <strong>{travelXP(state)}</strong>
        <span>Саяхат XP</span>
      </div>
      <div>
        <strong>{p.filter((r) => r.visited).length}/20</strong>
        <span>Барған өңір</span>
      </div>
      <div>
        <strong>{p.filter((r) => r.stampUnlocked).length}/20</strong>
        <span>Жиналған мөр</span>
      </div>
      <div>
        <strong>{new Set(p.flatMap((r) => r.vocabularyLearned)).size}</strong>
        <span>Бірегей сөз</span>
      </div>
    </div>
  );
}
export function TravelPassport() {
  const { state } = useLearning();
  const t = travelOf(state);
  return (
    <section className="travel-panel travel-passport" id="passport">
      <div className="travel-heading">
        <div>
          <small>ЕСТЕЛІКТЕР ЖИНАҒЫ</small>
          <h2>QazaqDos саяхат паспорты</h2>
          <p>
            {travelTitle(travelXP(state))} · Дұрыс жауап:{" "}
            {Object.values(t.regions).reduce(
              (sum, p) => sum + p.correctIds.length,
              0,
            )}
          </p>
        </div>
        <span className="travel-passport-seal">QД</span>
      </div>
      <p>
        Мөр үшін: негізгі бөлімдер, өңірдің барлық сөзі, quiz ≥ 4/5, барлық
        сурет жұбы және дұрыс сөйлем. Контенті тексерілмеген өңірге мөр
        берілмейді.
      </p>
      <div className="travel-stamps">
        {regions.map((r, i) => (
          <Link key={r.id} href={`/kazakhstan/${r.slug}`}>
            <RegionStamp
              name={r.nameKk}
              icon={r.stamp}
              index={i}
              unlocked={!!t.regions[r.id]?.stampUnlocked}
            />
          </Link>
        ))}
      </div>
      <h3>Саяхат жетістіктері</h3>
      <div className="travel-achievements">
        {Object.entries(travelAchievements).map(([id, title]) => (
          <span
            key={id}
            className={t.achievements.includes(id) ? "earned" : ""}
          >
            {t.achievements.includes(id) ? "✓" : "○"} {title}
          </span>
        ))}
      </div>
    </section>
  );
}
