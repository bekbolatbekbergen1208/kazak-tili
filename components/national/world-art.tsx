"use client";
import { useId, useEffect, useState, useRef } from "react";
import { launch, step } from "@/lib/national/physics";
import { replayWorld } from "@/lib/national/world-engine";
import {
  defenderAt,
  dropAt,
  handAt,
  phaseAt,
  randomAt,
  type WorldSession,
} from "@/lib/national/world-engine";
import { flyingWords, teamQuestions } from "@/lib/national/world-catalog";
export function BoneArt({
  x,
  y,
  gold = false,
  size = 1,
}: {
  x: number;
  y: number;
  gold?: boolean;
  size?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <ellipse cy="14" rx="15" ry="5" fill="#654252" opacity=".15" />
      <path
        d="M-12-12Q-3-20 3-10Q16-18 18-7L10 3Q20 14 9 18L0 10Q-15 20-17 8L-9 0Z"
        fill={gold ? "#ffc94e" : "#fff2d6"}
        stroke="#b07853"
        strokeWidth="2"
      />
      <path d="M-5-5Q3 0 5 7" fill="none" stroke="#bf9870" />
    </g>
  );
}
export function Horse({
  x,
  y,
  color = "#9c674b",
}: {
  x: number;
  y: number;
  color?: string;
}) {
  return (
    <g className="vw-horse" transform={`translate(${x} ${y})`}>
      <ellipse cy="46" rx="65" ry="9" fill="#362c57" opacity=".13" />
      {[-35, -17, 25, 40].map((a, i) => (
        <path
          key={a}
          className={`vw-leg leg-${i}`}
          d={`M${a} 6q-8 20 2 35h12`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      ))}
      <path
        className="vw-tail"
        d="M-53-7Q-90-20-82 32Q-70 12-52 7"
        fill="#473348"
      />
      <ellipse cx="-5" rx="58" ry="29" fill={color} />
      <path d="M25 0L37-55Q48-73 65-58L83-36Q85-22 62-26L48-5" fill={color} />
      <path d="M40-52Q37-80 54-70L59-60M36-51Q24-42 27-17" fill="#44314c" />
      <circle cx="64" cy="-46" r="3" fill="#242338" />
      <path
        d="M-30-21Q-10-5 17-20L16 9H-25Z"
        fill="#6752ba"
        stroke="#ffdc8a"
        strokeWidth="3"
      />
      <path
        d="M-18-12l8 8 8-8 8 8"
        fill="none"
        stroke="#ffe4a5"
        strokeWidth="3"
      />
    </g>
  );
}
function FlyingObject({ index }: { index: number }) {
  return (
    <g transform="translate(450 235)">
      {[0, 6].includes(index) && (
        <g fill="#6d58a3" stroke="#3f355c" strokeWidth="2">
          <ellipse rx="20" ry="13" />
          <path
            className="vw-wing"
            d="M0-5q-28-48-70-31l40 22-18 7 42 15M0-5q28-48 70-31L30-14l18 7-42 15"
          />
          <circle cx="22" cy="-8" r="11" />
          <path d="M31-10l18 7-18 4" fill="#e9b75d" />
          <circle cx="25" cy="-11" r="2" fill="white" />
        </g>
      )}
      {index === 1 && (
        <g transform="scale(.8)">
          <path
            d="M-55 12q-6-48 20-37q20-30 36 4q30-10 32 24L46-37q10-20 22-9l7 27-25 11-14 42h-87Z"
            fill="#d7ad79"
            stroke="#896a49"
            strokeWidth="3"
          />
          <path d="M-40 22v40m65-40v40" stroke="#896a49" strokeWidth="9" />
        </g>
      )}
      {index === 2 && (
        <g>
          <path
            className="vw-wing"
            d="M-3 4C-100-90-84 56-3 28M3 4C100-90 84 56 3 28"
            fill="#ad78cf"
            stroke="#725099"
            strokeWidth="4"
          />
          <path
            d="M0-10v45m0-45-12-12m12 12 12-12"
            stroke="#63496d"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      )}
      {index === 3 && (
        <g fill="#60a8b6" stroke="#3c798f" strokeWidth="3">
          <ellipse rx="42" ry="23" />
          <path d="M-35 0l-35-28v56Z" />
          <circle cx="25" cy="-7" r="4" fill="white" />
        </g>
      )}
      {index === 4 && (
        <path
          d="M-70 10l56-17 6-40q8-12 15 0L13-7l57 17v14L10 14l-4 28 15 12v7L0 55l-21 6v-7l15-12-4-28-60 10Z"
          fill="#f9f5e7"
          stroke="#8275a6"
          strokeWidth="3"
        />
      )}
      {index === 5 && (
        <g stroke="#7c5fa5" strokeWidth="4">
          <path
            d="M0-25q-30-25-65-10v80q30-12 65 10q35-22 65-10v-80Q30-50 0-25Z"
            fill="#fff8e7"
          />
          <path
            d="M0-25v80M-50-10l35 8m-35 12 35 8m30-20 35-8M15 18l35-8"
            fill="none"
          />
        </g>
      )}
      {index === 7 && (
        <g transform="scale(.8)">
          <Horse x={0} y={0} />
        </g>
      )}
      {index === 8 && (
        <g>
          <ellipse
            className="vw-wing"
            cx="-10"
            cy="-20"
            rx="24"
            ry="16"
            fill="#ebfaff"
            stroke="#89c4d7"
            strokeWidth="2"
          />
          <ellipse
            rx="34"
            ry="20"
            fill="#f4c451"
            stroke="#99733b"
            strokeWidth="3"
          />
          <path d="M-13-17v34M6-18v36" stroke="#795443" strokeWidth="9" />
          <circle cx="24" cy="-5" r="4" fill="#443344" />
        </g>
      )}
      {index === 9 && (
        <path
          d="M-48 20l10-40L-4-36l41 18 15 44-39 13-50-4Z"
          fill="#a7a0b7"
          stroke="#71687e"
          strokeWidth="4"
        />
      )}
    </g>
  );
}
export function WorldBackdrop({ night = false }: { night?: boolean }) {
  const id = useId().replaceAll(":", "");
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor={night ? "#24254e" : "#bedff4"} />
          <stop offset="1" stopColor={night ? "#736998" : "#fdf0d3"} />
        </linearGradient>
      </defs>
      <rect width="900" height="540" fill={`url(#${id})`} />
      <circle cx="750" cy="85" r="37" fill={night ? "#f9edd5" : "#ffe2a0"} />
      <g className="vw-clouds" fill="#fff" opacity=".65">
        <path d="M80 90q-25-20 0-32q5-34 35-18q32-8 33 23q30 8 12 27Z" />
        <path d="M460 74q-30-20 0-30q15-40 40-10q42-10 42 30Z" />
      </g>
      <path
        d="M0 290L120 100l108 120L340 86l177 200L670 124l230 177v160H0Z"
        fill={night ? "#45486a" : "#99b2c9"}
      />
      <path
        d="M91 144l29-44 44 70-42-18-15 13ZM307 130l33-44 50 56-35-12-15 14Z"
        fill="#e7f0ed"
      />
      <path
        d="M0 304Q180 205 410 307T900 283V540H0Z"
        fill={night ? "#384e5c" : "#93bdb0"}
      />
      <path
        d="M0 400Q240 280 480 370T900 331V540H0Z"
        fill={night ? "#415f60" : "#c4dca5"}
      />
      <path
        d="M0 493Q260 340 455 425T900 385"
        stroke="#e5caa1"
        strokeWidth="50"
        fill="none"
      />
      <g className="vw-grasses" stroke="#688f70" fill="none" strokeWidth="3">
        {Array.from({ length: 18 }, (_, i) => (
          <path key={i} d={`M${i * 53} 526q-12-20-3-28m3 28q8-27 17-24`} />
        ))}
      </g>
      <g className="vw-birds" fill="none" stroke="#596382" strokeWidth="3">
        <path d="M450 120q12-15 23 0q12-15 23 0M500 100q8-12 15 0q8-12 15 0" />
      </g>
    </g>
  );
}
export function Yurt({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="46" rx="73" ry="12" fill="#3d3c57" opacity=".12" />
      <g
        className="vw-smoke"
        fill="none"
        stroke="#fff"
        strokeWidth="7"
        opacity=".5"
      >
        <path d="M0-60q-20-22 0-40t0-40" />
      </g>
      <path
        d="M-65-3Q-55-42 0-56Q55-42 65-3V40Q0 57-65 40Z"
        fill="#fffae7"
        stroke="#b4a49d"
        strokeWidth="2"
      />
      <path
        d="M-65 0Q0 14 65 0M-65 28Q0 42 65 28"
        fill="none"
        stroke="#8965b5"
        strokeWidth="8"
      />
      <path
        d="M-14 43V5q14-12 28 0v38"
        fill="#926046"
        stroke="#e5b95e"
        strokeWidth="4"
      />
      <path d="M-46 14l8-6 8 6-8 6ZM31 15l8-6 8 6-8 6Z" fill="#e2b05f" />
    </g>
  );
}
export function GameDrawing({
  s,
  time,
  aim,
  paused = false,
}: {
  s: WorldSession;
  time: number;
  aim: number;
  paused?: boolean;
}) {
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [movingBones, setMovingBones] = useState(s.bones);
  useEffect(() => {
    const event = s.events.at(-1);
    if (s.kind !== "asyk" || event?.key !== "shoot") {
      setMovingBones(s.bones);
      return;
    }
    const previous = replayWorld(s, s.events.slice(0, -1));
    const rad = ((event.value ?? 0) * Math.PI) / 180;
    const force = 35 + phaseAt(previous, event.t) * 85;
    const bones = launch(
      previous.bones,
      Math.sin(rad) * force,
      -Math.cos(rad) * force,
    );
    let raf = 0,
      count = 0;
    const draw = () => {
      if (document.hidden || pausedRef.current) {
        raf = requestAnimationFrame(draw);
        return;
      }
      let active = false;
      for (let i = 0; i < 3; i++) {
        active = step(bones);
        count++;
      }
      setMovingBones(bones.map((b) => ({ ...b })));
      if (active && count < 720) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [s.kind, s.events.length]);
  const p = phaseAt(s, time),
    family = s.kind,
    dt = time - s.lastAt;
  const isHorse = ["tenge", "baige", "qyzquu", "audaryspaq"].includes(family);
  return (
    <svg
      viewBox="0 0 900 540"
      className="vw-scene"
      role="img"
      aria-label={`${family}: ойын алаңы`}
    >
      <WorldBackdrop night={["aqsuiek", "soqyrteke"].includes(family)} />
      {family === "asyk" && (
        <g transform="translate(180 30)">
          <ellipse
            cx="300"
            cy="220"
            rx="155"
            ry="155"
            fill="#ead2a2"
            stroke="#fff3d2"
            strokeWidth="9"
          />
          {movingBones
            .filter((b) => !b.out)
            .map((b) => (
              <BoneArt key={b.id} x={b.x} y={b.y} gold={b.special} />
            ))}
          <path
            d={`M300 440l${Math.sin((aim * Math.PI) / 180) * 130} ${-Math.cos((aim * Math.PI) / 180) * 130}`}
            stroke="#6550b7"
            strokeWidth="4"
            strokeDasharray="8 7"
          />
          <BoneArt x={300} y={440} gold size={1.4} />
        </g>
      )}
      {isHorse && (
        <>
          <Horse
            x={family === "tenge" ? 340 : 180 + Math.min(300, s.distance * 1.8)}
            y={380}
          />
          {family !== "tenge" && (
            <Horse
              x={230 + Math.min(350, s.rival * 1.8)}
              y={280}
              color="#c7a284"
            />
          )}
          {family === "tenge" && (
            <g transform={`translate(${680 - p * 620} 395)`}>
              <ellipse
                rx="14"
                ry="23"
                fill="#ffce54"
                stroke="#b68035"
                strokeWidth="3"
              />
              <text y="6" textAnchor="middle" fill="#806232">
                ₸
              </text>
            </g>
          )}
          <path d="M830 190v250m-20-220h40" stroke="#775191" strokeWidth="6" />
          <path className="vw-flag" d="M830 191l48 10-48 20Z" fill="#f6ae67" />
        </>
      )}
      {family === "arqan" && (
        <>
          <path
            d={`M130 350Q450 ${365 + Math.sin(time / 200) * 5} 770 350`}
            fill="none"
            stroke="#ad8150"
            strokeWidth="12"
          />
          <path
            d={`M${450 - s.distance} 340v45l23-10-23-10`}
            fill="#be5f85"
            stroke="#fff2dd"
            strokeWidth="3"
          />
          <path
            d="M450 320v100"
            stroke="#fff"
            strokeDasharray="5 8"
            strokeWidth="4"
          />
        </>
      )}
      {family === "altybaqan" && (
        <>
          <path
            d="M250 460l75-300 80 300M570 460l75-300 80 300M325 160h320"
            fill="none"
            stroke="#956855"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <g
            style={{
              transformOrigin: "490px 160px",
              transform: `rotate(${Math.sin(time / 600) * 15}deg)`,
            }}
          >
            <path
              d="M420 165v230m140-230v230"
              stroke="#b58a5b"
              strokeWidth="5"
            />
            <path d="M410 395h160" stroke="#6850af" strokeWidth="15" />
          </g>
        </>
      )}
      {family === "jamby" && (
        <>
          <path
            d="M150 385q-80-100 0-175l-40 86Z"
            fill="none"
            stroke="#9b684b"
            strokeWidth="6"
          />
          <path
            d={`M130 300L${600 + Math.sin((aim * Math.PI) / 180) * 180} 210`}
            stroke="#755cc0"
            strokeDasharray="7 8"
            strokeWidth="3"
          />
          <g
            transform={`translate(${600 + Math.sin(p * Math.PI * 2) * 135} 210)`}
          >
            <path d="M0-170v130" stroke="#9e7955" strokeWidth="4" />
            {[54, 38, 21, 7].map((r, i) => (
              <circle
                key={r}
                r={r}
                fill={["#fff1d5", "#b66985", "#f6c467", "#6950a7"][i]}
              />
            ))}
          </g>
        </>
      )}
      {["aqsuiek", "soqyrteke", "kokpar"].includes(family) && (
        <g transform="translate(145 155)">
          {Array.from({ length: 40 }, (_, i) => (
            <rect
              key={i}
              x={(i % 8) * 75}
              y={Math.floor(i / 8) * 65}
              width="72"
              height="62"
              rx="16"
              fill="#f5f8dc"
              opacity=".18"
              stroke="#fff"
            />
          ))}
          <circle
            cx={s.x * 75 + 36}
            cy={s.y * 65 + 30}
            r="23"
            fill="#8b67ca"
            stroke="#fff"
            strokeWidth="4"
          />
          <path
            d={`M${s.x * 75 + 28} ${s.y * 65 + 32}l8-12 8 12`}
            stroke="#fff"
            strokeWidth="3"
            fill="none"
          />
          {family === "kokpar" && (
            <>
              {!s.carrying && (
                <circle
                  cx="186"
                  cy="160"
                  r="16"
                  fill="#ffc854"
                  stroke="#9a7240"
                  strokeWidth="3"
                />
              )}
              {[0, 1].map((i) => {
                const d = defenderAt(s.turn, i);
                return (
                  <circle
                    key={i}
                    cx={d.x * 75 + 36}
                    cy={d.y * 65 + 30}
                    r="22"
                    fill="#bf7782"
                    stroke="#fff"
                    strokeWidth="4"
                  />
                );
              })}
              <path d="M595 5v300" stroke="#ffe27d" strokeWidth="10" />
            </>
          )}
        </g>
      )}
      {family === "saqina" && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${210 + i * 120} 330)`}>
              <path
                className="vw-hand"
                d="M-23 38v-65q0-12 10-6v-15q0-12 10-3q7-15 14-2q12-8 13 8v34q21-15 20 3l-20 36Z"
                fill="#f2cbab"
                stroke="#af7c68"
                strokeWidth="3"
              />
              {dt < 2000 && i === handAt(s) && (
                <circle
                  cy="4"
                  r="12"
                  fill="none"
                  stroke="#ffbe31"
                  strokeWidth="6"
                />
              )}
              <text y="76" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </g>
      )}
      {family === "hantalapai" && (
        <>
          {Array.from(
            { length: 9 },
            (_, i) =>
              i >= s.turn && (
                <g key={i}>
                  <BoneArt
                    x={210 + (i % 3) * 220}
                    y={220 + Math.floor(i / 3) * 100}
                    gold={i === 0}
                    size={1.5}
                  />
                  <text
                    x={210 + (i % 3) * 220}
                    y={263 + Math.floor(i / 3) * 100}
                    textAnchor="middle"
                  >
                    {i === 0 ? "Хан" : i}
                  </text>
                </g>
              ),
          )}
        </>
      )}
      {family === "bestas" && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse
              key={i}
              cx={360 + i * 45}
              cy={
                i === 0 && s.phase
                  ? 375 - Math.sin(Math.min(1, dt / 1700) * Math.PI) * 220
                  : 405
              }
              rx="15"
              ry="12"
              fill="#afa6bf"
              stroke="#655a77"
              strokeWidth="3"
            />
          ))}
          <path
            d="M360 447q90-32 210 0"
            fill="none"
            stroke="#d4a589"
            strokeWidth="20"
            strokeLinecap="round"
          />
        </>
      )}
      {family === "oramal" && (
        <>
          <ellipse
            cx="465"
            cy="340"
            rx="230"
            ry="100"
            fill="none"
            stroke="#fff5dc"
            strokeWidth="5"
            strokeDasharray="20 14"
          />
          {dt >= dropAt(s) && (
            <path
              className="vw-flag"
              d="M420 290q30-30 70 0l20 55q-40-20-80 8Z"
              fill="#b37bd3"
              stroke="#fff4dc"
              strokeWidth="4"
            />
          )}
        </>
      )}
      {family === "ushty" && (
        <g>
          <FlyingObject index={(Math.min(s.turn, 9) + (s.seed % 10)) % 10} />
          <path
            d="M300 325q140-40 300 0v60q-150 35-300 0Z"
            fill="#fff8e8"
            stroke="#e1c786"
            strokeWidth="4"
          />
          <text
            x="450"
            y="360"
            textAnchor="middle"
            fontSize="38"
            fill="#514379"
          >
            {flyingWords[(Math.min(s.turn, 9) + (s.seed % 10)) % 10][0]}
          </text>
        </g>
      )}
      {family === "aigolek" && (
        <>
          <path d="M230 400h440" stroke="#fff4d4" strokeWidth="7" />
          <text
            x="450"
            y="220"
            textAnchor="middle"
            fontSize="27"
            fill="#3f3856"
          >
            {teamQuestions[Math.min(s.turn, 7)][0]}
          </text>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={220 + s.score * 3 + i * 38}
              cy="370"
              r="20"
              fill="#8866bd"
              stroke="#fff"
              strokeWidth="3"
            />
          ))}
        </>
      )}
      {family === "audaryspaq" && (
        <text x="450" y="150" textAnchor="middle" fontSize="28" fill="#483957">
          Қарсылас: {randomAt(s.seed, s.turn + 20) > 0.5 ? "Оңға" : "Солға"}
        </text>
      )}
      <g
        className={`vw-spark ${s.good ? "" : "vw-soft"}`}
        key={s.events.length}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={420 + Math.cos(i) * 75}
            cy={300 + Math.sin(i) * 75}
            r="5"
            fill="#ffd66a"
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </g>
    </svg>
  );
}
