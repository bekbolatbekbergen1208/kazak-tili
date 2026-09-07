"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page">
      <h1>Не удалось открыть страницу / Could not open page</h1>
      <button className="btn primary" onClick={reset}>
        Повторить / Retry
      </button>
    </div>
  );
}
