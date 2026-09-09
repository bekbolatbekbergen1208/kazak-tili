"use client";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { useLearning } from "@/components/learning/provider";
import { national } from "@/lib/national/state";
export function NationalFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { state, busy, dispatch } = useLearning(),
    n = national(state);
  return (
    <section
      lang="kk"
      className={`ng-page ${n.settings.light ? "ng-light" : ""}`}
    >
      <div className="ng-top">
        <Link href="/learn/national">← Ойын ауылы</Link>
        <span aria-label="Баланс">
          🪙 {state.progress.coins} · 💎 {n.crystals} · ✦ {state.progress.xp} XP
        </span>
      </div>
      <div className="ng-heading">
        <h1>{title}</h1>
        <div className="ng-settings">
          {(
            [
              ["sound", "Дыбыс"],
              ["music", "Әуен"],
              ["light", "Жеңіл режим"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              disabled={busy}
              aria-pressed={n.settings[key]}
              onClick={() =>
                void dispatch({
                  type: "national-settings",
                  settings: { ...n.settings, [key]: !n.settings[key] },
                })
              }
            >
              {label}: {n.settings[key] ? "қосулы" : "өшірулі"}
            </button>
          ))}
        </div>
      </div>
      <nav className="ng-tabs" aria-label="Ұлттық ойындар мәзірі">
        {[
          ["character", "Менің кейіпкерім"],
          ["upgrade", "Дамыту"],
          ["shop", "Дүкен"],
          ["daily", "Күнделікті тапсырмалар"],
          ["rewards", "Марапаттар"],
        ].map(([url, label]) => (
          <Link key={url} href={`/learn/national/${url}`}>
            {label}
          </Link>
        ))}
      </nav>
      <NationalMusic enabled={n.settings.music} />
      {children}
    </section>
  );
}
function NationalMusic({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let context: AudioContext | undefined,
      timer: ReturnType<typeof setInterval> | undefined,
      index = 0;
    const begin = () => {
      if (context) return;
      context = new AudioContext();
      void context.resume();
      const play = () => {
        if (!context || document.hidden) return;
        const oscillator = context.createOscillator(),
          gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = [
          261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23,
        ][index++ % 8];
        gain.gain.setValueAtTime(0.025, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + 0.9,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 1);
      };
      play();
      timer = setInterval(play, 1000);
    };
    window.addEventListener("pointerdown", begin);
    window.addEventListener("keydown", begin);
    return () => {
      window.removeEventListener("pointerdown", begin);
      window.removeEventListener("keydown", begin);
      if (timer) clearInterval(timer);
      if (context) void context.close();
    };
  }, [enabled]);
  return null;
}
export function useGameSound(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      if (context.current) void context.current.close();
    },
    [],
  );
  return (correct: boolean) => {
    if (!enabled) return;
    try {
      const c = (context.current ??= new AudioContext());
      void c.resume();
      const o = c.createOscillator(),
        g = c.createGain();
      o.frequency.value = correct ? 660 : 220;
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.2);
    } catch {
      /* Audio is optional. */
    }
  };
}
export function Landscape() {
  return (
    <div className="ng-landscape" aria-hidden="true">
      <span className="ng-sun" />
      <span className="ng-cloud">☁</span>
      <span className="ng-mountain" />
      <span className="ng-mountain second" />
      <div className="ng-yurt">
        <i />
        <b />
      </div>
      <span className="ng-path" />
      <span className="ng-grass">✧ · ✿ · ✧</span>
    </div>
  );
}
