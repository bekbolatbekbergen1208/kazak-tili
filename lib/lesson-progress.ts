import {useEffect, useState} from "react";

const STORAGE_KEY = "qazaqdos-unlocked-lesson";
const PROGRESS_EVENT = "qazaqdos-progress";
const LAST_PROGRESS_STEP = 1001;

function clamp(value: number) {
  return Math.min(LAST_PROGRESS_STEP, Math.max(1, Math.floor(value)));
}

export function getUnlockedLesson() {
  if (typeof window === "undefined") return 1;
  const stored = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? clamp(stored) : 1;
}

export function completeLesson(id: number) {
  if (typeof window === "undefined") return 1;
  const current = getUnlockedLesson();
  const next = clamp(Math.max(current, id + 1));
  window.localStorage.setItem(STORAGE_KEY, String(next));
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, {detail: next}));
  return next;
}

export function useLessonProgress() {
  const [unlockedLesson, setUnlockedLesson] = useState(1);
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    const sync = () => setUnlockedLesson(getUnlockedLesson());
    sync();
    setProgressReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener(PROGRESS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROGRESS_EVENT, sync);
    };
  }, []);

  return {unlockedLesson, progressReady};
}
