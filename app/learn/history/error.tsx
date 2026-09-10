"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="hs-world hs-empty" lang="kk">
      <h1>Сапарды жүктеу мүмкін болмады</h1>
      <p>Байланысты тексеріп, қайта байқап көр.</p>
      <button className="hs-button" onClick={reset}>
        Қайта жүктеу
      </button>
      <a href="/learn/history">Картаға оралу</a>
    </section>
  );
}
