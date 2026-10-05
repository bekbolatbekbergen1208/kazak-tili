"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { nextTarget } from "@/lib/q-level/presentation";
import { useQLevel } from "./use-q-level";
import "./q-level.css";
const base = "/learn/q-level";
export function QLevelCard() {
  const q = useQLevel();
  return (
    <Link href={base} className="ql-dashboard">
      <div>
        <span className="overline">QAZAQDOS Q-LEVEL</span>
        <h2>
          {q.result ? `Q-Level ${q.result.level}` : "Қазақша деңгейің қандай?"}
        </h2>
        <p>
          {q.result
            ? `${q.result.score}/100 · Болжамды нәтиже`
            : "Деңгейіңді анықтап, жеке оқу жолыңды баста."}
        </p>
        {q.result && (
          <p>
            {nextTarget(q.result).level} деңгейіне дейін{" "}
            {nextTarget(q.result).remaining} Q-Point · дағды шектері ескеріледі
          </p>
        )}
      </div>
      <div className="ql-mini-ring">
        {q.result?.score ?? "Q"}
        <small>Q-Score</small>
      </div>
      <ArrowUpRight />
    </Link>
  );
}
