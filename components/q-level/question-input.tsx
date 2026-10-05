"use client";
import { useEffect, useState } from "react";
import type { PublicQuestion } from "@/lib/q-level/types";
export function QuestionInput({
  question: q,
  value,
  onChange,
  disabled,
}: {
  question: PublicQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [ordered, setOrdered] = useState<string[]>(q.options ?? []);
  const [mapping, setMapping] = useState<string[]>([]);
  useEffect(() => {
    setOrdered(q.options ?? []);
    setMapping([]);
  }, [q.id]);
  if (q.type === "ordering")
    return (
      <div className="ql-options ql-ordering">
        <p>Элементтерді дұрыс ретке қой.</p>
        {ordered.map((item, i) => (
          <div key={item} className="ql-order-row">
            <span>
              {i + 1}. {item}
            </span>
            <button
              type="button"
              disabled={disabled || i === 0}
              aria-label={`${item}: жоғары`}
              onClick={() => {
                const next = [...ordered];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                setOrdered(next);
                onChange(JSON.stringify(next));
              }}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={disabled || i === ordered.length - 1}
              aria-label={`${item}: төмен`}
              onClick={() => {
                const next = [...ordered];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                setOrdered(next);
                onChange(JSON.stringify(next));
              }}
            >
              ↓
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(JSON.stringify(ordered))}
        >
          Ретті растау
        </button>
      </div>
    );
  if (q.type === "matching") {
    const choices = mapping;
    return (
      <div className="ql-options">
        {(q.options ?? []).map((_, i) => (
          <label key={i}>
            {" "}
            {i + 1}. сәйкестік
            <select
              disabled={disabled}
              value={choices[i] ?? ""}
              onChange={(e) => {
                const next = [...choices];
                next[i] = e.target.value;
                setMapping(next);
                onChange(
                  next.length === q.options!.length && next.every(Boolean)
                    ? JSON.stringify(next)
                    : "",
                );
              }}
            >
              <option value="">Таңда</option>
              {q.options?.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === "multiple-choice") {
    let selected: string[] = [];
    try {
      selected = JSON.parse(value || "[]");
    } catch {}
    return (
      <div className="ql-options">
        {q.options?.map((o) => (
          <label key={o}>
            <input
              type="checkbox"
              disabled={disabled}
              checked={selected.includes(o)}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...selected, o]
                  : selected.filter((x) => x !== o);
                onChange(next.length ? JSON.stringify(next) : "");
              }}
            />
            {o}
          </label>
        ))}
      </div>
    );
  }
  if (q.options)
    return (
      <div className="ql-options">
        {q.options.map((o, i) => (
          <button
            disabled={disabled}
            className={value === o ? "selected" : ""}
            key={o}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
    );
  return (
    <div className="ql-short-answer">
      <label>
        Қысқа жауап
        <input
          disabled={disabled}
          maxLength={500}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
