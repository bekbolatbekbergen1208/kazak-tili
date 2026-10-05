"use client";
import { useEffect, useState } from "react";
import type { CorpusItem, Chunk } from "@/lib/literary/types";
import { rights } from "@/lib/literary/types";
const blank: Partial<CorpusItem> = {
  title: "",
  author: "",
  source_type: "educational",
  copyright_status: "teacher_created",
  license: "",
  rights_evidence: "",
  level: "A2",
  genre: "оқу мәтіні",
  style: "daily",
  topic: "оқу",
  region: "Қазақстан",
  age_group: "school",
  text: "",
  keywords: [],
  quality_score: 80,
  language_quality: 80,
  educational_value: 80,
  age_suitability: 100,
};
export default function CorpusAdmin() {
  const [items, setItems] = useState<CorpusItem[]>([]),
    [draft, setDraft] = useState<Partial<CorpusItem>>(blank),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [chunks, setChunks] = useState<Chunk[]>([]),
    [rightsConfirmed, setRightsConfirmed] = useState(false),
    [embeddingConfigured, setEmbeddingConfigured] = useState(false);
  async function load() {
    setError("");
    try {
      const res = await fetch("/api/literary/admin", { cache: "no-store" });
      const b = await res.json();
      if (!res.ok) throw Error(b.error);
      setItems(b.items);
      setEmbeddingConfigured(b.embeddingConfigured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Корпус ашылмады.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/literary/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const b = await res.json();
      if (!res.ok) throw Error(b.error);
      if (b.chunks && Array.isArray(b.chunks)) setChunks(b.chunks);
      else {
        setMessage("Сақталды.");
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сақталмады.");
    } finally {
      setBusy(false);
    }
  }
  const set = (key: keyof CorpusItem, value: unknown) =>
    setDraft((s) => ({ ...s, [key]: value }));
  return (
    <main className="page lit-page">
      <header className="lit-heading">
        <div>
          <span className="overline">QAZAQ LITERARY INTELLIGENCE LAYER</span>
          <h1>Қазақ тілі корпусы</h1>
          <p>
            Тек құқықтары анық әрі мақұлданған материал өндірістік іздеуге
            өтеді.
          </p>
        </div>
      </header>
      <div className="lit-notice">
        Белгісіз құқықтар, шектелген мәтіндер және рұқсатсыз толық кітап
        қабылданбайды. «Қысқа үзінді» де дереккөз бен қолдануға рұқсат дәлелін
        талап етеді.
      </div>
      <button
        className="btn ghost"
        disabled={busy}
        onClick={() => void action({ action: "seed" })}
      >
        Жобаға арналған оқу мәтіндерін қосу
      </button>
      <p>
        {embeddingConfigured
          ? "Embedding моделі бапталған."
          : "Embedding моделі бапталмаған: мақұлданған корпус бойынша сөздік іздеу жұмыс істейді."}
      </p>
      {error && (
        <p role="alert" className="lit-error">
          {error}
        </p>
      )}
      <p role="status">{message}</p>
      <section className="lit-panel">
        <h2>{draft.id ? "Материалды өңдеу" : "Жаңа дереккөз"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action({
              action: "save",
              item: draft,
              revision: draft.revision ?? 0,
            });
          }}
        >
          <div className="lit-admin-fields">
            {[
              ["title", "Атауы"],
              ["author", "Автор / жасаушы"],
              ["license", "Лицензия"],
              ["rights_evidence", "Құқық дәлелі / рұқсат сілтемесі"],
              ["genre", "Жанр"],
              ["topic", "Тақырып"],
              ["region", "Өңір"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  value={String(draft[key as keyof CorpusItem] ?? "")}
                  onChange={(e) => set(key as keyof CorpusItem, e.target.value)}
                />
              </label>
            ))}
            <label>
              Құқық мәртебесі
              <select
                value={draft.copyright_status}
                onChange={(e) => set("copyright_status", e.target.value)}
              >
                {rights.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Дереккөз түрі
              <select
                value={draft.source_type}
                onChange={(e) => set("source_type", e.target.value)}
              >
                {["educational", "dictionary", "literature", "teacher"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Деңгей
              <select
                value={draft.level}
                onChange={(e) => set("level", e.target.value)}
              >
                {["A0", "A1", "A2", "B1", "B2", "C1"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Стиль
              <select
                value={draft.style}
                onChange={(e) => set("style", e.target.value)}
              >
                {[
                  "simple",
                  "daily",
                  "academic",
                  "literary",
                  "formal",
                  "friendly",
                  "storytelling",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Жас тобы
              <select
                value={draft.age_group}
                onChange={(e) => set("age_group", e.target.value)}
              >
                {["all", "school", "adult"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {[
              ["quality_score", "Жалпы сапа"],
              ["language_quality", "Тіл сапасы"],
              ["educational_value", "Оқу құндылығы"],
              ["age_suitability", "Жасқа сәйкестік"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={Number(draft[key as keyof CorpusItem] ?? 0)}
                  onChange={(e) =>
                    set(key as keyof CorpusItem, Number(e.target.value))
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Тірек сөздер
            <input
              value={(draft.keywords ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "keywords",
                  e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <label>
            UTF-8 TXT мәтінін жүктеу
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  file.size > 100000 ||
                  !file.name.toLowerCase().endsWith(".txt")
                ) {
                  setError("100 KB-тан аспайтын TXT файлын таңдаңыз.");
                  return;
                }
                set("text", await file.text());
              }}
            />
          </label>
          <label>
            Оқу мәтіні
            <textarea
              rows={9}
              required
              maxLength={20000}
              value={draft.text ?? ""}
              onChange={(e) => set("text", e.target.value)}
            />
          </label>
          <p>
            <small>
              Сақтау материалды draft күйіне қайтарады және ескі embeddings-ті
              жарамсыз етеді. Мақұлдау бөлек орындалады.
            </small>
          </p>
          <button className="btn primary" disabled={busy}>
            Draft ретінде сақтау
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setDraft(blank);
              setChunks([]);
            }}
          >
            Жаңа материал
          </button>
        </form>
      </section>
      <section className="lit-panel">
        <h2>Құқық және мақұлдау кезегі</h2>
        <label>
          <input
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(e) => setRightsConfirmed(e.target.checked)}
          />{" "}
          Мақұлдайтын материалдың құқық дәлелін, жасқа сәйкестігін және тіл
          сапасын тексердім
        </label>
        {!items.length && <p>Корпус бос. Мәтін қосып, оны мақұлдаңыз.</p>}
        {items.map((item) => (
          <article className="lit-admin-item" key={item.id}>
            <div>
              <h3>{item.title}</h3>
              <p>
                {item.level} · {item.status} · {item.copyright_status} ·{" "}
                {item.license}
              </p>
              <small>{item.author}</small>
              <details>
                <summary>Құқық дәлелі</summary>
                <p>{item.rights_evidence}</p>
              </details>
            </div>
            <div className="lit-admin-actions">
              <button
                disabled={busy}
                onClick={() => {
                  setDraft(item);
                  setChunks([]);
                  setRightsConfirmed(false);
                }}
              >
                Өңдеу
              </button>
              <button
                disabled={busy}
                onClick={() => void action({ action: "preview", id: item.id })}
              >
                Бөліктерді қарау
              </button>
              <button
                disabled={busy || !rightsConfirmed}
                onClick={() =>
                  void action({
                    action: "approve",
                    id: item.id,
                    rightsConfirmed,
                  })
                }
              >
                Мақұлдау
              </button>
              <button
                disabled={busy}
                onClick={() => void action({ action: "reject", id: item.id })}
              >
                Қабылдамау
              </button>
              <button
                disabled={
                  busy || item.status !== "approved" || !embeddingConfigured
                }
                onClick={() => void action({ action: "rebuild", id: item.id })}
              >
                Embeddings жаңарту
              </button>
              <button
                disabled={busy}
                onClick={() => void action({ action: "delete", id: item.id })}
              >
                Жою
              </button>
            </div>
          </article>
        ))}
      </section>
      {chunks.length > 0 && (
        <section className="lit-panel">
          <h2>Корпус бөліктері</h2>
          {chunks.map((c) => (
            <blockquote key={c.id}>
              <small>
                #{c.position + 1} · {c.text.length} таңба
              </small>
              <p>{c.text}</p>
            </blockquote>
          ))}
        </section>
      )}
    </main>
  );
}
