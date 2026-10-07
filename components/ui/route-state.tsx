import type { ReactNode } from "react";
export function RouteState({
  title,
  children,
  loading = false,
}: {
  title: string;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <section
      className="journey-state"
      role={loading ? "status" : "alert"}
      aria-busy={loading}
    >
      <span className="journey-state-symbol" aria-hidden="true">
        {loading ? "◌" : "↻"}
      </span>
      <h1>{title}</h1>
      {children}
    </section>
  );
}
