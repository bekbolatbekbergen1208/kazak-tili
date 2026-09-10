"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import {
  historyCities,
  historyCity,
  readyHistoryCities,
} from "@/lib/history/catalog";
import {
  cityOpen,
  cityPercent,
  cityProgress,
  historyProgress,
  historyRank,
} from "@/lib/history/state";
import { Atmosphere, HistoryArt } from "./art";
import { Dossha, HistoryHeader, Traveler } from "./shared";
import { MovementPad, useMovement } from "./movement";
import type { Point } from "@/lib/travel/types";
const compactPoints: Record<string, Point> = {
  otyrar: { x: 51, y: 88 },
  turkistan: { x: 55, y: 65 },
  taraz: { x: 77, y: 86 },
  saraishyq: { x: 17, y: 49 },
  sauran: { x: 31, y: 77 },
  syganaq: { x: 32, y: 61 },
  berel: { x: 87, y: 43 },
  tamgaly: { x: 82, y: 66 },
  bozoq: { x: 61, y: 34 },
  botai: { x: 57, y: 16 },
};

export function HistoryMap() {
  const { state } = useLearning(),
    [selected, setSelected] = useState(
      historyProgress(state).lastCity ?? "otyrar",
    );
  const [boundaries, setBoundaries] = useState<{ id: string; d: string }[]>([]),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0),
    [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const locations = historyCities.map((c) => ({
    ...c,
    point: compact ? (compactPoints[c.id] ?? c.point) : c.point,
  }));
  const movement = useMovement({ x: 39, y: 82 });
  useEffect(() => {
    const ctrl = new AbortController();
    setFailed(false);
    fetch("/travel/boundaries.json", { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((items: { id: string; d: string }[]) => {
        if (
          !Array.isArray(items) ||
          items.length !== 20 ||
          !items.every((x) => typeof x.d === "string")
        )
          throw Error();
        setBoundaries(items);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => ctrl.abort();
  }, [attempt]);
  useEffect(() => {
    const nearest = [...locations].sort(
      (a, b) =>
        Math.hypot(a.point.x - movement.point.x, a.point.y - movement.point.y) -
        Math.hypot(b.point.x - movement.point.x, b.point.y - movement.point.y),
    )[0];
    if (
      Math.hypot(
        nearest.point.x - movement.point.x,
        nearest.point.y - movement.point.y,
      ) < 5
    )
      setSelected(nearest.id);
  }, [movement.point, compact]);
  const city = historyCity(selected)!,
    open = cityOpen(state, city.id),
    rank = historyRank(state);
  const choose = (id: string) => {
    setSelected(id);
    const c = locations.find((c) => c.id === id)!;
    movement.moveTo({ x: c.point.x - 6, y: Math.min(94, c.point.y + 8) });
  };
  return (
    <section
      className={`hs-world ${historyProgress(state).night ? "hs-night" : ""}`}
      lang="kk"
    >
      <HistoryHeader
        title="Тарих әлеміне саяхат"
        subtitle="Көне қалаларды арала. Мұраның сырын аш. Өз тарихыңды жина."
      />
      <div className="hs-map-layout">
        <div>
          <div
            className="hs-map"
            {...movement.sceneProps}
            role="region"
            aria-label="Қазақстанның тарихи бағыттар картасы"
          >
            <Atmosphere />
            {boundaries.length > 0 ? (
              <svg
                className="hs-country"
                viewBox="0 0 1000 549"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {boundaries.map((b) => (
                  <path
                    key={b.id}
                    d={b.d}
                    fill="#d6e9cb"
                    stroke="#b3cbb5"
                    strokeWidth="1.6"
                  />
                ))}
                <path
                  d="M520 450 Q490 405 510 405 Q560 445 610 455"
                  fill="none"
                  stroke="#a482be"
                  strokeWidth="4"
                  strokeDasharray="7 8"
                />
              </svg>
            ) : (
              <div className="hs-map-loading" role="status">
                {failed ? (
                  <>
                    Карта жүктелмеді. Қаланы төмендегі тізімнен таңда.
                    <button
                      className="hs-button hs-soft"
                      onClick={() => setAttempt((x) => x + 1)}
                    >
                      Қайта жүктеу
                    </button>
                  </>
                ) : (
                  "Карта дайындалып жатыр…"
                )}
              </div>
            )}
            <span className="hs-map-caption">ҰЛЫ ДАЛА · ТАРИХИ БАҒЫТТАР</span>
            {locations.map((c) => (
              <button
                key={c.id}
                className={`hs-pin ${selected === c.id ? "is-selected" : ""} ${cityOpen(state, c.id) ? "is-open" : "is-locked"}`}
                style={{ left: `${c.point.x}%`, top: `${c.point.y}%` }}
                aria-label={`${c.name} · ${cityProgress(state, c.id).completedAt ? "аяқталды" : cityOpen(state, c.id) ? "ашық" : "жабық"}`}
                aria-pressed={selected === c.id}
                onClick={() => choose(c.id)}
              >
                <span>
                  {cityProgress(state, c.id).completedAt ? "✓" : c.icon}
                </span>
                <strong>{c.name}</strong>
              </button>
            ))}
            <Traveler point={movement.point} />
          </div>
          <MovementPad movement={movement} />
          <p className="hs-note">
            Орындар шартты көрсетілген. Бұл — оқу картасы, нақты жол сызбасы
            емес.
          </p>
        </div>
        <article className="hs-city-card" key={city.id}>
          <div className="hs-card-art">
            <HistoryArt
              kind={
                city.id === "turkistan"
                  ? "dome"
                  : city.id === "taraz"
                    ? "tile"
                    : "gate"
              }
            />
            <span>{open ? "САПАРҒА ДАЙЫН" : "КЕЛЕСІ БАҒЫТ"}</span>
          </div>
          <p className="hs-eyebrow">{city.era}</p>
          <h2>{city.name}</h2>
          <p>{city.subtitle}</p>
          <progress
            max={100}
            value={cityPercent(state, city.id)}
            aria-label={`${city.name} прогресі`}
          />
          <small>{cityPercent(state, city.id)}% зерттелді</small>
          {open ? (
            <>
              <p>
                {city.objects.length} нысан · {city.tasks.length} тапсырма ·
                қорытынды іздеу
              </p>
              <Link className="hs-button" href={`/learn/history/${city.id}`}>
                {cityProgress(state, city.id).visited
                  ? "Саяхатты жалғастыру"
                  : "Саяхатты бастау"}{" "}
                →
              </Link>
              <small>Қала соңында: +60 XP · +20 🪙 · +3 💎</small>
            </>
          ) : (
            <p className="hs-lock">
              🔒{" "}
              {city.ready
                ? `Алдымен ${historyCity(city.previous!)?.name} қаласын аяқта.`
                : "Бұл деңгей әзірленуде."}
              {!city.ready &&
                city.previous &&
                ` Бағыт реті: ${historyCity(city.previous)?.name} → ${city.name}.`}
            </p>
          )}
        </article>
      </div>
      <Dossha>
        {open
          ? `${city.name}: ${city.intro[0]} ${cityProgress(state, city.id).completedAt ? "Бұл қаланы зерттеп бітірдің! Дәптеріңді қарап шық." : "Дайын болсаң, саяхатты бастайық!"}`
          : city.ready
            ? "Әр қаланың сыры келесі сапарға жол ашады. Алдыңғы қаланы бірге аяқтайық!"
            : `${city.name} бағыты кейін толық ашылады. Қазір Отырар, Түркістан және Таразды зерттей аласың.`}
      </Dossha>
      <div className="hs-section-title">
        <h2>Сенің тарихи жолың</h2>
        <span>
          {rank.count} / {readyHistoryCities.length} дайын қала аяқталды
        </span>
      </div>
      <progress
        className="hs-total-progress"
        max={readyHistoryCities.length}
        value={rank.count}
        aria-label="Дайын қалалар прогресі"
      />
      <div className="hs-city-list">
        {historyCities.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              choose(c.id);
              document
                .querySelector(".hs-city-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            aria-pressed={selected === c.id}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{c.name}</strong>
              <small>
                {c.ready
                  ? cityProgress(state, c.id).completedAt
                    ? "Аяқталды ✓"
                    : cityOpen(state, c.id)
                      ? "Зерттеуге ашық"
                      : `${historyCity(c.previous!)?.name} қаласынан кейін`
                  : "Әзірленуде"}
              </small>
            </div>
            <b>{c.icon}</b>
          </button>
        ))}
      </div>
    </section>
  );
}
