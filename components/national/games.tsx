"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { national, statsFor } from "@/lib/national/state";
import { nationalGames, questionFor } from "@/lib/national/catalog";
import { ARENA, launch, step } from "@/lib/national/physics";
import type { Bone, GameKind, GameSession } from "@/lib/national/types";
import { NationalFrame, Landscape, useGameSound } from "./shared";
export function NationalGame({ kind }: { kind: GameKind }) {
  const { state, dispatch, busy } = useLearning(),
    n = national(state),
    session = n.session,
    game = nationalGames.find((g) => g.id === kind)!,
    router = useRouter();
  const [feedback, setFeedback] = useState(""),
    sound = useGameSound(n.settings.sound);
  const [seconds, setSeconds] = useState(15),
    submitted = useRef(""),
    played = useRef(false);
  useEffect(() => {
    if (session?.kind === kind && !session.finished) played.current = true;
    if (session?.finished && played.current)
      router.replace("/learn/national/result");
  }, [session?.finished, session?.kind, kind, router]);
  useEffect(() => {
    if (!session || session.finished || session.kind !== "arqan") return;
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.ceil(
            (15000 - (Date.now() - Date.parse(session.questionAt))) / 1000,
          ),
        ),
      );
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [
    session?.id,
    session?.turn,
    session?.questionAt,
    session?.finished,
    session?.kind,
  ]);
  useEffect(() => {
    if (
      seconds !== 0 ||
      busy ||
      !session ||
      session.finished ||
      session.kind !== "arqan"
    )
      return;
    const key = `${session.id}-${session.turn}`;
    if (submitted.current === key) return;
    submitted.current = key;
    void dispatch({
      type: "national-answer",
      sessionId: session.id,
      turn: session.turn,
      answer: -1,
    }).then((next) => {
      if (next) setFeedback("Уақыт аяқталды. Келесі сөзді байқап көр!");
    });
  }, [seconds, busy, session, dispatch]);
  if (1 + Math.floor(state.progress.xp / 200) < game.level)
    return (
      <NationalFrame title={game.title}>
        <div className="ng-card">
          <h2>🔒 {game.level}-деңгейде ашылады</h2>
          <Link href="/learn/map" className="btn primary">
            Сабақтарға өту
          </Link>
        </div>
      </NationalFrame>
    );
  if (!session || session.finished || session.kind !== kind)
    return (
      <NationalFrame title={game.title}>
        <div className="ng-card ng-instructions">
          <span className="ng-game-icon">{game.icon}</span>
          <h2>Қалай ойнаймыз?</h2>
          {kind === "asyk" ? (
            <>
              <p>
                Алдымен сөз тапсырмасына жауап бер. Дұрыс жауап соққыны 12%
                күшейтеді.
              </p>
              <p>
                Төмендегі күлгін сақаны ұстап, төмен қарай тарт та жібер. Ұзақ
                тартсаң — соққы күшті. Мақсат — 5 соққыда 6 асықты шеңберден
                шығару.
              </p>
              <p>
                Қарапайым асық: 10 ұпай. Алтын асық: 25 ұпай. Бірнеше асыққа
                комбинация бонусы беріледі.
              </p>
              <p>
                Пернетақта: бағыт пен күш жүгірткілерін өзгертіп, «Ату»
                батырмасын бас.
              </p>
            </>
          ) : (
            <>
              <p>
                Әр сөзге 15 секунд беріледі. Дұрыс жауап арқанды сенің жағыңа,
                қате жауап қарсыласқа жылжытады.
              </p>
              <p>
                6 секундтан жылдам жауап пен қатарынан дұрыс жауаптар қосымша
                күш береді. 12 сұрақтан кейін арқан өз жағында болған ойыншы
                жеңеді.
              </p>
              <p>Күшіңнің шағын бонусы бар, бірақ ең бастысы — білімің!</p>
            </>
          )}
          {session && !session.finished ? (
            <Link
              className="btn primary"
              href={`/learn/national/${session.kind}`}
            >
              Алдыңғы ойынды аяқтау
            </Link>
          ) : (
            <button
              disabled={busy}
              className="btn primary"
              onClick={() => {
                setFeedback("");
                void dispatch({ type: "national-start", kind });
              }}
            >
              Бастау
            </button>
          )}
          {session?.finished && (
            <Link className="btn ghost" href="/learn/national/result">
              Соңғы нәтиже
            </Link>
          )}
        </div>
      </NationalFrame>
    );
  const q = questionFor(session.id, session.turn);
  async function answer(index: number) {
    if (!session) return;
    sound(index === q.answer);
    const next = await dispatch({
      type: "national-answer",
      sessionId: session.id,
      turn: session.turn,
      answer: index,
    });
    if (next) {
      setFeedback(
        `${index === q.answer ? "Дұрыс!" : "Үйреніп алайық."} ${q.explanation}`,
      );
      if (national(next).session?.finished)
        router.push("/learn/national/result");
    }
  }
  return (
    <NationalFrame title={game.title}>
      <div className="ng-game-stats">
        <span>✦ {session.score} ұпай</span>
        <span>
          {kind === "asyk"
            ? `${5 - session.turn} соққы қалды`
            : `${session.turn + 1} / 12 сұрақ`}
        </span>
        <span className={session.combo >= 3 ? "ng-combo" : ""}>
          🔥 Combo ×{session.combo}
        </span>
      </div>
      {kind === "asyk" ? (
        <AsykBoard session={session} />
      ) : (
        <div
          className={`ng-rope-arena ${session.combo >= 3 ? "ng-combo" : ""}`}
        >
          <Landscape />
          <div className="ng-crowd" aria-hidden="true">
            🐻 🦊 🦉 🐪
          </div>
          <div
            className="ng-team ng-team-player"
            style={{ transform: `translateX(${-session.rope * 0.35}px)` }}
          >
            <CharacterArt
              characterId={selectedCharacter(state).id}
              equipped={equipmentFor(state)}
              mood={session.combo ? "joy" : "thinking"}
            />
            <b>Сен</b>
          </div>
          <div
            className="ng-team ng-team-rival"
            style={{ transform: `translateX(${-session.rope * 0.35}px)` }}
          >
            <CharacterArt
              characterId={
                selectedCharacter(state).id === "qonyr" ? "aibar" : "qonyr"
              }
              mood="thinking"
            />
            <b>Қарсылас</b>
          </div>
          <div
            className="ng-rope"
            style={{
              transform: `translateX(${-session.rope * 0.35}px) rotate(${session.combo % 2 ? 1 : -1}deg)`,
            }}
          >
            <span>⚑</span>
          </div>
          <span className="ng-center-line" />
          <div className="ng-rope-meter">
            <span>Сен</span>
            <meter
              aria-label="Арқанның орны"
              min={-100}
              max={100}
              value={session.rope}
            />
            <span>Қарсылас</span>
          </div>
        </div>
      )}
      <p className="ng-feedback" aria-live="polite">
        {feedback}
      </p>
      {!session.answered && (
        <section className="ng-card ng-question">
          <span className="ng-eyebrow">
            ҚАЗАҚША ҮЙРЕН{" "}
            {kind === "arqan" ? `· ${seconds} с` : "· СОҚҚЫҒА БОНУС"}
          </span>
          <h2>{q.prompt}</h2>
          <div className="ng-options">
            {q.options.map((option, i) => (
              <button
                className="btn ghost"
                disabled={busy || (kind === "arqan" && seconds === 0)}
                key={`${session.turn}-${i}`}
                onClick={() => void answer(i)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}
      {kind === "arqan" && seconds === 0 && !busy && (
        <button className="btn ghost" onClick={() => void answer(-1)}>
          Келесі сұраққа өту
        </button>
      )}
      {session.answered && (
        <p className="ng-hint">
          {session.bonus
            ? "✦ Дұрыс жауап! Күш бонусы қосылды."
            : "Келесі тапсырмада тағы байқап көр."}{" "}
          Сақаны тартып, көзде!
        </p>
      )}
    </NationalFrame>
  );
}
function AsykBoard({ session }: { session: GameSession }) {
  const { state, dispatch, busy } = useLearning(),
    n = national(state),
    router = useRouter(),
    canvas = useRef<HTMLCanvasElement>(null),
    frame = useRef(0),
    mounted = useRef(true),
    locked = useRef(false);
  const [angle, setAngle] = useState(0),
    [power, setPower] = useState(80),
    [animating, setAnimating] = useState(false),
    [drag, setDrag] = useState(false),
    dragging = useRef(false),
    aim = useRef({ dx: 0, dy: -80 }),
    sound = useGameSound(n.settings.sound);
  const disabled = busy || animating || !session.answered;
  function paint(bones: Bone[], line = true) {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 600, 500);
    const bg = ctx.createLinearGradient(0, 0, 0, 500);
    bg.addColorStop(0, "#e6cb91");
    bg.addColorStop(1, "#f7e8c5");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 500);
    ctx.strokeStyle = "#ad8250";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(ARENA.cx, ARENA.cy, ARENA.radius, 0, Math.PI * 2);
    ctx.stroke();
    if (!n.settings.light) {
      ctx.fillStyle = "#c5a56f";
      for (let i = 0; i < 36; i++) {
        ctx.beginPath();
        ctx.arc((i * 127) % 600, (i * 73) % 500, 1.5, 0, 7);
        ctx.fill();
      }
    }
    for (const b of bones) {
      if (b.out) continue;
      if (!n.settings.light && Math.hypot(b.vx, b.vy) > 1) {
        ctx.fillStyle = "#fff3d855";
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(
            b.x - b.vx * i * 1.6,
            b.y - b.vy * i * 1.6,
            3 + i * 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate((b.x + b.y) * 0.012);
      ctx.fillStyle =
        b.id === -1
          ? "#7662d5"
          : b.special
            ? "#e6a321"
            : ["#e4776b", "#69b6b1", "#9e86d2", "#f49c56", "#67a5c4"][b.id % 5];
      ctx.shadowColor = "#6b503a44";
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.moveTo(-b.radius, -b.radius * 0.5);
      ctx.bezierCurveTo(
        -b.radius * 1.2,
        -b.radius * 1.3,
        b.radius * 1.2,
        -b.radius * 1.3,
        b.radius,
        -b.radius * 0.5,
      );
      ctx.quadraticCurveTo(b.radius * 0.5, 0, b.radius, b.radius * 0.6);
      ctx.bezierCurveTo(
        b.radius,
        b.radius * 1.2,
        -b.radius,
        b.radius * 1.2,
        -b.radius,
        b.radius * 0.6,
      );
      ctx.quadraticCurveTo(-b.radius * 0.5, 0, -b.radius, -b.radius * 0.5);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff99";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    if (!bones.some((b) => b.id === -1)) {
      ctx.fillStyle = "#7662d5";
      ctx.beginPath();
      ctx.arc(300, 440, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    if (line && session.answered) {
      const v = aim.current,
        accuracy = statsFor(state).accuracy;
      ctx.strokeStyle = "#6652b6";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(300, 440);
      const scale = 1.4 + accuracy * 0.2;
      ctx.lineTo(300 + v.dx * scale, 440 + v.dy * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);
  useEffect(() => {
    if (!animating) paint(session.bones);
  }, [session, angle, power, animating, n.settings.light, state]);
  function update(a: number, p: number) {
    setAngle(a);
    setPower(p);
    aim.current = {
      dx: Math.sin((a * Math.PI) / 180) * p,
      dy: -Math.cos((a * Math.PI) / 180) * p,
    };
    paint(session.bones);
  }
  function position(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 600) / r.width,
      y: ((e.clientY - r.top) * 500) / r.height,
    };
  }
  async function shoot() {
    if (disabled || locked.current) return;
    locked.current = true;
    setAnimating(true);
    sound(true);
    const { dx, dy } = aim.current,
      physical = launch(session.bones, dx, dy, session.bonus);

    const reduced =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !state.profile.animations;
    await new Promise<void>((resolve) => {
      let count = 0,
        last = 0,
        accumulator = 0;
      const tick = (time: number) => {
        if (!mounted.current) {
          resolve();
          return;
        }
        accumulator += last ? Math.min(time - last, 100) : 17;
        last = time;
        let moving = true;
        while (accumulator >= 1000 / 60 && moving && count < 720) {
          moving = step(physical);
          accumulator -= 1000 / 60;
          count++;
        }
        paint(physical, false);
        if (reduced || !moving || count >= 720) resolve();
        else frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    });
    if (!mounted.current) return;
    const next = await dispatch({
      type: "national-shot",
      sessionId: session.id,
      turn: session.turn,
      dx,
      dy,
    });
    locked.current = false;
    if (!mounted.current) return;
    setAnimating(false);
    if (next && national(next).session?.finished)
      router.push("/learn/national/result");
  }
  return (
    <div className="ng-asyk-wrap">
      <div className="ng-board-companion">
        <CharacterArt
          characterId={selectedCharacter(state).id}
          equipped={equipmentFor(state)}
          mood={animating ? "joy" : "waiting"}
        />
      </div>
      <canvas
        ref={canvas}
        width={600}
        height={500}
        role="img"
        aria-label="Асық алаңы. Төмендегі сақаны төмен тартып, жіберіңіз. Пернетақта үшін төмендегі басқаруды қолданыңыз."
        onPointerDown={(e) => {
          if (disabled) return;
          const p = position(e);
          if (Math.hypot(p.x - 300, p.y - 440) > 55) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          setDrag(true);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const p = position(e),
            dx = 300 - p.x,
            dy = Math.min(-10, 440 - p.y),
            power = Math.max(10, Math.min(120, Math.hypot(dx, dy))),
            a = Math.max(
              -65,
              Math.min(65, (Math.atan2(dx, -dy) * 180) / Math.PI),
            );
          update(a, power);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          setDrag(false);
          void shoot();
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setDrag(false);
        }}
        onLostPointerCapture={() => {
          dragging.current = false;
          setDrag(false);
        }}
      />
      <div className="ng-shot-controls">
        <label>
          Бағыт: {Math.round(angle)}°
          <input
            type="range"
            min={-65}
            max={65}
            value={angle}
            disabled={disabled}
            onChange={(e) => update(Number(e.target.value), power)}
          />
        </label>
        <label>
          Күш: {Math.round((power / 120) * 100)}%
          <input
            type="range"
            min={10}
            max={120}
            value={power}
            disabled={disabled}
            onChange={(e) => update(angle, Number(e.target.value))}
          />
        </label>
        <button
          className="btn primary"
          disabled={disabled || drag}
          onClick={() => void shoot()}
        >
          {animating ? "Сақа қозғалып жатыр…" : "Ату →"}
        </button>
      </div>
    </div>
  );
}
