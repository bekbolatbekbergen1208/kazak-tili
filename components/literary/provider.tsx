"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  applyLanguageAction,
  initialLanguageState,
} from "@/lib/literary/state";
import type { LanguageAction, LanguageState } from "@/lib/literary/types";
import { learnerLevel } from "@/lib/literary/style";
import type { Level } from "@/lib/q-level/types";
const key = "qd-literary-demo-v1";
type Context = {
  state: LanguageState;
  ready: boolean;
  busy: boolean;
  error: string;
  demo: boolean;
  signedIn: boolean;
  level: Level;
  load: () => Promise<void>;
  dispatch: (
    action: LanguageAction,
  ) => Promise<{ correct?: boolean; xp: number } | null>;
};
const Context = createContext<Context | null>(null);
export function useLanguage() {
  const c = useContext(Context);
  if (!c) throw Error("LanguageProvider missing");
  return c;
}
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialLanguageState),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [demo, setDemo] = useState(false),
    [signedIn, setSignedIn] = useState(false);
  const [level, setLevel] = useState<Level>("A1");
  const revision = useRef(0),
    current = useRef(state),
    lock = useRef(false);
  const path = usePathname();
  const load = useCallback(async () => {
    setError("");
    try {
      const query = new URLSearchParams(window.location.search).get("demo");
      const local =
        query === "1" ||
        (query !== "0" && sessionStorage.getItem("qd-demo") === "1");
      setDemo(local);
      if (local) {
        const qRaw = localStorage.getItem("qd-qlevel-demo-v1");
        try {
          setLevel(
            learnerLevel(
              qRaw ? JSON.parse(qRaw).history?.at(-1)?.level : undefined,
            ),
          );
        } catch {
          setLevel("A1");
        }
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : initialLanguageState();
        if (parsed.version !== 1 || !parsed.vocabulary || !parsed.lessons)
          throw Error("Демо прогресс жарамсыз.");
        current.current = parsed;
        setState(parsed);
        revision.current = 0;
        setSignedIn(false);
      } else {
        const res = await fetch("/api/literary", { cache: "no-store" });
        const b = await res.json();
        setSignedIn(b.signedIn === true);
        setLevel(learnerLevel(b.level));
        if (res.status === 401) {
          current.current = initialLanguageState();
          setState(current.current);
        } else {
          if (!res.ok) throw Error(b.error);
          revision.current = b.revision;
          current.current = b.state;
          setState(b.state);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сөздік жүктелмеді.");
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load, path]);
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key === key) void load();
    };
    const refresh = () => void load();
    window.addEventListener("storage", changed);
    window.addEventListener("qd-language-refresh", refresh);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("qd-language-refresh", refresh);
    };
  }, [load]);
  async function dispatch(action: LanguageAction) {
    if (lock.current) return null;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      let out: { state: LanguageState; xp: number; correct?: boolean };
      if (demo) {
        out = applyLanguageAction(current.current, action);
        localStorage.setItem(key, JSON.stringify(out.state));
        if (out.xp) {
          const raw = localStorage.getItem("qazaqdos-learning-demo-v1");
          if (raw) {
            const learning = JSON.parse(raw);
            learning.progress.xp += out.xp;
            learning.progress.xpTransactions.push({
              id: crypto.randomUUID(),
              amount: out.xp,
              date: new Date().toISOString(),
              reason: "Әдебиет сабағы",
            });
            localStorage.setItem(
              "qazaqdos-learning-demo-v1",
              JSON.stringify(learning),
            );
          }
        }
      } else {
        const res = await fetch("/api/literary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, revision: revision.current }),
        });
        const b = await res.json();
        if (!res.ok) throw Error(b.error);
        revision.current = b.revision;
        out = b;
      }
      current.current = out.state;
      setState(out.state);
      if (out.xp) window.dispatchEvent(new Event("qd-language-reward"));
      return { correct: out.correct, xp: out.xp };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сақтау орындалмады.");
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        busy,
        error,
        demo,
        signedIn,
        level,
        load,
        dispatch,
      }}
    >
      {children}
    </Context.Provider>
  );
}
