"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  HistoryCity,
  HistoryObject,
  HistoryTask,
} from "@/lib/history/types";
import { historyCities } from "@/lib/history/catalog";
import {
  cityOpen,
  cityPercent,
  cityProgress,
  historyProgress,
  HISTORY_SECONDS,
} from "@/lib/history/state";
import { useLearning } from "@/components/learning/provider";
import { selectedCharacter } from "@/lib/characters/state";
import { CityScenery, HistoryArt } from "./art";
import { Dossha, HistoryHeader, HistoryModal, Traveler } from "./shared";
import { MovementPad, useMovement } from "./movement";
import { HistoryTaskGame } from "./task";

export function ArtifactCard({
  city,
  object,
}: {
  city: HistoryCity;
  object: HistoryObject;
}) {
  return (
    <div className="hs-artifact-detail">
      <div className="hs-artifact-model">
        <HistoryArt kind={object.kind} />
        <span className="hs-glint">✧</span>
      </div>
      <p className="hs-eyebrow">АНИМАЦИЯЛЫҚ ОҚУ КАРТОЧКАСЫ</p>
      <h3>{object.artifact}</h3>
      <p>{object.fact}</p>
      <div className="hs-word">
        <strong>{object.word.term}</strong>
        <p>{object.word.meaning}</p>
      </div>
      <a
        href={city.sources[object.source]?.url}
        target="_blank"
        rel="noreferrer"
      >
        Дереккөз: {city.sources[object.source]?.title} ↗
      </a>
    </div>
  );
}
export function HistoryCityLevel({ city }: { city: HistoryCity }) {
  const { state, dispatch, busy } = useLearning(),
    p = cityProgress(state, city.id);
  const [intro, setIntro] = useState(0),
    [object, setObject] = useState<HistoryObject | null>(null),
    [task, setTask] = useState<HistoryTask | null>(null),
    [message, setMessage] = useState("");
  const [clock, setClock] = useState(0),
    movement = useMovement(p.position);
  const open = cityOpen(state, city.id),
    f = p.final,
    active = !!f && !f.finishedAt;
  useEffect(() => {
    setClock(Date.now());
    if (!active) return;
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [active]);
  const remaining = f
    ? Math.max(
        0,
        Math.ceil(
          (Date.parse(f.startedAt) + HISTORY_SECONDS * 1000 - clock) / 1000,
        ),
      )
    : HISTORY_SECONDS;
  const next = historyCities.find((c) => c.previous === city.id),
    discovered = p.discovered.length === city.objects.length,
    tasksDone = p.tasks.length === city.tasks.length;
  const target = active
    ? city.objects.find((o) => o.id === f.targets[f.found.length])
    : undefined;
  async function interact(o: HistoryObject) {
    movement.moveTo({ x: o.point.x, y: Math.min(90, o.point.y + 12) });
    if (active) {
      if (remaining === 0) {
        setMessage("Уақыт аяқталды. Нәтижені көріп, қайта баста.");
        return;
      }
      const result = await dispatch({
        type: "history-final-find",
        cityId: city.id,
        objectId: o.id,
      });
      if (result) {
        const resultFinal = cityProgress(result, city.id).final!;
        setMessage(
          o.id === target?.id
            ? "Дәл таптың! Келесі белгіні қара."
            : "Бұл жолы басқа нысан керек. Сөздің мағынасына назар аудар.",
        );
        if (resultFinal.found.length === resultFinal.targets.length)
          await dispatch({ type: "history-final-finish", cityId: city.id });
      }
    } else {
      setObject(o);
      setMessage("");
    }
  }
  return (
    <section
      className={`hs-world ${historyProgress(state).night ? "hs-night" : ""}`}
      lang="kk"
    >
      <HistoryHeader title={city.name} subtitle={city.subtitle} />
      {!open ? (
        <div className="hs-empty">
          <h2>Бұл бағыт әлі ашылмады</h2>
          <p>
            {city.ready
              ? "Алдыңғы қаланың қорытынды іздеуін аяқта."
              : "Бұл қаланың сабағы әзірленуде."}
          </p>
          <Link className="hs-button" href="/learn/history">
            Картаға оралу
          </Link>
        </div>
      ) : !p.visited ? (
        <div className="hs-arrival">
          <HistoryArt kind={city.id === "turkistan" ? "dome" : "gate"} />
          <p className="hs-eyebrow">ЖАҢА САПАР</p>
          <h2>{city.name} сені күтеді</h2>
          <p>{city.era}</p>
          <Dossha>
            Кейіпкерің дайын! Қала қақпасынан кіріп, көне мұраның ізін бірге
            іздейік.
          </Dossha>
          <button
            className="hs-button"
            disabled={busy}
            onClick={() =>
              void dispatch({ type: "history-visit", cityId: city.id })
            }
          >
            Қалаға кіру →
          </button>
        </div>
      ) : !p.intro ? (
        <div className="hs-arrival">
          <HistoryArt kind={city.id === "turkistan" ? "dome" : "gate"} />
          <p className="hs-eyebrow">
            ДОСШАМЕН ТАНЫСУ · {intro + 1} / {city.intro.length}
          </p>
          <Dossha>{city.intro[intro]}</Dossha>
          <button
            className="hs-button"
            disabled={busy}
            onClick={() => {
              if (intro < city.intro.length - 1) setIntro((x) => x + 1);
              else void dispatch({ type: "history-intro", cityId: city.id });
            }}
          >
            {intro < city.intro.length - 1 ? "Келесі →" : "Зерттеуді бастау"}
          </button>
        </div>
      ) : (
        <>
          <div className="hs-steps" aria-label="Сапар кезеңдері">
            <span className="done">✓ Танысу</span>
            <span className={discovered ? "done" : "current"}>
              Зерттеу {p.discovered.length}/{city.objects.length}
            </span>
            <span className={tasksDone ? "done" : discovered ? "current" : ""}>
              Тапсырмалар {p.tasks.length}/{city.tasks.length}
            </span>
            <span className={p.completedAt ? "done" : active ? "current" : ""}>
              Қорытынды {p.completedAt ? "✓" : ""}
            </span>
          </div>
          <progress
            max={100}
            value={cityPercent(state, city.id)}
            aria-label="Қала прогресі"
          />
          {active && (
            <div className="hs-hunt" role="status">
              <div>
                <p className="hs-eyebrow">ҚОРЫТЫНДЫ · МҰРА ІЗДЕУШІСІ</p>
                <h2>
                  {remaining ? "Белгіні оқып, нысанды тап" : "Уақыт аяқталды"}
                </h2>
                <p>
                  {target
                    ? `«${target.word.meaning}» ұғымымен байланысты нысанды тап.`
                    : "Барлық нысан табылды!"}
                </p>
                <strong>
                  {f.found.length} / {f.targets.length} табылды
                </strong>
              </div>
              <span className="hs-clock" aria-label="Қалған секунд">
                {remaining} с
              </span>
              {(remaining === 0 || f.found.length === f.targets.length) && (
                <button
                  className="hs-button"
                  disabled={busy}
                  onClick={() =>
                    void dispatch({
                      type: "history-final-finish",
                      cityId: city.id,
                    })
                  }
                >
                  Нәтижені көру
                </button>
              )}
            </div>
          )}
          <div
            className={`hs-city-scene hs-scene-${city.id} ${active ? "hs-hunting" : ""}`}
            {...movement.sceneProps}
            role="region"
            aria-label={`${city.name} қаласын зерттеу`}
          >
            <CityScenery
              night={historyProgress(state).night}
              x={movement.point.x}
              y={movement.point.y}
            />
            {city.objects.map((o) => (
              <button
                key={o.id}
                className={`hs-hotspot ${p.discovered.includes(o.id) ? "is-found" : ""}`}
                disabled={busy}
                aria-label={o.title}
                data-object={o.id}
                style={{ left: `${o.point.x}%`, top: `${o.point.y}%` }}
                onClick={() => void interact(o)}
              >
                <HistoryArt kind={o.kind} />
                <strong>{o.title}</strong>
                <span className="hs-hotspot-mark">
                  {active ? "⌕" : p.discovered.includes(o.id) ? "✓" : "+"}
                </span>
              </button>
            ))}
            <Traveler point={movement.point} />
            <span className="hs-scene-label">
              {city.name} · шартты тарихи көрініс
            </span>
          </div>
          <MovementPad movement={movement} />
          <button
            className="hs-button hs-soft hs-save-position"
            disabled={busy}
            onClick={async () => {
              const result = await dispatch({
                type: "history-position",
                cityId: city.id,
                point: movement.point,
              });
              if (result) setMessage("Кейіпкердің орны сақталды.");
            }}
          >
            Тұрған орнымды сақтау
          </button>
          <Dossha>
            {message ||
              (active
                ? "Сөздің түсіндірмесін нысанмен байланыстыр. Үш нысанды 90 секундта табуға тырыс!"
                : discovered
                  ? "Бес нысанның сырын аштың! Енді білгенімізді ойынмен бекітейік."
                  : "Жарқыраған нысанды таңда. Қысқа деректі оқы да, оқу карточкасын дәптеріңе сақта. Жәдігердің өзін орнынан алмаймыз.")}
          </Dossha>
          <details className="hs-accessible-list">
            <summary>Нысандар тізімі · пернетақтамен таңдау</summary>
            <div className="hs-options">
              {city.objects.map((o) => (
                <button
                  key={o.id}
                  disabled={busy}
                  onClick={() => void interact(o)}
                >
                  {o.title}
                  {p.discovered.includes(o.id) ? " ✓" : ""}
                </button>
              ))}
            </div>
          </details>
          <div className="hs-section-title">
            <h2>Тарихты ойынмен таны</h2>
            <span>
              {p.tasks.length} / {city.tasks.length} аяқталды
            </span>
          </div>
          {!discovered && (
            <p>Тапсырмалар барлық нысанды зерттеген соң ашылады.</p>
          )}
          <div className="hs-task-grid">
            {city.tasks.map((t, i) => (
              <button
                key={t.id}
                className="hs-task-card"
                disabled={!discovered || active}
                onClick={() => {
                  movement.stop();
                  setTask(t);
                }}
              >
                <span>{["◷", "◈", "⌘", "☏"][i]}</span>
                <small>
                  {p.tasks.includes(t.id) ? "✓ АЯҚТАЛДЫ" : `ОЙЫН ${i + 1}`}
                </small>
                <h3>{t.title}</h3>
                <p>
                  {p.tasks.includes(t.id)
                    ? "Білгеніңді қайта қарап шық"
                    : "+15 XP · +3 тиын"}
                </p>
                <b>→</b>
              </button>
            ))}
          </div>
          {!p.completedAt && !active && (
            <div className="hs-final-card">
              <div>
                <p className="hs-eyebrow">СОҢҒЫ СЫНАҚ</p>
                <h2>Мұра іздеушісі</h2>
                <p>
                  Мағынасына қарап 3 нысанды 90 секундта тап. Әр әрекетте
                  реттілік өзгереді.
                </p>
                {f?.finishedAt && !f.passed && (
                  <p className="hs-hint">
                    Бұл жолы үлгермедің. Бұрынғы жетістігің сақталды. Қайта
                    байқап көр!
                  </p>
                )}
              </div>
              <button
                className="hs-button"
                disabled={!tasksDone || busy}
                onClick={async () => {
                  setMessage("");
                  setClock(Date.now());
                  await dispatch({
                    type: "history-final-start",
                    cityId: city.id,
                  });
                  document
                    .querySelector(".hs-city-scene")
                    ?.scrollIntoView({ block: "center" });
                }}
              >
                {f ? "Қайта іздеу" : "Қорытындыны бастау"}
              </button>
            </div>
          )}
          {p.completedAt && (
            <div className="hs-completed" role="status">
              <div className="hs-confetti" aria-hidden="true">
                ✦ · ✧ · ✦ · ✧ · ✦
              </div>
              <p className="hs-eyebrow">САПАР АЯҚТАЛДЫ</p>
              <h2>{city.badge}!</h2>
              <p>
                Досша: «Мұраны танып, жаңа сөздер үйрендің. Сенің зерттеуің
                келесі сапарға жол ашты!»
              </p>
              <div className="hs-reward-row">
                <span>+{city.reward.xp} XP</span>
                <span>+{city.reward.coins} 🪙</span>
                <span>+{city.reward.crystals} 💎</span>
                <span>🎁 {city.reward.itemTitle}</span>
              </div>
              <p>
                Белгі мен жәдігерлер тарих дәптеріне қосылды. Марапат бір рет
                беріледі.
              </p>
              <div className="hs-actions">
                <button
                  className="hs-button hs-soft"
                  disabled={busy}
                  onClick={async () => {
                    const result = await dispatch({
                      type: "equip",
                      characterId: selectedCharacter(state).id,
                      itemId: city.reward.itemId,
                    });
                    if (result) setMessage("Марапат кейіпкеріңе тағылды!");
                  }}
                >
                  Кейіпкерге тағу
                </button>
                <Link
                  className="hs-button hs-soft"
                  href="/learn/history/notebook"
                >
                  Тарих дәптерін ашу
                </Link>
                {next?.ready ? (
                  <Link
                    className="hs-button"
                    href={`/learn/history/${next.id}`}
                  >
                    {next.name} ашылды →
                  </Link>
                ) : (
                  <Link className="hs-button" href="/learn/history">
                    Картаға оралу
                  </Link>
                )}
              </div>
            </div>
          )}
          <details className="hs-sources">
            <summary>Тарихи дереккөздер</summary>
            <p>
              Көріністер мен диалогтар — оқу үшін жасалған үлгілер. Даталар мен
              тұжырымдарға арналған деректер:
            </p>
            <ul>
              {city.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      {object && (
        <HistoryModal title={object.title} onClose={() => setObject(null)}>
          <ArtifactCard city={city} object={object} />
          <Dossha>
            Жаңа сөзді дауыстап айтып көр. Бұл нысан қала тұрғындарының өмірі
            туралы не айтады?
          </Dossha>
          {p.discovered.includes(object.id) ? (
            <>
              <p className="hs-success">✓ Дәптеріңде сақталған</p>
              <button className="hs-button" onClick={() => setObject(null)}>
                Зерттеуді жалғастыру
              </button>
            </>
          ) : (
            <button
              className="hs-button"
              disabled={busy}
              onClick={async () => {
                const result = await dispatch({
                  type: "history-discover",
                  cityId: city.id,
                  objectId: object.id,
                });
                if (result) {
                  setMessage(
                    `«${object.artifact}» дәптерге қосылды! +5 XP · +1 тиын`,
                  );
                  setObject(null);
                }
              }}
            >
              Дәптерге сақтау · +5 XP
            </button>
          )}
        </HistoryModal>
      )}
      {task && (
        <HistoryModal title={task.title} onClose={() => setTask(null)}>
          <HistoryTaskGame
            key={task.id}
            task={task}
            cityId={city.id}
            onClose={() => setTask(null)}
          />
        </HistoryModal>
      )}
    </section>
  );
}
