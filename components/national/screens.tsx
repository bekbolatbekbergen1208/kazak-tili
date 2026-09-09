"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "@/components/characters/character-art";
import { ItemIcon } from "@/components/characters/item-icon";
import { CharacterModal } from "@/components/characters/modal";
import { characterShop, shopItemById } from "@/lib/characters/config";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { national, statsFor } from "@/lib/national/state";
import { statLabels, crystalPrices, itemNames } from "@/lib/national/catalog";
import type { Stat } from "@/lib/national/types";
import { RewardPresentation } from "./reward-presentation";
import { NationalFrame } from "./shared";
import { NationalGame } from "./games";
export function NationalScreen({ screen }: { screen: string }) {
  if (screen === "asyk" || screen === "arqan")
    return <NationalGame kind={screen} />;
  if (screen === "character" || screen === "upgrade")
    return <CharacterScreen upgrade={screen === "upgrade"} />;
  if (screen === "shop") return <NationalShop />;
  if (screen === "daily") return <DailyScreen />;
  if (screen === "result") return <ResultScreen />;
  return <RewardsScreen />;
}
function CharacterScreen({ upgrade }: { upgrade: boolean }) {
  const { state, dispatch, busy } = useLearning(),
    character = selectedCharacter(state),
    stats = statsFor(state),
    n = national(state),
    [confirm, setConfirm] = useState<Stat | null>(null),
    [message, setMessage] = useState("");
  return (
    <NationalFrame title={upgrade ? "Кейіпкерді дамыту" : "Менің кейіпкерім"}>
      <div className="ng-grid">
        <section className="ng-card ng-character">
          <CharacterArt
            characterId={character.id}
            equipped={equipmentFor(state)}
            mood="waiting"
          />
          <h2>{character.name}</h2>
          <p>
            {1 + Math.floor(state.progress.xp / 200)}-деңгей ·{" "}
            {state.progress.xp} XP
          </p>
          <progress
            aria-label="Келесі деңгейге дейінгі прогресс"
            value={state.progress.xp % 200}
            max={200}
          />
          <p>Келесі деңгейге {200 - (state.progress.xp % 200)} XP</p>
          <Link href="/learn/characters" className="btn ghost">
            Кейіпкерді ауыстыру
          </Link>
        </section>
        <section className="ng-card">
          <h2>Қабілеттер</h2>
          {(Object.keys(statLabels) as Stat[]).map((stat) => (
            <div className="ng-stat" key={stat}>
              <div>
                <strong>
                  {statLabels[stat]} · {stats[stat]} / 5
                </strong>
                <p>
                  {stat === "strength"
                    ? "Арқан тартыста +1 күш / саты"
                    : stat === "accuracy"
                      ? "Бағыттау сызығы әр сатыда ұзарады"
                      : "Әр дұрыс ойын жауабына +1 XP / саты"}
                </p>
                <progress
                  aria-label={statLabels[stat]}
                  max={5}
                  value={stats[stat]}
                />
              </div>
              {upgrade && (
                <button
                  disabled={busy || stats[stat] >= 5}
                  className="btn ghost"
                  onClick={() => {
                    setMessage("");
                    if (n.crystals < (stats[stat] + 1) * 3)
                      setMessage("Сабақ орындап, көбірек кристалл жина");
                    else setConfirm(stat);
                  }}
                >
                  {stats[stat] >= 5
                    ? "Ең жоғары"
                    : `Дамыту · ${(stats[stat] + 1) * 3} 💎`}
                </button>
              )}
            </div>
          ))}
          <p>Жылдамдық: жауап беру шапшаңдығыңа байланысты.</p>
          <p>
            Ашылған қабілеттер: {stats.strength ? "күш бонусы · " : ""}
            {stats.accuracy ? "ұзын бағыттау сызығы · " : ""}
            {stats.knowledge ? "білім XP бонусы" : "негізгі қабілеттер"}
          </p>
          {!upgrade && (
            <Link className="btn primary" href="/learn/national/upgrade">
              Дамыту →
            </Link>
          )}
          <p role="status">{message}</p>
          <h3>Киімдер мен аксессуарлар</h3>
          <p>
            {Object.values(equipmentFor(state))
              .map((id) => itemNames[id] ?? shopItemById(id)?.title.ru ?? id)
              .join(" · ") || "Әзірге жабдық жоқ"}
          </p>
          <Link href="/learn/inventory">Киімдерді таңдау →</Link>
        </section>
      </div>
      {confirm && (
        <CharacterModal
          titleId="ng-upgrade-title"
          onClose={() => setConfirm(null)}
        >
          <h2 id="ng-upgrade-title">
            {statLabels[confirm]} қасиетін дамыту керек пе?
          </h2>
          <p>{(stats[confirm] + 1) * 3} кристалл жұмсалады.</p>
          <button
            disabled={busy}
            className="btn primary"
            onClick={async () => {
              const next = await dispatch({
                type: "national-upgrade",
                stat: confirm,
              });
              if (next) {
                setConfirm(null);
                setMessage("Жаңа қабілет ашылды! ✦");
              }
            }}
          >
            Растау
          </button>
          <button className="btn ghost" onClick={() => setConfirm(null)}>
            Бас тарту
          </button>
        </CharacterModal>
      )}
    </NationalFrame>
  );
}
function NationalShop() {
  const { state, dispatch, busy } = useLearning(),
    [itemId, setItemId] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    item = characterShop.find((i) => i.id === itemId);
  const names: Record<string, string> = {
    outfit: "Ұлттық киім",
    hat: "Бас киім",
    room: "Бөлме фоны",
    victory: "Жеңіс анимациясы",
    neck: "Мойын әшекейі",
    hand: "Қолдағы зат",
    skin: "Ерекше бейне",
    frame: "Жақтау",
    theme: "Түс тақырыбы",
    back: "Арқа аксессуары",
    eyewear: "Көзілдірік",
  };
  return (
    <NationalFrame title="Дүкен">
      <p>
        Тиынды сабақтар мен ойындардан жина. Кристалдарды кейіпкеріңді дамытуға
        жұмса.
      </p>
      <Link className="btn ghost" href="/learn/national/upgrade">
        💎 Қабілеттерді дамыту
      </Link>
      <p aria-live="polite">{message}</p>
      <div className="ng-grid ng-shop">
        {characterShop.map((i) => (
          <article className="ng-card" key={i.id}>
            <span
              className="ng-shop-art"
              style={{ background: i.color + "22", color: i.color }}
              aria-hidden="true"
            >
              <ItemIcon item={i} />
            </span>
            <h2>{itemNames[i.id] ?? names[i.slot ?? ""] ?? "Безендіру"}</h2>
            <p>
              {crystalPrices[i.id]
                ? `${crystalPrices[i.id]} 💎`
                : `${i.price} 🪙`}
            </p>
            <button
              className="btn ghost"
              disabled={busy || state.progress.inventory.includes(i.id)}
              onClick={() => {
                setMessage("");
                if (
                  crystalPrices[i.id]
                    ? national(state).crystals < crystalPrices[i.id]
                    : state.progress.coins < i.price
                )
                  setMessage("Сабақ орындап, көбірек тиын мен кристалл жина");
                else setItemId(i.id);
              }}
            >
              {state.progress.inventory.includes(i.id)
                ? "✓ Сатып алынды"
                : "Сатып алу"}
            </button>
          </article>
        ))}
      </div>
      <Link href="/learn/inventory" className="btn primary">
        Сатып алынған заттарды кию →
      </Link>
      {item && (
        <CharacterModal titleId="ng-buy-title" onClose={() => setItemId(null)}>
          <h2 id="ng-buy-title">Сатып алуды растайсың ба?</h2>
          <p>
            {crystalPrices[item.id]
              ? `${crystalPrices[item.id]} кристалл`
              : `${item.price} тиын`}{" "}
            жұмсалады.
          </p>
          <button
            disabled={busy}
            className="btn primary"
            onClick={async () => {
              if (
                await dispatch({
                  type: crystalPrices[item.id] ? "national-buy" : "buy",
                  itemId: item.id,
                })
              ) {
                setItemId(null);
                setMessage("✦ Жаңа зат ашылды! Киімдер бөлімінен киіп көр.");
              }
            }}
          >
            Растау
          </button>
          <button className="btn ghost" onClick={() => setItemId(null)}>
            Бас тарту
          </button>
        </CharacterModal>
      )}
    </NationalFrame>
  );
}
function DailyScreen() {
  const { state, dispatch, busy } = useLearning(),
    today = new Date().toISOString().slice(0, 10),
    daily = national(state).daily[today] ?? {
      games: 0,
      correct: 0,
      claimed: [],
    };
  const quests = [
    {
      id: "play" as const,
      title: "Екі ұлттық ойын аяқта",
      value: daily.games,
      target: 2,
    },
    {
      id: "words" as const,
      title: "Бес сұраққа дұрыс жауап бер",
      value: daily.correct,
      target: 5,
    },
    {
      id: "lesson" as const,
      title: "Бір сабақ аяқта",
      value: Object.values(state.progress.lessons).some(
        (l) => l.completedAt?.slice(0, 10) === today,
      )
        ? 1
        : 0,
      target: 1,
    },
  ];
  return (
    <NationalFrame title="Күнделікті тапсырмалар">
      <p className="ng-streak">
        🔥 {state.progress.streak.current} күндік серия
      </p>
      <p>Тапсырмалар күн сайын UTC 00:00 кезінде жаңарады.</p>
      <div className="ng-grid">
        {quests.map((q) => (
          <section className="ng-card" key={q.id}>
            <h2>{q.title}</h2>
            <progress
              aria-label={q.title}
              value={Math.min(q.value, q.target)}
              max={q.target}
            />
            <p>
              {Math.min(q.value, q.target)} / {q.target} · 15 XP · 25 🪙 · 1 💎
            </p>
            <button
              className="btn primary"
              disabled={
                busy || q.value < q.target || daily.claimed.includes(q.id)
              }
              onClick={() =>
                void dispatch({ type: "national-daily", quest: q.id })
              }
            >
              {daily.claimed.includes(q.id) ? "✓ Алынды" : "Марапатты алу"}
            </button>
          </section>
        ))}
      </div>
    </NationalFrame>
  );
}
function ResultScreen() {
  const { state } = useLearning(),
    params = useSearchParams(),
    results = national(state).results,
    id = params.get("id"),
    result = id ? results.find((r) => r.id === id) : results.at(-1);
  return (
    <NationalFrame title="Ойын нәтижесі">
      {!result ? (
        <div className="ng-card">
          <h2>Әлі ойын аяқталған жоқ</h2>
          <Link href="/learn/national">Алғашқы ойынды таңда →</Link>
        </div>
      ) : (
        <section className="ng-card ng-result">
          <CharacterArt
            characterId={selectedCharacter(state).id}
            equipped={equipmentFor(state)}
            mood={result.won ? "victory" : "support"}
          />
          <h2>
            {result.won
              ? "Жарайсың! Жеңіске жеттің!"
              : "Жақсы жаттығу! Қайта байқап көр."}
          </h2>
          <p>
            {result.score} ұпай · {result.correct} дұрыс жауап
          </p>
          <RewardPresentation reward={result.reward} />
          {!result.reward.xp && (
            <p>Бүгінгі үш марапат алынды. Бұл ойын — жаттығу.</p>
          )}
          <Link className="btn primary" href={`/learn/national/${result.kind}`}>
            Қайта ойнау
          </Link>
          <Link className="btn ghost" href="/learn/national">
            Ауылға қайту
          </Link>
        </section>
      )}
    </NationalFrame>
  );
}
function RewardsScreen() {
  const { state } = useLearning(),
    n = national(state);
  const rows = [
    ...n.rewards,
    ...state.progress.coinTransactions
      .filter((t) => !n.rewards.some((r) => r.id === t.id))
      .map((t) => ({
        id: t.id,
        title:
          t.reason === "shop"
            ? "Дүкен"
            : t.reason === "lesson"
              ? "Сабақ"
              : "Оқу марапаты",
        date: t.date,
        coins: t.amount,
        crystals: 0,
        xp:
          state.progress.xpTransactions.find((x) => x.id === t.id)?.amount ?? 0,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <NationalFrame title="Марапаттар тарихы">
      {rows.length === 0 ? (
        <div className="ng-card">
          <h2>Алғашқы марапатың сені күтуде</h2>
          <Link href="/learn/map">Сабақты бастау →</Link>
        </div>
      ) : (
        <div className="ng-card ng-history">
          <table>
            <caption>Тиын, XP және кристалл қозғалысы</caption>
            <thead>
              <tr>
                <th>Марапат</th>
                <th>Күні</th>
                <th>Тиын</th>
                <th>XP</th>
                <th>Кристалл</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.title}
                    {r.id.startsWith("game-") && (
                      <Link
                        href={`/learn/national/result?id=${encodeURIComponent(r.id.slice(5))}`}
                      >
                        {" "}
                        · Нәтиже
                      </Link>
                    )}
                  </td>
                  <td>{new Date(r.date).toLocaleDateString("kk-KZ")}</td>
                  <td>{r.coins}</td>
                  <td>{r.xp}</td>
                  <td>{r.crystals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </NationalFrame>
  );
}
