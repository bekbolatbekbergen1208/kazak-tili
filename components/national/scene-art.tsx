"use client";

import { memo, useId, type CSSProperties } from "react";
import { CharacterArt } from "@/components/characters/character-art";
import type { CharacterArtProps } from "@/components/characters/character-art";
import "./scene-art.css";
import { characterById, shopItemById } from "@/lib/characters/config";

export type SceneRegion = "steppe" | "altai" | "coast" | "city";

export const YurtArt = memo(function YurtArt({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-felt`} x2="1" y2=".5">
          <stop stopColor="#fff9e1" />
          <stop offset=".48" stopColor="#eddfc3" />
          <stop offset="1" stopColor="#aaa99a" />
        </linearGradient>
        <linearGradient id={`${id}-roof`} x2=".8" y2="1">
          <stop stopColor="#fffdf0" />
          <stop offset="1" stopColor="#cbc4ad" />
        </linearGradient>
      </defs>
      <ellipse cx="12" cy="48" rx="85" ry="14" fill="#183f39" opacity=".18" />
      <path
        d="M-66-3Q-54-40 0-56Q54-40 66-3L58 13H-57Z"
        fill={`url(#${id}-roof)`}
        stroke="#a4a993"
        strokeWidth="1.5"
      />
      <path d="M-66-3Q0 11 66-3V39Q0 60-66 39Z" fill={`url(#${id}-felt)`} />
      <path
        d="M-51-16Q0-3 51-16M-38-28Q0-17 38-28M-7-52l-18 53M8-52l24 53"
        fill="none"
        stroke="#b7b19b"
        strokeWidth="1.3"
      />
      <path
        d="M-66 1Q0 16 66 1M-66 30Q0 49 66 30"
        fill="none"
        stroke="#ad4c49"
        strokeWidth="9"
      />
      <path
        d="M-66 1Q0 16 66 1M-66 30Q0 49 66 30"
        fill="none"
        stroke="#f5ce85"
        strokeWidth="1.5"
        strokeDasharray="3 8"
      />
      {[-49, -31, 32, 50].map((x) => (
        <path
          key={x}
          d={`M${x - 5} 20q-8-9-10-1t10 1q8-9 10-1t-10 1`}
          fill="none"
          stroke="#ab4c46"
          strokeWidth="2"
        />
      ))}
      <path
        d="M-15 45V9Q0-3 15 9v36"
        fill="#3e5147"
        stroke="#d39a53"
        strokeWidth="4"
      />
      <path d="M-12 11L5 9v36l-17-2Z" fill="#9c6746" />
      <path d="M-7 16v23m6-24v26" stroke="#e3b46a" strokeWidth="1.4" />
      <path
        d="M-11-54q11-6 22 0"
        fill="none"
        stroke="#645d45"
        strokeWidth="5"
      />
      <path
        className="qa-smoke"
        d="M0-60c-14-16 17-19 3-39s9-23 3-35"
        fill="none"
        stroke="#fff6dc"
        strokeWidth="5"
        opacity=".4"
      />
    </g>
  );
});

const Pine = ({ x, y, size = 1 }: { x: number; y: number; size?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M0-10v43" stroke="#556350" strokeWidth="6" />
    <path
      d="M0-92L-24-48h12l-28 44h17l-27 38H46L23-4h15L12-48h12Z"
      fill="#346f61"
    />
    <path d="M0-92L-24-48h12l-28 44h17l-27 38H0Z" fill="#51977a" />
    <path
      d="M-19-44l17 8m-30 35L-3 8m-37 18 37 7"
      stroke="#77ab7c"
      strokeWidth="3"
      fill="none"
    />
  </g>
);

export const SteppeBackdrop = memo(function SteppeBackdrop({
  night = false,
  region = "steppe",
}: {
  night?: boolean;
  region?: SceneRegion;
}) {
  const id = useId().replaceAll(":", "");
  const coast = region === "coast",
    city = region === "city";
  return (
    <g
      aria-hidden="true"
      className={`qa-environment ${night ? "qa-night" : ""}`}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor={night ? "#142e49" : "#71bdd0"} />
          <stop offset=".65" stopColor={night ? "#426475" : "#c8e8dc"} />
          <stop offset="1" stopColor={night ? "#739085" : "#fff1c7"} />
        </linearGradient>
        <linearGradient id={`${id}-grass`} x2=".2" y2="1">
          <stop stopColor={night ? "#315d61" : "#92ba77"} />
          <stop offset="1" stopColor={night ? "#163e45" : "#467e60"} />
        </linearGradient>
        <linearGradient id={`${id}-trail`} x2=".3" y2="1">
          <stop stopColor={night ? "#718985" : "#e9d4a2"} />
          <stop offset="1" stopColor={night ? "#415d62" : "#c0b786"} />
        </linearGradient>
        <pattern
          id={`${id}-grain`}
          width="67"
          height="49"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M5 9h3m21 17h5m16 17h2M57 8h3"
            stroke={night ? "#d0e9d6" : "#fff3bd"}
            opacity=".24"
          />
          <path d="M14 38h4m27-25h2" stroke="#315f51" opacity=".22" />
        </pattern>
      </defs>
      <rect width="900" height="540" fill={`url(#${id}-sky)`} />
      <g className="qa-far-layer">
        <circle cx="143" cy="76" r="31" fill={night ? "#f1f4d5" : "#fff2b2"} />
        {night && (
          <g fill="#f7f0cf">
            {Array.from({ length: 24 }, (_, i) => (
              <circle
                key={i}
                cx={(i * 137 + 30) % 900}
                cy={20 + ((i * 47) % 140)}
                r={i % 3 === 0 ? 1.6 : 1}
                opacity=".7"
              />
            ))}
          </g>
        )}
        <g
          className="qa-cloud"
          fill={night ? "#92b5b5" : "#fff8e6"}
          opacity=".65"
        >
          <path d="M20 116q23-12 49-7q-5-17 19-24q27-7 38 15q32-5 48 16Z" />
          <path d="M455 69q20-9 39-7q0-19 22-21q22-2 29 17q36-5 55 12Z" />
          <path d="M683 131q25-13 51-6q3-24 29-27q28 0 38 22q30-5 48 12Z" />
        </g>
        {coast ? (
          <>
            <path d="M0 199Q400 180 900 197V370H0Z" fill="#459eaf" />
            <path
              className="qa-water"
              d="M50 217h120m100-13h98m126 23h160m-511 13h220m90 20h160"
              stroke="#b5e5de"
              strokeWidth="3"
              opacity=".7"
            />
            <path
              d="M530 228l45-123 70-12 32 123 32-16 19-116 54-13 62 168Z"
              fill="#f3e8c6"
            />
            <path
              d="M600 101l45-8 32 123-32 7ZM748 80l34-9 62 168-60-13Z"
              fill="#c5c9ba"
            />
            <path
              d="M541 198l113-13m74-38 57-8M538 214l126-8m75-22 66-10"
              stroke="#ded7bb"
              strokeWidth="4"
            />
          </>
        ) : (
          <>
            <path
              d="M-70 223L86 111l92 83L301 53l96 105 55-49 90 89L695 79l141 135 92-101v238H0Z"
              fill={night ? "#426272" : "#9bbdc0"}
            />
            <path
              d="M251 110l50-57 61 67-36-9-19 12-20-25-15 17ZM644 131l51-52 59 57-37-11-15 12-18-20Z"
              fill={night ? "#82a3ac" : "#eff3de"}
            />
            <path
              d="M302 55l35 130 60-27-40-53ZM695 79l23 118 67-29Z"
              fill={night ? "#325260" : "#83a8b3"}
              opacity=".55"
            />
            <path
              d="M0 226L138 162l71 53 119-29 99 43 121-68 172 77 180-88v250H0Z"
              fill={night ? "#365e65" : "#709f99"}
            />
          </>
        )}
      </g>
      <g className="qa-mid-layer">
        <path
          d="M0 273Q130 212 278 246T555 242T900 236V540H0Z"
          fill={night ? "#3f6865" : "#a4bf83"}
        />
        <path
          d="M0 325Q204 259 404 307T900 281V540H0Z"
          fill={`url(#${id}-grass)`}
        />
        {city ? (
          <g>
            <path
              d="M510 245V119h154v126M482 244V165h28m155 0h49v79"
              fill="#cfb38a"
              stroke="#a58c6d"
              strokeWidth="3"
            />
            <path d="M537 245v-83q49-65 100 0v83" fill="#487d7d" />
            <path d="M552 245v-76q34-44 70 0v76" fill="#47626a" />
            <path d="M681 164q-10-35 27-65q35 30 25 65Z" fill="#359ba2" />
            <path
              d="M708 99v-10m0 14q-18 35-12 57m12-57q18 35 12 57"
              stroke="#98d0bc"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M522 239V133h130v106M515 146h148"
              fill="none"
              stroke="#e7d0a0"
              strokeWidth="5"
            />
            <path
              d="M529 138h116"
              stroke="#358c8c"
              strokeWidth="6"
              strokeDasharray="5 4"
            />
            <path
              d="M518 209h18m106-18h18M491 183h18m158 16h41"
              stroke="#ae9776"
              strokeWidth="2"
            />
          </g>
        ) : (
          <>
            <YurtArt x={758} y={258} scale={0.72} />
            <YurtArt x={95} y={267} scale={0.58} />
            <YurtArt x={678} y={235} scale={0.37} />
          </>
        )}
        {!coast && (
          <g opacity={night ? ".7" : "1"}>
            <Pine x={29} y={244} size={0.83} />
            <Pine x={188} y={257} size={0.45} />
            <Pine x={866} y={254} size={0.85} />
            <Pine x={817} y={251} size={0.56} />
            {region === "altai" &&
              [235, 290, 360, 430, 560, 613].map((x, i) => (
                <Pine key={x} x={x} y={260} size={0.44 + (i % 3) * 0.12} />
              ))}
          </g>
        )}
        <path
          d="M714 275Q620 324 419 340T180 540H725Q585 399 669 365t141-63"
          fill={`url(#${id}-trail)`}
        />
        <path
          d="M0 326Q240 343 384 372T900 330V540H0Z"
          fill={`url(#${id}-grain)`}
        />
        <g stroke="#759665" strokeWidth="2" fill="none" opacity=".65">
          {Array.from({ length: 32 }, (_, i) => (
            <path
              key={i}
              d={`M${(i * 73) % 900} ${325 + ((i * 37) % 185)}l-3-6m3 6 4-9`}
            />
          ))}
        </g>
        <g stroke="#7d7653" strokeWidth="4">
          <path d="M32 326v-32m32 25v-32m32 25v-32m-64 22 64-14m-64 27 64-14" />
          <path d="M793 318v-31m32 37v-31m32 37v-31m-64 3 64 12m-64 0 64 12" />
        </g>
      </g>
    </g>
  );
});

export const Foreground = memo(function Foreground() {
  return (
    <g aria-hidden="true" className="qa-foreground">
      <g fill="#396d50" stroke="#61915c" strokeWidth="1.5">
        {[10, 47, 82, 815, 852, 889].map((x, i) => (
          <path
            className="qa-grass"
            key={x}
            style={{ animationDelay: `${i * -0.6}s` }}
            d={`M${x} 544q-27-32-19-62q18 18 22 52q1-60 16-72q5 37-9 74q25-38 34-31q-6 24-33 39Z`}
          />
        ))}
      </g>
      <g>
        <path d="M102 525l12-15 27 2 13 18-28 7Z" fill="#819383" />
        <path d="M102 525l12-15 27 2-17 12Z" fill="#bec4a5" />
        <path d="M748 534l9-16 22 1 14 18Z" fill="#82927a" />
        <path d="M757 518l22 1-13 11-18 4Z" fill="#b7bca0" />
      </g>
      <g fill="#efd986">
        {[29, 75, 835, 875].map((x) => (
          <g key={x}>
            <path d={`M${x} 519v-20`} stroke="#72975e" strokeWidth="2" />
            <circle cx={x} cy="498" r="3" />
            <circle cx={x + 4} cy="502" r="2.5" />
          </g>
        ))}
      </g>
    </g>
  );
});

export const AsykGround = memo(function AsykGround() {
  const id = useId().replaceAll(":", "");
  return (
    <g aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-soil`} cx=".34" cy=".25" r=".85">
          <stop stopColor="#f4e1b1" />
          <stop offset=".7" stopColor="#d5bc85" />
          <stop offset="1" stopColor="#aaa276" />
        </radialGradient>
        <pattern
          id={`${id}-sand`}
          width="51"
          height="43"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M4 8l3-1m15 12 2 1m15 14 4-1M9 36l2 1"
            stroke="#967e57"
            opacity=".35"
            strokeWidth="1"
          />
          <path
            d="M9 7h3m18 18h4m10-19h2"
            stroke="#fff3d1"
            strokeWidth="1.5"
            opacity=".65"
          />
        </pattern>
      </defs>
      <ellipse
        cx="300"
        cy="280"
        rx="252"
        ry="223"
        fill="#264f3e"
        opacity=".16"
      />
      <path
        d="M86 130Q147 38 302 41T538 188Q565 303 535 419T310 493Q99 512 60 383T86 130Z"
        fill={`url(#${id}-soil)`}
      />
      <path
        d="M86 130Q147 38 302 41T538 188Q565 303 535 419T310 493Q99 512 60 383T86 130Z"
        fill={`url(#${id}-sand)`}
      />
      <circle
        cx="300"
        cy="222"
        r="155"
        fill="#ecd29b"
        fillOpacity=".23"
        stroke="#9c835c"
        strokeOpacity=".55"
        strokeWidth="9"
      />
      <circle
        cx="300"
        cy="220"
        r="155"
        fill="none"
        stroke="#fff6da"
        strokeWidth="5"
      />
      <circle
        cx="300"
        cy="220"
        r="154"
        fill="none"
        stroke="#fffdf1"
        strokeWidth="1.4"
        strokeDasharray="21 4 8 3"
      />
      <path
        d="M265 444h70M287 451h26"
        stroke="#fff3d2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[
        [-1, 112, 330],
        [1, 473, 384],
        [1, 105, 399],
        [-1, 488, 141],
        [1, 149, 90],
      ].map(([flip, x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${flip} 1)`}>
          <ellipse cy="5" rx="10" ry="3" fill="#6e7857" opacity=".2" />
          <path d="M-8 1l4-6 9 1 4 8-12 1Z" fill="#bbb797" />
          <path d="M-8 1l4-6 9 1-7 4Z" fill="#e4d8b5" />
        </g>
      ))}
    </g>
  );
});

export function SceneCharacter({
  x,
  ground,
  width = 145,
  facing = 1,
  action = "idle",
  characterId,
  equipped = {},
  label,
}: {
  x: number;
  ground: number;
  width?: number;
  facing?: number;
  action?: string;
} & Pick<CharacterArtProps, "characterId" | "equipped" | "label">) {
  const height = (width * 330) / 320;
  return (
    <g className={`qa-actor qa-${action}`}>
      <ellipse
        cx={x + 8}
        cy={ground + 1}
        rx={width * 0.25}
        ry={width * 0.044}
        fill="#233f3a"
        opacity=".23"
      />
      <foreignObject
        x={x - width / 2}
        y={ground - (height * 305) / 330}
        width={width}
        height={height}
        overflow="visible"
      >
        <div
          className="qa-actor-pose"
          style={{ "--qa-facing": facing } as CSSProperties}
        >
          <CharacterArt
            characterId={characterId}
            equipped={equipped}
            decorative={!label}
            label={label}
            lighting
            mood={
              action === "celebrate"
                ? "victory"
                : action === "lose"
                  ? "support"
                  : action === "prepare"
                    ? "thinking"
                    : "waiting"
            }
          />
        </div>
      </foreignObject>
    </g>
  );
}

export function RopeTeams({
  advantage,
  time,
  active,
  reaction,
  characterId,
  equipped,
}: {
  advantage: number;
  time: number;
  active: boolean;
  reaction: boolean;
} & Pick<CharacterArtProps, "characterId" | "equipped">) {
  const shift = Math.max(-110, Math.min(110, -advantage * 0.5));
  const id = useId().replaceAll(":", "");
  const players = [
    { x: 190, id: characterId, team: 1 },
    { x: 310, id: "aqbota" as const, team: 1 },
    { x: 590, id: "qonyr" as const, team: -1 },
    { x: 710, id: "aibar" as const, team: -1 },
  ];
  return (
    <g className={`qa-rope-teams ${active ? "qa-pulling" : "qa-resting"}`}>
      <defs>
        <linearGradient id={`${id}-rope`} x2="0" y2="1">
          <stop stopColor="#f8dda1" />
          <stop offset=".5" stopColor="#c49153" />
          <stop offset="1" stopColor="#765d3a" />
        </linearGradient>
      </defs>
      <ellipse
        cx="450"
        cy="398"
        rx="351"
        ry="53"
        fill="#c9bf91"
        opacity=".65"
      />
      <path d="M360 361v81m180-81v81" stroke="#d06451" strokeWidth="5" />
      <path
        d="M450 342v113"
        stroke="#fff6d9"
        strokeWidth="4"
        strokeDasharray="10 8"
      />
      <text x="355" y="473" textAnchor="end" fontSize="18" fill="#294c45">
        Сенің жағың
      </text>
      <text x="545" y="473" fontSize="18" fill="#294c45">
        Қарсылас
      </text>
      <g
        style={{
          transform: `translateX(${shift}px)`,
          transition: "transform 320ms ease-out",
        }}
      >
        {players.map(({ x, id: cid, team }, i) => (
          <g
            key={i}
            className="qa-puller"
            style={
              {
                "--qa-lean": `${active ? 7 + Math.max(-4, Math.min(4, advantage * team * 0.035)) : 2}deg`,
              } as CSSProperties
            }
          >
            <SceneCharacter
              x={x}
              ground={402}
              width={150}
              characterId={cid}
              equipped={i === 0 ? equipped : undefined}
              action={active ? "pull" : "idle"}
              facing={team}
            />
          </g>
        ))}
        <path
          d={`M135 369Q300 367 450 ${371 + (active ? Math.sin(time / 140) * 1.5 : 0)}T765 369`}
          fill="none"
          stroke="#6f6544"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M135 366Q300 364 450 ${368 + (active ? Math.sin(time / 140) * 1.5 : 0)}T765 366`}
          fill="none"
          stroke={`url(#${id}-rope)`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M138 365h624"
          stroke="#fff0c5"
          strokeWidth="5"
          strokeDasharray="2 6"
          opacity=".55"
        />
        {players.map(({ x, team, id: cid }, i) => (
          <g key={i} transform={`translate(${x + team * 22} 365)`}>
            <ellipse
              rx="9"
              ry="8"
              fill={
                (i === 0
                  ? shopItemById(equipped?.skin ?? "")?.color
                  : undefined) ?? characterById(cid)?.primaryColor
              }
              stroke="#536660"
              strokeWidth="1.5"
            />
            <path d="M-4-4v6m4-7v7" stroke="#fff6dd" strokeWidth="1.4" />
          </g>
        ))}
        <path
          className={active ? "qa-ribbon" : ""}
          d="M443 359h14l-2 47-8-7-9 6Z"
          fill="#c6534d"
          stroke="#ffe9af"
          strokeWidth="2"
        />
        {reaction && active && (
          <g key={Math.floor(time / 650)} className="qa-dust">
            {[172, 291, 608, 729].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="401" rx="15" ry="5" fill="#e4d2a0" />
                <circle cx={x - 17} cy="392" r="3" fill="#f3e5bf" />
              </g>
            ))}
          </g>
        )}
      </g>
    </g>
  );
}
