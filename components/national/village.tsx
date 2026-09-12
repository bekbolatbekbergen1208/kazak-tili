"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { worldGames } from "@/lib/national/world-catalog";
import { NationalFrame } from "./shared";
import { WorldBackdrop, Yurt, BoneArt } from "./world-art";
import "./world.css";
function Companion({ action }: { action: string }) {
  const { state } = useLearning();
  return (
    <div className={`vw-companion vw-${action}`}>
      <CharacterArt
        characterId={selectedCharacter(state).id}
        equipped={equipmentFor(state)}
        mood="greeting"
      />
    </div>
  );
}
export function WorldVillage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(true);
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    let onscreen = true;
    const update = () => setAwake(onscreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      update();
    });
    if (mapRef.current) observer.observe(mapRef.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const { state } = useLearning(),
    records = state.progress.village?.records ?? {};
  return (
    <NationalFrame title="Ұлттық ойындар әлемі">
      <div className="vw-intro">
        <span>QAZAQDOS · ДАЛА ШАҚЫРАДЫ</span>
        <h2>
          Ойынға толы ауыл.
          <br />
          Жеңіске бірге жетейік!
        </h2>
        <p>18 ойын · қазақша сөздер · сенің кейіпкерің</p>
      </div>
      <div
        ref={mapRef}
        className={`vw-map ${awake ? "" : "vw-paused"} ${zoom ? "vw-zoom" : ""}`}
      >
        <svg
          viewBox="0 0 900 540"
          role="img"
          aria-label="Таулар, киіз үйлер және ойын алаңдары бар қазақ ауылы"
        >
          <WorldBackdrop />
          <Yurt x={170} y={230} />
          <Yurt x={680} y={270} scale={0.8} />
          <Yurt x={470} y={160} scale={0.65} />
          <path
            d="M120 470Q220 280 460 320T820 430"
            fill="none"
            stroke="#ead2a9"
            strokeWidth="28"
          />
          <path d="M85 310v100m720-240v100" stroke="#9c7559" strokeWidth="7" />
          <path
            className="vw-flag"
            d="M85 310l50 12-50 18m720-170 45 14-45 16"
            fill="#9470c5"
          />
          <BoneArt x={365} y={420} gold size={2} />
        </svg>
        <Companion action="wave" />
        <div className="vw-places">
          {worldGames.map((g, i) => (
            <Link
              key={g.id}
              href={`/learn/national/${g.id}`}
              style={{
                left: `${8 + (i % 6) * 15}%`,
                top: `${48 + Math.floor(i / 6) * 17}%`,
              }}
              aria-label={`${g.name} алаңын ашу`}
              onPointerDown={() => setZoom(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setZoom(true);
              }}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{g.name}</b>
            </Link>
          ))}
        </div>
      </div>
      {state.progress.village?.session &&
        !state.progress.village.session.finished && (
          <Link
            className="btn primary"
            href={`/learn/national/${state.progress.village.session.kind}`}
          >
            Сақталған ойынды жалғастыр
          </Link>
        )}
      {state.progress.national?.session &&
        !state.progress.national.session.finished && (
          <Link
            className="btn ghost"
            href={`/learn/national/classic-${state.progress.national.session.kind}`}
          >
            Бұрын басталған ойынды жалғастыр
          </Link>
        )}
      <div className="vw-section-title">
        <h2>Өз ойыныңды таңда</h2>
        <p>
          Алғашқы жеңіс: 30 XP · 20 тиын · 1 кристалл. Қайталау — тегін жаттығу.
        </p>
      </div>
      <div className="vw-game-list">
        {worldGames.map((g, i) => (
          <Link
            className="vw-game-link"
            key={g.id}
            href={`/learn/national/${g.id}`}
          >
            <span className="vw-number">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{g.name}</h3>
              <p>{g.words.slice(0, 3).join(" · ")}</p>
              <small>
                {records[g.id]?.badge ? "Белгіше ашылды · " : ""}Үздік:{" "}
                {records[g.id]?.best ?? 0} · Аяқталған:{" "}
                {records[g.id]?.completed ?? 0}
              </small>
            </div>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      <p className="vw-note">
        Қарсыластар — компьютер. 17 ойын — цифрлық бейімдеу; Тоғызқұмалақта
        тақта ережелері қолданылады. Дауыс жазбалары қолданылмайды.
      </p>
    </NationalFrame>
  );
}
