"use client";
import { useEffect, useRef, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import { travelOf } from "@/lib/travel/state";
export function useTravelMotion() {
  const { state } = useLearning();
  const [reduced, setReduced] = useState(true),
    [visible, setVisible] = useState(true),
    [lowPower, setLowPower] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const nav = navigator as Navigator & { deviceMemory?: number };
    setLowPower(
      (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4,
    );
    let inView = true;
    const visibility = () => setVisible(inView && !document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      visibility();
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);
  const settings = travelOf(state).settings;
  const mode =
    !state.profile.animations || reduced
      ? "off"
      : settings.animation === "full" && lowPower
        ? "light"
        : settings.animation;
  return { ref, mode, paused: !visible, reduced };
}
