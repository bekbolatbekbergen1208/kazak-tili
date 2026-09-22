"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { Shell } from "@/components/shell";

type Review = {
  id: string;
  question: string;
  answer: string;
  learner_note: string | null;
  status: "review" | "corrected";
  teacher_correction: string | null;
  created_at: string;
};

export default function DosshaReview() {
  const [items, setItems] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai-friend/feedback", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Кезек ашылмады.");
      setItems(data.items ?? []);
      setDrafts(
        Object.fromEntries(
          (data.items ?? []).map((item: Review) => [
            item.id,
            item.teacher_correction ?? item.answer,
          ]),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Кезек ашылмады.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(item: Review) {
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch("/api/ai-friend/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, correction: drafts[item.id] }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Түзету сақталмады.");
      setItems((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: "corrected",
                teacher_correction: drafts[item.id],
              }
            : row,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Түзету сақталмады.");
    } finally {
      setBusy("");
    }
  }

  const pending = items.filter((item) => item.status === "review");
  const corrected = items.filter((item) => item.status === "corrected");
  return (
    <Shell role="teacher">
      <div className="teacherPage dossha-review-page">
        <header className="teacherTop">
          <div>
            <span className="demoTag">ТЕКСЕРІЛГЕН БІЛІМ</span>
            <h1>Досжанды дамыту</h1>
            <p>Қате жауаптарды түзетіп, білім қорына бекітіңіз</p>
          </div>
          <button
            className="btn ghost"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={16} /> Жаңарту
          </button>
        </header>
        <section className="dossha-review-summary">
          <div>
            <Sparkles />
            <span>
              <b>{pending.length}</b>
              <small>тексерілетін жауап</small>
            </span>
          </div>
          <div>
            <CheckCircle2 />
            <span>
              <b>{corrected.length}</b>
              <small>білім қорына қосылды</small>
            </span>
          </div>
        </section>
        {error && (
          <p className="dossha-review-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <section className="panel dossha-review-empty">
            Кезек жүктелуде…
          </section>
        ) : !items.length ? (
          <section className="panel dossha-review-empty">
            <CheckCircle2 />
            <h2>Қазір тексерілетін жауап жоқ</h2>
            <p>Оқушы “Қате” деп белгілеген жауаптар осы жерге келеді.</p>
          </section>
        ) : (
          <div className="dossha-review-list">
            {items.map((item) => (
              <article
                className={`panel dossha-review-card ${item.status}`}
                key={item.id}
              >
                <div className="dossha-review-status">
                  <span>
                    {item.status === "corrected"
                      ? "Бекітілді"
                      : "Тексеру керек"}
                  </span>
                  <time>
                    {new Date(item.created_at).toLocaleDateString("kk-KZ")}
                  </time>
                </div>
                <h3>Оқушы сұрағы</h3>
                <p>{item.question}</p>
                <h3>Досжанның жауабы</h3>
                <p className="dossha-old-answer">{item.answer}</p>
                {item.learner_note && (
                  <blockquote>Оқушы пікірі: {item.learner_note}</blockquote>
                )}
                <label htmlFor={`correction-${item.id}`}>
                  Мұғалім бекітетін дұрыс жауап
                </label>
                <textarea
                  id={`correction-${item.id}`}
                  rows={5}
                  maxLength={5000}
                  value={drafts[item.id] ?? ""}
                  disabled={item.status === "corrected" || busy === item.id}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                />
                {item.status === "review" && (
                  <button
                    className="btn primary"
                    disabled={
                      busy === item.id ||
                      (drafts[item.id]?.trim().length ?? 0) < 3
                    }
                    onClick={() => void approve(item)}
                  >
                    <CheckCircle2 size={17} />
                    {busy === item.id ? "Сақталуда…" : "Түзетуді бекіту"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
