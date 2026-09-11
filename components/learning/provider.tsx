"use client";
import { TravelRewards } from "@/components/travel/rewards";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyAction, initialState, levelFor } from "@/lib/learning/state";
import type { LearningAction, LearningState } from "@/lib/learning/types";
import { createClient } from "@/utils/supabase/client";
import {
  hydrateCharacters,
  pendingReveals,
  selectedCharacter,
  equipmentFor,
} from "@/lib/characters/state";
import { CharacterReveal } from "@/components/characters/reveal";
import { CharacterArt } from "@/components/characters/character-art";
import { historyUi } from "@/lib/history/ui";
const DEMO_KEY = "qazaqdos-learning-demo-v1";
type Context = {
  state: LearningState;
  demo: boolean;
  localOnly: boolean;
  busy: boolean;
  error: string;
  dispatch: (a: LearningAction) => Promise<LearningState | null>;
  t: (ru: string, en: string) => string;
  logout: () => Promise<void>;
};
const LearningContext = createContext<Context | null>(null);
export function useLearning() {
  const c = useContext(LearningContext);
  if (!c) throw new Error("Learning provider missing");
  return c;
}
export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false),
    [localOnly, setLocalOnly] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [levelUp, setLevelUp] = useState(0);
  const router = useRouter(),
    path = usePathname(),
    current = useRef(state),
    revision = useRef(0),
    storageKey = useRef(DEMO_KEY),
    lock = useRef(false);
  const kazakhMode = ["/learn/history", "/learn/friends", "/learn/vision"].some(
    (prefix) => path.startsWith(prefix),
  );
  const t = (ru: string, en: string) =>
    kazakhMode && historyUi[ru]
      ? historyUi[ru]
      : state.profile.language === "en"
        ? en
        : ru;
  const load = useCallback(async () => {
    setError("");
    try {
      const mode = new URLSearchParams(window.location.search).get("demo");
      if (mode === "1") sessionStorage.setItem("qd-demo", "1");
      if (mode === "0") sessionStorage.removeItem("qd-demo");
      const local = sessionStorage.getItem("qd-demo") === "1";
      setDemo(local);
      setLocalOnly(false);
      if (local) {
        storageKey.current = DEMO_KEY;
        const raw = localStorage.getItem(DEMO_KEY);
        let s = initialState();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.progress?.version === 1 && parsed.profile) s = parsed;
          } catch {
            localStorage.removeItem(DEMO_KEY);
          }
        }
        s = hydrateCharacters(s);
        current.current = s;
        setState(s);
      } else {
        const res = await fetch("/api/learning", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        current.current = hydrateCharacters(body.state);
        if (body.writable === false) {
          setLocalOnly(true);
          storageKey.current = `qazaqdos-learning-local-${body.userId}`;
          const raw = localStorage.getItem(storageKey.current);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.progress?.version === 1 && parsed.profile)
                current.current = hydrateCharacters(parsed);
            } catch {
              localStorage.removeItem(storageKey.current);
            }
          }
        }
        setState(current.current);
        revision.current = body.revision;
      }
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (ready && !state.profile.onboarded && path !== "/onboarding")
      router.replace("/onboarding");
  }, [ready, state.profile.onboarded, path, router]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if ((demo || localOnly) && e.key === storageKey.current) void load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [demo, localOnly, load]);
  async function dispatch(action: LearningAction) {
    if (lock.current) return null;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      let next: LearningState;
      if (demo || localOnly) {
        next = applyAction(current.current, action);
        localStorage.setItem(storageKey.current, JSON.stringify(next));
      } else {
        const res = await fetch("/api/learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, revision: revision.current }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        next = data.state;
        revision.current = data.revision;
      }
      if (levelFor(next.progress.xp) > levelFor(current.current.progress.xp))
        setLevelUp(levelFor(next.progress.xp));
      current.current = next;
      setState(next);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (!demo) {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setError(error.message);
        return;
      }
    }
    sessionStorage.removeItem("qd-demo");
    router.push("/login");
    router.refresh();
  }
  if (!ready)
    return (
      <main className="qd-loading" aria-live="polite">
        {error ? (
          <>
            <h1>QazaqDos</h1>
            <p role="alert">{error}</p>
            <button className="btn primary" onClick={() => void load()}>
              {kazakhMode ? "Қайта жүктеу" : "Повторить / Retry"}
            </button>
            <a className="btn ghost" href="/login">
              {kazakhMode ? "Кіру" : "Войти / Sign in"}
            </a>
          </>
        ) : (
          <>
            <div className="qd-skeleton" />
            <p>
              {kazakhMode
                ? "Тарих әлемі дайындалып жатыр…"
                : "Загрузка программы / Loading your course…"}
            </p>
          </>
        )}
      </main>
    );
  return (
    <LearningContext.Provider
      value={{ state, demo, localOnly, busy, error, dispatch, t, logout }}
    >
      <div
        className={`qd-app ${state.profile.animations ? "" : "qd-still"} ${state.profile.theme === "mint" ? "qd-mint" : ""}`}
        lang={kazakhMode ? "kk" : state.profile.language}
      >
        {error && (
          <div className="qd-error" role="alert">
            {error}{" "}
            <button onClick={() => void load()}>
              {t("Обновить", "Reload")}
            </button>
          </div>
        )}
        {state.profile.onboarded || path === "/onboarding" ? (
          children
        ) : (
          <p>{t("Открываем настройку профиля…", "Opening profile setup…")}</p>
        )}
        <CharacterReveal />
        {levelUp === 0 && pendingReveals(state).length === 0 && (
          <TravelRewards />
        )}
        {levelUp > 0 && pendingReveals(state).length === 0 && (
          <div className="qd-overlay">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="level-title"
              className="panel qd-celebrate"
            >
              <CharacterArt
                characterId={selectedCharacter(state).id}
                mood="celebration"
                equipped={equipmentFor(state)}
              />
              <h2 id="level-title">
                {t("Новый уровень", "New level")} {levelUp}!
              </h2>
              <p>
                {t(
                  "Ваши знания растут с каждым уроком.",
                  "Your knowledge grows with every lesson.",
                )}
              </p>
              <p>
                🪙 +10 {t("монет за новый уровень", "coins for the new level")}
              </p>
              <button
                autoFocus
                className="btn primary"
                onClick={() => setLevelUp(0)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") e.preventDefault();
                  if (e.key === "Escape") setLevelUp(0);
                }}
              >
                {t("Продолжить", "Continue")}
              </button>
            </section>
          </div>
        )}
      </div>
    </LearningContext.Provider>
  );
}
