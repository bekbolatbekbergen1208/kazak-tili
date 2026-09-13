"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Crosshair, Flag, Pause, Play, Trophy } from "lucide-react";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { national } from "@/lib/national/state";
import {
  worldGame,
  teamQuestions,
  type WorldKind,
} from "@/lib/national/world-catalog";
import {
  advanceWorld,
  hiddenTarget,
  phaseAt,
  type WorldSession,
} from "@/lib/national/world-engine";
import { boardMove, legalMoves, newBoard } from "@/lib/national/board";
import { NationalFrame, useGameSound } from "./shared";
import { GameDrawing } from "./world-art";
import "./world.css";

function Companion({
  action = "idle",
  style,
}: {
  action?: string;
  style?: CSSProperties;
}) {
  const { state } = useLearning();
  return (
    <div className={`vw-companion vw-${action}`} style={style}>
      <CharacterArt
        characterId={selectedCharacter(state).id}
        equipped={equipmentFor(state)}
        mood={
          action === "celebrate"
            ? "victory"
            : action === "lose"
              ? "support"
              : action === "wave"
                ? "greeting"
                : "waiting"
        }
      />
    </div>
  );
}

export function WorldGame({ kind }: { kind: WorldKind }) {
  const { state, dispatch, busy } = useLearning(),
    g = worldGame(kind)!,
    saved = state.progress.village?.session;
  const [session, setSession] = useState<WorldSession | null>(
      saved?.kind === kind ? saved : null,
    ),
    [time, setTime] = useState(saved?.kind === kind ? saved.lastAt : 0),
    [paused, setPaused] = useState(false),
    [error, setError] = useState(""),
    [aim, setAim] = useState(0),
    [quality, setQuality] = useState("high"),
    [reduced, setReduced] = useState(false),
    [systemReduced, setSystemReduced] = useState(false),
    [fps, setFps] = useState(0),
    [tutorial, setTutorial] = useState(false),
    [board, setBoard] = useState(newBoard);
  const [shotActive, setShotActive] = useState(false);
  const reduceMotion = reduced || systemReduced || !state.profile.animations;
  const timingRef = useRef<HTMLElement>(null);
  const clock = useRef(time),
    snap = useRef(session),
    pauseRef = useRef(paused),
    prevSaved = useRef(saved?.id),
    sound = useGameSound(national(state).settings.sound);
  const saveRef = useRef<(s: WorldSession) => Promise<void>>(async () => {});
  const directionAudio = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      if (directionAudio.current) void directionAudio.current.close();
    },
    [],
  );
  function directionCue(s: WorldSession) {
    if (kind !== "soqyrteke" || !national(state).settings.sound) return;
    try {
      const c = (directionAudio.current ??= new AudioContext());
      void c.resume();
      const target = hiddenTarget(s),
        distance = Math.abs(target.x - s.x) + Math.abs(target.y - s.y);
      const oscillator = c.createOscillator(),
        gain = c.createGain(),
        pan = c.createStereoPanner();
      oscillator.frequency.value = 700 - distance * 40;
      pan.pan.value = Math.max(-1, Math.min(1, (target.x - s.x) / 4));
      gain.gain.setValueAtTime(0.035, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
      oscillator.connect(gain).connect(pan).connect(c.destination);
      oscillator.start();
      oscillator.stop(c.currentTime + 0.3);
    } catch {
      /* The visual distance/direction cue is equivalent. */
    }
  }
  snap.current = session;
  pauseRef.current = paused;
  useEffect(() => {
    if (
      saved?.kind === kind &&
      (saved.id !== prevSaved.current || saved.claimed)
    ) {
      setSession(saved);
      clock.current = saved.lastAt;
      setTime(saved.lastAt);
      prevSaved.current = saved.id;
    }
  }, [saved, kind]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(media.matches);
    try {
      const prefs = JSON.parse(
        localStorage.getItem("qd-world-visual-v1") ?? "{}",
      );
      if (["high", "medium", "low"].includes(prefs.quality))
        setQuality(prefs.quality);
      setReduced(
        media.matches || prefs.reduced === true || !state.profile.animations,
      );
    } catch {
      setReduced(media.matches);
    }
    const change = () => setSystemReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!session || session.finished) return;
    let raf = 0,
      last = performance.now(),
      frames = 0,
      mark = last;
    const loop = (now: number) => {
      const delta = Math.min(100, now - last);
      last = now;
      if (!pauseRef.current && !document.hidden) {
        clock.current += delta;
        if (timingRef.current && snap.current)
          timingRef.current.style.left = `${phaseAt(snap.current, clock.current) * 100}%`;
        frames++;
        if (now - mark >= 2000) {
          setFps(Math.round((frames * 1000) / (now - mark)));
          frames = 0;
          mark = now;
        }
      } else {
        frames = 0;
        mark = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const hide = () => {
      if (document.hidden) {
        setPaused(true);
        if (snap.current && !snap.current.finished)
          void saveRef.current(snap.current);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [session?.id, session?.finished]);
  async function save(s: WorldSession) {
    const ok = await dispatch({
      type: "village-save",
      sessionId: s.id,
      events: s.events,
    });
    if (!ok) setError("Нәтиже сақталмады. Қайта сақтап көр.");
  }
  saveRef.current = save;
  function preferences(nextQuality: string, nextReduced: boolean) {
    setQuality(nextQuality);
    setReduced(nextReduced);
    localStorage.setItem(
      "qd-world-visual-v1",
      JSON.stringify({ quality: nextQuality, reduced: nextReduced }),
    );
  }
  function act(key: string, value?: number) {
    const current = snap.current;
    if (
      !current ||
      current.finished ||
      paused ||
      busy ||
      (kind === "asyk" && shotActive && key !== "retire")
    )
      return;
    try {
      const next = advanceWorld(current, {
        t: Math.floor(clock.current),
        key,
        ...(value === undefined ? {} : { value }),
      });
      setSession(next);
      snap.current = next;
      sound(next.good);
      directionCue(next);
      setError("");
      if (next.finished) void save(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Әрекет орындалмады");
    }
  }
  const primary: Partial<Record<WorldKind, string>> = {
    asyk: "shoot",
    arqan: "pull",
    tenge: "collect",
    jamby: "shoot",
    oramal: "run",
    bestas:
      session?.phase === 0
        ? "throw"
        : session?.phase === 1
          ? "collect"
          : "catch",
    ushty: "fly",
    baige: "boost",
    qyzquu: "boost",
    aqsuiek: "take",
    soqyrteke: "take",
    kokpar: "take",
  };
  const actRef = useRef(act);
  actRef.current = act;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("button,input,select,a,textarea"))
        return;
      const keys: Record<string, string> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const key = e.code === "Space" ? primary[kind] : keys[e.code];
      if (key) {
        e.preventDefault();
        actRef.current(key, aim);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [kind, aim, primary[kind]]);
  const start = async () => {
    setError("");
    await dispatch({ type: "village-start", kind });
    setPaused(false);
  };
  const controls = (items: [string, string, number?][]) =>
    items.map(([key, label, value]) => (
      <button
        className="btn primary"
        key={`${key}-${value ?? label}`}
        disabled={paused || busy || (kind === "asyk" && shotActive)}
        onClick={() => act(key, value)}
      >
        {label}
      </button>
    ));
  const occupied = saved && !saved.finished && saved.kind !== kind;
  const roundReward = session
    ? national(state).rewards.find(
        (r) =>
          r.id === `village-first-${kind}` &&
          Date.parse(r.date) >= Date.parse(session.startedAt),
      )
    : undefined;
  return (
    <NationalFrame title={g.name}>
      <div
        className={`vw-game ${reduceMotion || quality === "low" ? "vw-reduced" : ""} vw-quality-${quality}`}
      >
        <details className="vw-rules" open={!session}>
          <summary>Ойын нұсқаулығы</summary>
          <h3>Дәстүрлі ойын туралы</h3>
          <p>{g.tradition}</p>
          <h3>
            {kind === "togyz" ? "Тақта ережесі" : "Цифрлық нұсқаның ережесі"}
          </h3>
          <p>{g.rules}</p>
          {kind === "togyz" && (
            <a
              href="https://mindsportsolympiad.com/wp-content/uploads/2021/07/Rules-toguz-en-official.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Ресми ереже дереккөзі
            </a>
          )}
          <p>
            Таңдалған скин ұпайға әсер етпейді. Алғашқы жеңіс: 30 XP, 20 тиын, 1
            кристалл. Қайталап ойнау қосымша валюта бермейді.
          </p>
          <p>
            Пернетақта: бағыт пернелері, бос орын — негізгі әрекет. Экрандағы
            батырмалар touch-пен де жұмыс істейді.
          </p>
        </details>
        <div className="vw-toolbar">
          <label>
            Графика{" "}
            <select
              value={quality}
              onChange={(e) => preferences(e.target.value, reduced)}
            >
              <option value="high">Жоғары</option>
              <option value="medium">Орта</option>
              <option value="low">Төмен</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => preferences(quality, e.target.checked)}
            />{" "}
            Анимацияны азайту
          </label>
          <span title="Осы браузердегі белсенді кадрлар">
            {fps ? `${fps} FPS` : "FPS өлшенуде"}
          </span>
          {session && !session.finished && (
            <button
              className="btn ghost"
              onClick={() => {
                setPaused(!paused);
                if (!paused) void save(session);
              }}
              title={paused ? "Жалғастыру" : "Үзіліс / сақтау"}
            >
              {paused ? (
                <Play size={16} aria-hidden="true" />
              ) : (
                <Pause size={16} aria-hidden="true" />
              )}
              {paused ? "Жалғастыру" : "Үзіліс / сақтау"}
            </button>
          )}
        </div>
        {occupied ? (
          <p>
            Алдымен{" "}
            <Link href={`/learn/national/${saved.kind}`}>
              аяқталмаған ойынды
            </Link>{" "}
            жалғастыр немесе тоқтат.
          </p>
        ) : !session ? (
          <div className="vw-start">
            <Companion action="wave" />
            <h2>{g.name}</h2>
            <p>{g.words.join(" · ")}</p>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => void start()}
            >
              Ойынды бастау
            </button>
          </div>
        ) : (
          <>
            <div className="vw-score">
              <span>
                <Trophy size={16} aria-hidden="true" /> Ұпай{" "}
                <b
                  key={session.score}
                  className={session.turn ? "qa-score-change" : ""}
                >
                  {session.score}
                </b>
              </span>
              <span>
                Әрекет <b>{session.turn}</b>
              </span>
              {["baige", "qyzquu", "audaryspaq"].includes(kind) && (
                <label>
                  Төзімділік <meter min={0} max={100} value={session.energy} />
                </label>
              )}
              <span>
                {session.finished
                  ? "Раунд аяқталды"
                  : paused
                    ? "Үзіліс"
                    : "Ойын жүріп жатыр"}
              </span>
            </div>
            <div className="qa-objective">
              <Flag size={16} aria-hidden="true" />
              <span>
                {(
                  {
                    asyk: "Асықтарды шеңберден шығар · 5 соққы",
                    arqan: "Алтын аймақта тарт · 12 әрекет",
                    baige: "Қарсыластан оз · төзімділікті сақта",
                    qyzquu: "Мәреге бірінші жет",
                    tenge: "Ат үстінен теңгені жина",
                    aqsuiek: "Ақсүйекті іздеп тап",
                    soqyrteke: "Дыбыс пен бағытқа сүйеніп ізде",
                    kokpar: "Салымды алып, қарсы жаққа жеткіз",
                    jamby: "Нысананы көздеп, жебені ат",
                  } as Partial<Record<WorldKind, string>>
                )[kind] ?? g.words.join(" · ")}
              </span>
            </div>
            {kind === "togyz" ? (
              <div className="vw-board">
                <p>
                  Жеңіл компьютер · Қазан: {session.board.kazan[1]} | Сенің
                  қазаның: {session.board.kazan[0]}
                </p>
                <div className="vw-pits">
                  {[...Array(9)]
                    .map((_, i) => 17 - i)
                    .concat([...Array(9)].map((_, i) => i))
                    .map((i) => (
                      <button
                        key={i}
                        disabled={
                          i > 8 ||
                          session.finished ||
                          paused ||
                          busy ||
                          !legalMoves(session.board).includes(i)
                        }
                        className={
                          session.board.trail.includes(i) ? "vw-sown" : ""
                        }
                        onClick={() => act("pit", i)}
                      >
                        <small>{(i % 9) + 1}-отау</small>
                        <strong>
                          {session.board.tuz.includes(i)
                            ? "Тұздық"
                            : session.board.pits[i]}
                        </strong>
                        <svg
                          className="qa-pit-seeds"
                          viewBox="0 0 48 53"
                          aria-hidden="true"
                        >
                          {Array.from(
                            { length: Math.min(12, session.board.pits[i]) },
                            (_, j) => (
                              <g
                                key={j}
                                transform={`translate(${8 + (j % 3) * 15} ${8 + Math.floor(j / 3) * 13})`}
                              >
                                <ellipse
                                  cx="1"
                                  cy="2"
                                  rx="6"
                                  ry="5"
                                  fill="#6f5139"
                                  opacity=".35"
                                />
                                <ellipse
                                  rx="5"
                                  ry="4.5"
                                  fill={j % 3 ? "#f0d3a0" : "#d5a66d"}
                                  stroke="#9a733f"
                                  strokeWidth=".6"
                                />
                                <ellipse
                                  cx="-1.5"
                                  cy="-1.5"
                                  rx="2"
                                  ry="1.2"
                                  fill="#fff0c3"
                                />
                              </g>
                            ),
                          )}
                        </svg>
                      </button>
                    ))}
                </div>
                <p>
                  Құмалақ тарату бағыты: төменгі қатар →, жоғарғы қатар ←.
                  Отаулар толық көрінбесе, тақтаны көлденең сырғыт.
                </p>
                {Object.values(session.board.seen).some((n) => n >= 3) &&
                  controls([["draw", "Үш қайталау: тең ойын"]])}
              </div>
            ) : (
              <div
                className={`vw-stage ${paused ? "vw-paused" : ""}`}
                data-finished={session.finished}
              >
                <GameDrawing
                  s={session}
                  time={time}
                  aim={aim}
                  paused={paused}
                  reduced={reduceMotion || quality === "low"}
                  clock={clock}
                  characterId={selectedCharacter(state).id}
                  equipped={equipmentFor(state)}
                  onShotActive={setShotActive}
                />
                {paused && <div className="vw-pause">Үзіліс</div>}
              </div>
            )}
            <p className="vw-feedback" role="status">
              {session.feedback}
            </p>
            {!session.finished && (
              <>
                <div className="vw-controls">
                  {["asyk", "jamby"].includes(kind) && (
                    <label>
                      <Crosshair size={16} aria-hidden="true" />
                      Бағыт: {aim}°
                      <input
                        aria-label="Бағыт"
                        type="range"
                        min="-65"
                        max="65"
                        value={aim}
                        onChange={(e) => setAim(Number(e.target.value))}
                      />
                    </label>
                  )}
                  {[
                    "asyk",
                    "jamby",
                    "arqan",
                    "altybaqan",
                    "tenge",
                    "bestas",
                  ].includes(kind) && (
                    <div className="vw-timing" aria-label="Ырғақ индикаторы">
                      <span />
                      <i
                        ref={timingRef}
                        style={{ left: `${phaseAt(session, time) * 100}%` }}
                      />
                    </div>
                  )}
                  {kind === "asyk" && controls([["shoot", "Сақаны ат", aim]])}
                  {kind === "jamby" && controls([["shoot", "Жебені ат", aim]])}
                  {kind === "arqan" && controls([["pull", "Тарт"]])}
                  {kind === "tenge" && controls([["collect", "Еңкей · жина"]])}
                  {["baige", "qyzquu"].includes(kind) &&
                    controls([
                      ["boost", "Үдет"],
                      ["rest", "Демал"],
                    ])}
                  {["aqsuiek", "soqyrteke", "kokpar"].includes(kind) &&
                    controls([
                      ["left", "← Солға"],
                      ["up", "↑ Жоғары"],
                      ["down", "↓ Төмен"],
                      ["right", "Оңға →"],
                      ["take", "Ал / тап"],
                    ])}
                  {kind === "saqina" &&
                    controls(
                      [0, 1, 2, 3, 4].map((i) => [
                        "choose",
                        `${i + 1}-алақан`,
                        i,
                      ]),
                    )}
                  {kind === "audaryspaq" &&
                    controls([
                      ["left", "Солға"],
                      ["right", "Оңға"],
                      ["rest", "Демал"],
                    ])}
                  {kind === "altybaqan" && (
                    <>
                      <strong>Келесі: {session.turn % 2 ? "Оң" : "Сол"}</strong>
                      {controls([
                        ["left", "Сол"],
                        ["right", "Оң"],
                      ])}
                    </>
                  )}
                  {kind === "oramal" && controls([["run", "Жүгір"]])}
                  {kind === "hantalapai" &&
                    controls(
                      Array.from({ length: 9 - session.turn }, (_, i) => [
                        "choose",
                        i + session.turn === 0
                          ? "Ханды жина"
                          : `${i + session.turn}-асық`,
                        i + session.turn,
                      ]),
                    )}
                  {kind === "bestas" && (
                    <>
                      <b>{session.turn + 1} тас жинау кезеңі</b>
                      {controls(
                        session.phase === 0
                          ? [["throw", "Лақтыр"]]
                          : session.phase === 1
                            ? [["collect", "Жина"]]
                            : [["catch", "Қақ"]],
                      )}
                    </>
                  )}
                  {kind === "aigolek" &&
                    controls(
                      teamQuestions[Math.min(session.turn, 7)][1].map(
                        (v, i) => ["choose", v, i],
                      ),
                    )}
                  {kind === "ushty" &&
                    controls([
                      ["fly", "Ұшты"],
                      ["stay", "Ұшпайды"],
                    ])}
                </div>
                <button
                  className="btn ghost"
                  disabled={busy || paused}
                  onClick={() => act("retire")}
                >
                  Раундты тоқтату
                </button>
              </>
            )}
            {session.finished && (
              <div className={`vw-result ${session.won ? "vw-win" : ""}`}>
                <h2>
                  {session.won
                    ? "Жеңіс! Жарайсың!"
                    : session.board.winner === -1 && kind === "togyz"
                      ? "Тең ойын!"
                      : "Тағы байқап көр!"}
                </h2>
                <p>
                  Ұпай: {session.score} · Әрекет: {session.turn} · Қате:{" "}
                  {session.mistakes}
                </p>
                <h3>Қайталаған сөздерің</h3>
                <p>{g.words.join(" · ")}</p>
                <p>
                  {session.claimed
                    ? roundReward
                      ? "Нәтиже сақталды. Алғашқы жеңіс марапаты балансқа қосылды; қайталауға қайта берілмейді."
                      : "Нәтиже сақталды."
                    : "Нәтиже сақталуда…"}
                </p>
                <div
                  className={`vw-reward ${roundReward ? "qa-reward-earned" : ""}`}
                >
                  {(() => {
                    const reward = roundReward;
                    return (
                      <>
                        <span>{reward?.xp ?? 0} XP</span>
                        <span>{reward?.coins ?? 0} тиын</span>
                        <span>{reward?.crystals ?? 0} кристалл</span>
                        <small>
                          {reward
                            ? "Алғашқы жеңіс марапаты"
                            : "Бұл раундтың марапаты · алғашқы жеңіске ғана беріледі"}
                        </small>
                      </>
                    );
                  })()}
                </div>
                {!session.claimed && (
                  <button
                    className="btn ghost"
                    disabled={busy}
                    onClick={() => void save(session)}
                  >
                    Нәтижені қайта сақтау
                  </button>
                )}
                <button
                  className="btn primary"
                  disabled={busy || !session.claimed}
                  onClick={() => void start()}
                >
                  Қайта ойнау
                </button>
                <Link className="btn ghost" href="/learn/national">
                  Ауылға оралу
                </Link>
              </div>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="vw-error">
            {error}
          </p>
        )}
        {kind === "togyz" && (
          <section className="vw-tutorial">
            <button
              className="btn ghost"
              onClick={() => setTutorial(!tutorial)}
            >
              Тоғызқұмалақ: үйрету режимі
            </button>
            {tutorial && (
              <>
                <p>
                  Бұл — марапатсыз жаттығу тақтасы. Екі жақтың кезегін өзің
                  басқар. Бірнеше құмалақ болса таңдалған отауда біреуі қалады.
                  Соңғысы қарсы жақта жұп сан жасаса, қазанға түседі. Қазіргі
                  кезек: {board.turn + 1}.
                </p>
                <div className="vw-pits">
                  {board.pits.map((v, i) => (
                    <button
                      key={i}
                      disabled={
                        !legalMoves(board).includes(i) || board.winner !== null
                      }
                      onClick={() => setBoard(boardMove(board, i))}
                    >
                      {i < 9 ? "А" : "Б"}
                      {(i % 9) + 1}: {v}
                    </button>
                  ))}
                </div>
                <p>Қазан: {board.kazan.join(" : ")}</p>
                <button
                  className="btn ghost"
                  onClick={() => setBoard(newBoard())}
                >
                  Жаттығуды жаңарту
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </NationalFrame>
  );
}
