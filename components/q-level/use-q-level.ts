"use client";
import { useCallback, useEffect, useState } from "react";
import { useLearning } from "@/components/learning/provider";
import type {
  Attempt,
  PublicQuestion,
  Result,
  Review,
} from "@/lib/q-level/types";
export type Leader = {
  display_name: string;
  weekly_growth: number;
  monthly_growth: number;
  current_score: number;
  level: string;
};
export function useQLevel() {
  const { demo } = useLearning();
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState<Attempt | null>(null),
    [question, setQuestion] = useState<PublicQuestion | null>(null),
    [history, setHistory] = useState<Result[]>([]),
    [leaders, setLeaders] = useState<Leader[]>([]);
  const [review, setReview] = useState<Review[]>([]);
  const load = useCallback(async () => {
    setReady(false);
    setError("");
    setAttempt(null);
    setQuestion(null);
    setHistory([]);
    setReview([]);
    setLeaders([]);
    try {
      if (demo) {
        const raw = localStorage.getItem("qd-qlevel-demo-v1");
        if (raw) {
          const s = JSON.parse(raw);
          setAttempt(s.attempt ?? null);
          setQuestion(s.question ?? null);
          setHistory(s.history ?? []);
          setReview(s.review ?? []);
        }
      } else {
        const res = await fetch("/api/q-level", { cache: "no-store" });
        const s = await res.json();
        if (!res.ok) throw Error(s.error);
        setAttempt(s.attempt);
        setQuestion(s.question);
        setHistory(s.history);
        setLeaders(s.leaders);
        setReview(s.review ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Деректер жүктелмеді.");
    } finally {
      setReady(true);
    }
  }, [demo]);
  useEffect(() => {
    void load();
  }, [load]);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/q-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          demo,
          attempt: demo ? attempt : undefined,
        }),
      });
      const s = await res.json();
      if (!res.ok) throw Error(s.error);
      if (body.action !== "audio" && body.action !== "visibility") {
        const next = s.result
          ? [...history.filter((r) => r.id !== s.result.id), s.result]
          : history;
        setAttempt(s.attempt ?? null);
        setQuestion(s.question ?? null);
        setHistory(next);
        setReview(s.review ?? []);
        if (demo) {
          try {
            localStorage.setItem(
              "qd-qlevel-demo-v1",
              JSON.stringify({
                attempt: s.attempt,
                question: s.question,
                history: next,
                review: s.review ?? [],
              }),
            );
          } catch {
            setError("Браузер тестті сақтай алмады. Бетті жаппаңыз.");
          }
        }
      }
      if (s.result && !demo)
        window.dispatchEvent(new Event("qd-q-level-reward"));
      return s;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сақтау қатесі.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return {
    demo,
    ready,
    busy,
    error,
    attempt,
    question,
    history,
    leaders,
    review,
    action,
    load,
    result: history.at(-1) ?? null,
  };
}
