"use client";
import { useId, useEffect, useState, useRef, type RefObject } from "react";
import type { CharacterArtProps } from "@/components/characters/character-art";
import {
  AsykGround,
  Foreground,
  RopeTeams,
  SceneCharacter,
  SteppeBackdrop,
} from "./scene-art";
import { worldGame } from "@/lib/national/world-catalog";
export { YurtArt as Yurt } from "./scene-art";
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
export const BONE_SHAPE =
  "M-11-13C-6-18 1-16 3-10C10-15 17-11 16-5C15 0 10 0 9 5C14 9 13 16 7 17C2 19-1 12-5 12C-11 17-17 12-15 6L-10-1C-15-5-16-10-11-13Z";
export function BoneArt({
  x,
  y,
  gold = false,
  size = 1,
  saka = false,
  angle = 0,
}: {
  x: number;
  y: number;
  gold?: boolean;
  size?: number;
  saka?: boolean;
  angle?: number;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <g
      transform={`translate(${x} ${y}) scale(${size})`}
      data-bone-kind={saka ? "saka" : "asyk"}
    >
      <defs>
        <linearGradient id={`${id}-bone`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor={saka ? "#d4d7ff" : gold ? "#fff3b3" : "#fffef0"} />
          <stop
            offset=".42"
            stopColor={saka ? "#9587df" : gold ? "#f4cb55" : "#ede0c3"}
          />
          <stop
            offset="1"
            stopColor={saka ? "#584899" : gold ? "#b98331" : "#b6a782"}
          />
        </linearGradient>
      </defs>
      <ellipse cx="5" cy="15" rx="18" ry="7" fill="#584d36" opacity=".2" />
      <ellipse cx="2" cy="10" rx="12" ry="4" fill="#4f493a" opacity=".2" />
      <g transform={`rotate(${angle})`}>
        <path
          d={BONE_SHAPE}
          transform="translate(1 3)"
          fill={saka ? "#42356e" : gold ? "#8e6a2e" : "#97886b"}
        />
        <path
          d={BONE_SHAPE}
          fill={`url(#${id}-bone)`}
          stroke={saka ? "#5e528d" : "#9b8962"}
          strokeWidth="1.1"
        />
        <path
          d="M-10-10q5-6 10 2M6-7q7-4 8 1M-11 7q-1 6 6 3"
          stroke={saka ? "#e4e8ff" : "#fff9dc"}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-4-6Q-8 0-1 4T5 12"
          stroke={saka ? "#584391" : "#a58a57"}
          strokeWidth="2"
          fill="none"
          opacity=".65"
        />
        <path
          d="M-2-6q-3 5 2 7"
          stroke="#fffae4"
          strokeWidth="1.3"
          fill="none"
          opacity=".7"
        />
        {saka && <path d="M5 1l3-3 3 3-3 3Z" fill="#f9d77a" />}
      </g>
    </g>
  );
}
export function Horse({
  x,
  y,
  color = "#9c674b",
  running = false,
  rider,
}: {
  x: number;
  y: number;
  color?: string;
  running?: boolean;
  rider?: Pick<CharacterArtProps, "characterId" | "equipped"> & {
    action?: string;
  };
}) {
  const id = useId().replaceAll(":", "");
  return (
    <g className={`vw-horse ${running ? "qa-horse-running" : "qa-horse-idle"}`}>
      <g
        className="qa-horse-move"
        style={{ transform: `translate(${x}px, ${y}px)` }}
      >
        <defs>
          <linearGradient id={`${id}-coat`} x2=".8" y2="1">
            <stop stopColor={`color-mix(in srgb, ${color}, #fff2c6 35%)`} />
            <stop offset=".5" stopColor={color} />
            <stop
              offset="1"
              stopColor={`color-mix(in srgb, ${color}, #263f39 35%)`}
            />
          </linearGradient>
        </defs>
        <ellipse className="qa-horse-shadow" cx="8" cy="47" rx="73" ry="9" />
        {[-35, -17, 25, 40].map((a, i) => (
          <g key={a} className={`vw-leg leg-${i}`}>
            <path
              d={`M${a} 6q-8 20 2 35h12`}
              fill="none"
              stroke={
                i < 2 ? `color-mix(in srgb, ${color}, #273d34 25%)` : color
              }
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d={`M${a + 1} 41h12`}
              stroke="#404b40"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
        ))}
        <path
          className="vw-tail"
          d="M-53-7Q-90-20-82 32Q-70 12-52 7"
          fill="#473348"
        />
        <path
          d="M-57-6Q-60-31-31-29L11-27Q31-29 42-10L31 18Q12 33-34 23Q-54 19-57-6Z"
          fill={`url(#${id}-coat)`}
        />
        <path
          d="M25 0L37-55Q48-73 65-58L83-36Q85-22 62-26L48 12"
          fill={`url(#${id}-coat)`}
        />
        <path
          d="M-49-13q10-11 22-9m61-7 7-22"
          stroke="#efd3a0"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".55"
        />
        <path
          d="M-42 14q28 16 64-3M28-7q-3 13-10 17"
          stroke="#614d3b"
          opacity=".25"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M54-56q-5 18 12 22l9-1"
          stroke="#f6dab0"
          strokeWidth="3"
          fill="none"
          opacity=".6"
        />
        <path d="M40-52Q37-80 54-70L59-60M36-51Q24-42 27-17" fill="#44314c" />
        <circle cx="64" cy="-46" r="3" fill="#242338" />
        <circle cx="65" cy="-47" r="1" fill="#fff8de" />
        <path
          d="M62-59l9 24-8 8m10-11-12 4Q32-20 5-31"
          fill="none"
          stroke="#54473c"
          strokeWidth="2"
        />
        <path
          d="M-30-21Q-10-5 17-20L16 9H-25Z"
          fill="#b84e49"
          stroke="#ffdc8a"
          strokeWidth="3"
        />
        <path
          d="M-22-19Q-10-29 11-21"
          stroke="#674e39"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-18-12l8 8 8-8 8 8"
          fill="none"
          stroke="#ffe4a5"
          strokeWidth="3"
        />
        {rider && (
          <g className={running ? "qa-ride" : ""}>
            <SceneCharacter
              x={-6}
              ground={-17}
              width={82}
              characterId={rider.characterId}
              equipped={rider.equipped}
              action={rider.action ?? "ride"}
            />
          </g>
        )}
        {running && (
          <g className="qa-hoof-dust" fill="#dcc795" opacity=".38">
            <ellipse cx="-53" cy="42" rx="18" ry="5" />
            <ellipse cx="-78" cy="36" rx="10" ry="4" />
          </g>
        )}
      </g>
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
  return <SteppeBackdrop night={night} />;
}
export function GameDrawing({
  s,
  time,
  aim,
  paused = false,
  reduced = false,
  clock,
  characterId = "tilmash",
  equipped,
  onShotActive,
}: {
  s: WorldSession;
  time: number;
  aim: number;
  paused?: boolean;
  reduced?: boolean;
  clock?: RefObject<number>;
  onShotActive?: (active: boolean) => void;
} & Pick<CharacterArtProps, "characterId" | "equipped">) {
  const [sceneTime, setSceneTime] = useState(time);
  useEffect(() => {
    if (!clock || paused || s.finished || s.kind === "asyk") return;
    let frame = 0;
    const update = () => {
      setSceneTime(clock.current);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [clock, paused, s.finished, s.id, s.kind]);
  time = clock ? (s.finished ? s.lastAt : sceneTime) : time;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [movingBones, setMovingBones] = useState(s.bones);
  const [inFlight, setInFlight] = useState(false);
  const [impacts, setImpacts] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const rotations = useRef(new Map<number, number>());
  const seenShot = useRef(s.events.length);
  useEffect(() => {
    const event = s.events.at(-1);
    const fresh = seenShot.current !== s.events.length;
    seenShot.current = s.events.length;
    if (
      s.kind !== "asyk" ||
      event?.key !== "shoot" ||
      !fresh ||
      reduced ||
      s.finished
    ) {
      setMovingBones(s.bones);
      setInFlight(false);
      onShotActive?.(false);
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
    setInFlight(true);
    onShotActive?.(true);
    rotations.current.clear();
    const emitted = new Set<number>();
    let raf = 0,
      count = 0,
      last = 0,
      accumulator = 0;
    const draw = (now: number) => {
      if (document.hidden || pausedRef.current) {
        last = now;
        raf = requestAnimationFrame(draw);
        return;
      }
      accumulator += last ? Math.min(now - last, 100) : 1000 / 60;
      last = now;
      let active = true;
      const hits: { x: number; y: number; id: number }[] = [];
      while (accumulator >= 1000 / 60 && active && count < 720) {
        const previousSpeeds = bones.map((b) => Math.hypot(b.vx, b.vy));
        active = step(bones);
        bones.forEach((b, i) => {
          const speed = Math.hypot(b.vx, b.vy);
          rotations.current.set(
            b.id,
            (rotations.current.get(b.id) ?? 0) + speed * 1.8,
          );
          if (
            b.id !== -1 &&
            !emitted.has(b.id) &&
            previousSpeeds[i] < 0.1 &&
            speed > 0.4
          ) {
            emitted.add(b.id);
            hits.push({ x: b.x, y: b.y, id: b.id });
          }
        });
        accumulator -= 1000 / 60;
        count++;
      }
      if (hits.length) setImpacts((old) => [...old, ...hits].slice(-6));
      setMovingBones(bones.map((b) => ({ ...b })));
      if (active && count < 720) raf = requestAnimationFrame(draw);
      else {
        setMovingBones(s.bones);
        setInFlight(false);
        onShotActive?.(false);
      }
    };
    setImpacts([]);
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [s.kind, s.events.length, s.id, reduced, s.finished, onShotActive]);
  const p = phaseAt(s, time),
    family = s.kind,
    dt = time - s.lastAt;
  const isHorse = ["tenge", "baige", "qyzquu", "audaryspaq"].includes(family);
  const isGrid = ["aqsuiek", "soqyrteke", "kokpar"].includes(family);
  const night = ["aqsuiek", "soqyrteke"].includes(family);
  const action = s.finished
    ? s.won
      ? "celebrate"
      : "lose"
    : s.events.length && dt < 650
      ? s.good
        ? "action"
        : "lose"
      : "idle";
  return (
    <svg
      viewBox="0 0 900 540"
      className={`vw-scene qa-scene qa-scene-${family}`}
      data-shot-active={inFlight}
      role="img"
      aria-label={`${worldGame(family)?.name}: ойын алаңы`}
    >
      {family === "asyk" ? (
        <>
          <rect width="900" height="540" fill="#638d60" />
          <g transform="scale(1 .67)">
            <SteppeBackdrop />
          </g>
          <path d="M0 348Q430 293 900 351V540H0Z" fill="#73925e" />
        </>
      ) : isGrid ? (
        <>
          <rect width="900" height="540" fill={night ? "#31584f" : "#70945f"} />
          <g transform="scale(1 .5)">
            <SteppeBackdrop night={night} />
          </g>
          <path
            d="M0 270Q400 239 900 271V540H0Z"
            fill={night ? "#31584f" : "#70945f"}
          />
        </>
      ) : (
        <g
          style={{
            transform:
              isHorse && !reduced
                ? `translateX(${-Math.min(26, s.distance * 0.1)}px) scaleX(1.03)`
                : undefined,
            transition: "transform 600ms ease-out",
          }}
        >
          <SteppeBackdrop night={night} region={isHorse ? "altai" : "steppe"} />
        </g>
      )}
      {family === "asyk" && (
        <g transform="translate(150 150) scale(1 .74)">
          <AsykGround />
          {movingBones
            .filter((b) => !b.out)
            .map((b) => (
              <g key={b.id}>
                {inFlight && !reduced && Math.hypot(b.vx, b.vy) > 1 && (
                  <path
                    d={`M${b.x} ${b.y}l${-b.vx * 2.4} ${-b.vy * 2.4}`}
                    stroke="#fff2cd"
                    opacity=".4"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                )}
                <BoneArt
                  x={b.x}
                  y={b.y}
                  gold={b.special}
                  saka={b.id === -1}
                  size={b.radius / 15}
                  angle={rotations.current.get(b.id) ?? b.id * 29}
                />
              </g>
            ))}
          {!inFlight && !s.finished && (
            <>
              <circle
                cx="300"
                cy="440"
                r="30"
                fill="none"
                stroke="#fff9d8"
                strokeWidth="2"
              />
              <circle
                cx="300"
                cy="440"
                r="34"
                fill="none"
                stroke="#6454a1"
                strokeWidth="4"
                strokeDasharray="22 6"
              />
              <path
                d={`M300 440l${Math.sin((aim * Math.PI) / 180) * 130} ${-Math.cos((aim * Math.PI) / 180) * 130}`}
                stroke="#51458b"
                strokeWidth="4"
                strokeDasharray="8 7"
              />
              <BoneArt x={300} y={440} saka size={1.2} />
            </>
          )}
          {!reduced &&
            impacts.map((hit) => (
              <g
                className="qa-impact"
                key={`${s.turn}-${hit.id}`}
                transform={`translate(${hit.x} ${hit.y})`}
              >
                <g className="qa-impact-ring">
                  <circle r="21" stroke="#fff7d4" strokeWidth="3" fill="none" />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <path
                      key={i}
                      transform={`rotate(${i * 72})`}
                      d="M0-24v-8"
                      stroke="#ead9ac"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              </g>
            ))}
        </g>
      )}
      {family === "asyk" && (
        <SceneCharacter
          x={138}
          ground={436}
          width={155}
          characterId={characterId}
          equipped={equipped}
          action={inFlight ? "action" : s.finished ? action : "prepare"}
        />
      )}
      {isHorse && (
        <>
          <Horse
            x={family === "tenge" ? 340 : 180 + Math.min(300, s.distance * 1.8)}
            y={380}
            running={
              !s.finished &&
              !paused &&
              !reduced &&
              (family === "tenge" || (s.events.length > 0 && dt < 650))
            }
            rider={{
              characterId,
              equipped,
              action: s.finished ? action : "ride",
            }}
          />
          {family !== "tenge" && (
            <Horse
              x={230 + Math.min(350, s.rival * 1.8)}
              y={280}
              color="#c7a284"
              running={
                !s.finished &&
                !paused &&
                !reduced &&
                s.events.length > 0 &&
                dt < 650
              }
              rider={{ characterId: "qonyr" }}
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
        <RopeTeams
          advantage={s.distance}
          time={reduced ? 0 : time}
          active={!s.finished && !paused}
          reaction={s.events.length > 0 && dt < 450 && !reduced}
          characterId={characterId}
          equipped={equipped}
        />
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
          <rect
            x="-10"
            y="-10"
            width="618"
            height="344"
            rx="14"
            fill={night ? "#34554d" : "#86a16c"}
            stroke={night ? "#739076" : "#d1cb99"}
            strokeWidth="2"
          />
          {Array.from({ length: 40 }, (_, i) => (
            <rect
              key={i}
              x={(i % 8) * 75}
              y={Math.floor(i / 8) * 65}
              width="72"
              height="62"
              rx="6"
              fill="#f5f8dc"
              opacity=".1"
              stroke="#fff"
            />
          ))}
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
                  <g
                    key={i}
                    className="qa-grid-player"
                    style={{
                      transform: `translate(${d.x * 75 + 36}px, ${d.y * 65 + 42}px)`,
                    }}
                  >
                    <SceneCharacter
                      x={0}
                      ground={0}
                      width={65}
                      characterId={i ? "aibar" : "qonyr"}
                    />
                  </g>
                );
              })}
              <path d="M595 5v300" stroke="#ffe27d" strokeWidth="10" />
            </>
          )}
          <g
            className="qa-grid-player"
            style={{
              transform: `translate(${s.x * 75 + 36}px, ${s.y * 65 + 43}px)`,
            }}
          >
            <ellipse
              cy="1"
              rx="27"
              ry="13"
              fill="none"
              stroke="#f5df91"
              strokeWidth="2"
            />
            <SceneCharacter
              x={0}
              ground={0}
              width={72}
              characterId={characterId}
              equipped={equipped}
              action={
                dt < 240 && s.events.length && !s.finished && !paused
                  ? "run"
                  : action
              }
            />
          </g>
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
          <g
            className="qa-grid-player"
            style={{ transform: `translateX(${Math.min(230, s.score * 2)}px)` }}
          >
            <path
              d="M250 371h160"
              stroke="#cfab7b"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {(["aqbota", "qonyr", "aibar"] as const).map((id, i) => (
              <SceneCharacter
                key={id}
                x={250 + i * 80}
                ground={409}
                width={94}
                characterId={id}
                action={action}
              />
            ))}
          </g>
        </>
      )}
      {family === "audaryspaq" && (
        <text x="450" y="150" textAnchor="middle" fontSize="28" fill="#483957">
          Қарсылас: {randomAt(s.seed, s.turn + 20) > 0.5 ? "Оңға" : "Солға"}
        </text>
      )}
      {!isHorse &&
        !["asyk", "arqan", "aqsuiek", "soqyrteke", "kokpar"].includes(
          family,
        ) && (
          <SceneCharacter
            x={120}
            ground={449}
            width={145}
            characterId={characterId}
            equipped={equipped}
            action={action}
          />
        )}
      {s.events.length > 0 && !s.finished && !reduced && family !== "asyk" && (
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
      )}
      <Foreground />
    </svg>
  );
}
