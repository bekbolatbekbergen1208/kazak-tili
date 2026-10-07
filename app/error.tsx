"use client";
import Link from "next/link";
import { RouteState } from "@/components/ui/route-state";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteState title="Бетті аша алмадық">
      <p>Қайта жүктеп көр немесе басты бетке орал.</p>
      <div className="qd-actions">
        <button className="btn primary" onClick={reset}>
          Қайта көру
        </button>
        <Link href="/" className="btn ghost">
          Басты бет
        </Link>
      </div>
    </RouteState>
  );
}
