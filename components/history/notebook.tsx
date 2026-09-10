"use client";
import Link from "next/link";
import { useState } from "react";
import {
  historyCities,
  historianRanks,
  readyHistoryCities,
} from "@/lib/history/catalog";
import {
  cityOpen,
  cityPercent,
  cityProgress,
  historyProgress,
  historyRank,
} from "@/lib/history/state";
import { useLearning } from "@/components/learning/provider";
import { HistoryHeader, HistoryModal, Dossha } from "./shared";
import { HistoryArt } from "./art";
import { ArtifactCard } from "./city";
export function HistoryNotebook() {
  const { state } = useLearning(),
    rank = historyRank(state);
  const artifacts = historyCities.flatMap((city) =>
    city.objects
      .filter((o) => cityProgress(state, city.id).discovered.includes(o.id))
      .map((object) => ({ city, object })),
  );
  const [selected, setSelected] = useState<(typeof artifacts)[number] | null>(
    null,
  );
  const visited = historyCities.filter(
      (c) => cityProgress(state, c.id).visited,
    ),
    next = historyCities.find(
      (c) => cityOpen(state, c.id) && !cityProgress(state, c.id).completedAt,
    );
  return (
    <section
      className={`hs-world ${historyProgress(state).night ? "hs-night" : ""}`}
      lang="kk"
    >
      <HistoryHeader
        title="Менің тарих дәптерім"
        subtitle="Әр сапар — жаңа дерек. Әр жәдігер — өткенге ашылған терезе."
      />
      <div className="hs-notebook-summary">
        <div>
          <p className="hs-eyebrow">ТАРИХШЫ ДЕҢГЕЙІ</p>
          <h2>{rank.title}</h2>
          <p>
            {visited.length} қалаға бардың · {artifacts.length} жәдігер
            карточкасы · {rank.count} белгі
          </p>
          <progress
            max={readyHistoryCities.length}
            value={rank.count}
            aria-label="Зерттелген дайын қалалар"
          />
          <p>
            {rank.count} / {readyHistoryCities.length} дайын қала толық
            зерттелді
          </p>
        </div>
        <div className="hs-ranks">
          {historianRanks.map((r, i) => (
            <span key={r} className={i <= rank.index ? "unlocked" : ""}>
              {i <= rank.index ? "✦" : "◇"} {r}
              <small>
                {
                  [
                    "Сапарды баста",
                    "1 қала",
                    "2 қала",
                    "3 қала",
                    "10 қала · кейінгі бағыттармен",
                  ][i]
                }
              </small>
            </span>
          ))}
        </div>
      </div>
      <Dossha>
        {next
          ? `Келесі мақсат — ${next.name}. ${cityPercent(state, next.id)}% зерттелді. Жаңа сөздеріңді қайталап, жолға шығайық!`
          : "Алғашқы үш қаланы аяқтадың! Жиналған деректерді қайта қарап, мұра туралы өз әңгімеңді құрастыр. Келесі бағыттар әзірленуде."}
      </Dossha>
      {next && (
        <Link className="hs-button" href={`/learn/history/${next.id}`}>
          {next.name} қаласына бару →
        </Link>
      )}
      <h2>Зерттелген қалалар</h2>
      {visited.length === 0 ? (
        <div className="hs-empty">
          <p>Дәптерің әзірге бос. Алғашқы сапарың Отырардан басталады.</p>
          <Link className="hs-button" href="/learn/history/otyrar">
            Отырарға бару
          </Link>
        </div>
      ) : (
        <div className="hs-city-list">
          {visited.map((c) => (
            <Link key={c.id} href={`/learn/history/${c.id}`}>
              <span>{c.icon}</span>
              <div>
                <strong>{c.name}</strong>
                <small>
                  {cityPercent(state, c.id)}% ·{" "}
                  {cityProgress(state, c.id).completedAt
                    ? c.badge
                    : "Зерттеліп жатыр"}
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
      <h2>
        Жәдігерлер коллекциясы{" "}
        <small>
          {artifacts.length} /{" "}
          {readyHistoryCities.reduce((n, c) => n + c.objects.length, 0)}
        </small>
      </h2>
      {!artifacts.length ? (
        <p className="hs-empty">
          Қаладағы нысанды зерттеп, алғашқы оқу карточкасын сақта.
        </p>
      ) : (
        <div className="hs-artifact-grid">
          {artifacts.map((item) => (
            <button
              key={`${item.city.id}-${item.object.id}`}
              onClick={() => setSelected(item)}
            >
              <HistoryArt kind={item.object.kind} />
              <small>{item.city.name}</small>
              <strong>{item.object.artifact}</strong>
              <span>Жақынырақ қарау ↗</span>
            </button>
          ))}
        </div>
      )}
      <h2>Тұлғалар мен меңгерілген тақырыптар</h2>
      <div className="hs-topics">
        {visited.map((c) => (
          <article key={c.id}>
            <h3>{c.name}</h3>
            {cityProgress(state, c.id).tasks.length ? (
              <>
                <ul>
                  {c.tasks
                    .filter((t) =>
                      cityProgress(state, c.id).tasks.includes(t.id),
                    )
                    .map((t) => (
                      <li key={t.id}>✓ {t.title}</li>
                    ))}
                </ul>
                {c.people.map((p) => (
                  <div key={p.name}>
                    <strong>{p.name}</strong>
                    <p>{p.text}</p>
                  </div>
                ))}
                <a href={c.sources[0].url} target="_blank" rel="noreferrer">
                  Дереккөз ↗
                </a>
              </>
            ) : (
              <p>
                Тұлғалар мен тақырыптар қала тапсырмаларын орындаған соң
                ашылады.
              </p>
            )}
          </article>
        ))}
      </div>
      {selected && (
        <HistoryModal
          title={selected.object.title}
          onClose={() => setSelected(null)}
        >
          <ArtifactCard city={selected.city} object={selected.object} />
        </HistoryModal>
      )}
    </section>
  );
}
