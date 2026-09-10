"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Point } from "@/lib/travel/types";
const directions: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};
export function useMovement(initial: Point) {
  const [point, setPoint] = useState(initial),
    keys = useRef(new Set<string>()),
    frame = useRef(0),
    previous = useRef(0);
  const stop = () => {
    keys.current.clear();
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    previous.current = 0;
  };
  function tick(time: number) {
    const dt =
      Math.min(40, previous.current ? time - previous.current : 16) / 1000;
    previous.current = time;
    let x = 0,
      y = 0;
    keys.current.forEach((k) => {
      x += directions[k].x;
      y += directions[k].y;
    });
    const length = Math.hypot(x, y) || 1;
    setPoint((p) => ({
      x: Math.max(5, Math.min(95, p.x + (x / length) * dt * 24)),
      y: Math.max(15, Math.min(90, p.y + (y / length) * dt * 30)),
    }));
    if (keys.current.size) frame.current = requestAnimationFrame(tick);
    else stop();
  }
  const press = (k: string) => {
    if (!directions[k]) return;
    keys.current.add(k);
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  };
  const release = (k: string) => {
    keys.current.delete(k);
    if (!keys.current.size) stop();
  };
  const keyboard = (e: KeyboardEvent, down: boolean) => {
    if (e.target !== e.currentTarget) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!directions[key]) return;
    e.preventDefault();
    if (down) press(key);
    else release(key);
  };
  useEffect(() => {
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      stop();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, []);
  return {
    point,
    moveTo: (p: Point) => {
      stop();
      setPoint(p);
    },
    press,
    release,
    stop,
    sceneProps: {
      tabIndex: 0,
      onKeyDown: (e: KeyboardEvent) => keyboard(e, true),
      onKeyUp: (e: KeyboardEvent) => keyboard(e, false),
      onBlur: stop,
    },
  };
}
export function MovementPad({
  movement,
}: {
  movement: ReturnType<typeof useMovement>;
}) {
  return (
    <div className="hs-controls">
      <p>
        Картаны басып, <kbd>WASD</kbd> немесе бағыт пернелерімен жүр. Нысанды
        тікелей таңдауға да болады.
      </p>
      <div className="hs-pad" aria-label="Кейіпкерді басқару">
        {(
          [
            ["ArrowUp", "↑", "Жоғары"],
            ["ArrowLeft", "←", "Солға"],
            ["ArrowDown", "↓", "Төмен"],
            ["ArrowRight", "→", "Оңға"],
          ] as const
        ).map(([key, label, name]) => (
          <button
            key={key}
            aria-label={name}
            className={`hs-pad-${key}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              movement.press(key);
            }}
            onPointerUp={() => movement.release(key)}
            onPointerCancel={movement.stop}
            onLostPointerCapture={movement.stop}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                movement.press(key);
              }
            }}
            onKeyUp={movement.stop}
            onBlur={movement.stop}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
