"use client";
import { useEffect, useState } from "react";
import {
  Copy,
  ShieldCheck,
  UserPlus,
  Users,
  Send,
  Trash2,
  Ban,
  Share2,
} from "lucide-react";
import { safeMessages } from "@/lib/friends/system";
import { Mascot } from "@/components/icons";
import { useSearchParams } from "next/navigation";
type Mission = {
  id: string;
  title: string;
  target: number;
  a: number;
  b: number;
  total: number;
  complete: boolean;
};
type Friend = {
  id: string;
  username: string;
  points: number;
  level: { name: string; max: number };
  days: number;
  streak: { current: number; best: number };
  missions: Mission[];
  teamTasks: number;
  lastMessage?: { message?: string };
  freezeUsed?: boolean;
};
type Data = {
  enabled: boolean;
  code?: string;
  username?: string;
  invitePath?: string;
  requests?: { id: string; otherName: string; incoming: boolean }[];
  friends?: Friend[];
};
export function FriendsHub() {
  const invite = useSearchParams().get("invite") ?? "",
    [data, setData] = useState<Data | null>(null),
    [query, setQuery] = useState(invite),
    [username, setUsername] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load(action?: Record<string, unknown>) {
    setPending(true);
    setError("");
    try {
      const r = await fetch(
          "/api/friends",
          action
            ? {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action),
              }
            : { cache: "no-store" },
        ),
        b = await r.json();
      if (!r.ok) throw Error(b.error);
      setData(b);
      setUsername(b.username ?? "");
      if (action) setNotice("Әрекет орындалды.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Байланыс қатесі.");
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const url = data?.invitePath ? `${location.origin}${data.invitePath}` : "";
  if (!data && !error)
    return (
      <main className="fs-page" role="status">
        Достық байланыс жүктелуде…
      </main>
    );
  return (
    <section className="fs-page" lang="kk">
      <header className="fs-hero">
        <div>
          <span>ҚАУІПСІЗ ОҚУ СЕРІКТЕСТІГІ</span>
          <h1>Достық байланыс</h1>
          <p>
            Досыңмен қазақ тілін бірге үйрен, ортақ мақсаттарға жет. Ашық жеке
            чат жоқ.
          </p>
        </div>
        <div className="fs-orbit">
          <Mascot />
          <Users />
        </div>
      </header>
      {error && (
        <div className="fs-error" role="alert">
          <p>{error}</p>
          <button className="btn ghost" onClick={() => void load()}>
            Қайта жүктеу
          </button>
        </div>
      )}
      {data && !data.enabled ? (
        <div className="fs-start">
          <ShieldCheck />
          <h2>Жеке әрі қауіпсіз байланыс</h2>
          <p>
            Дос коды тек өзің бөліскен адамға көрінеді. Телефон, email, мекенжай
            және толық профиль көрсетілмейді.
          </p>
          <button
            className="btn primary"
            disabled={pending}
            onClick={() =>
              void load({
                type: "enable",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              })
            }
          >
            Дос кодын жасау
          </button>
        </div>
      ) : (
        data?.enabled && (
          <>
            <div className="fs-grid">
              <article className="fs-invite">
                <h2>Дос қосу</h2>
                <p>Жеке дос кодың</p>
                <div className="fs-code">
                  <code>{data.code}</code>
                  <button
                    aria-label="Кодты көшіру"
                    onClick={() => navigator.clipboard.writeText(data.code!)}
                  >
                    <Copy />
                  </button>
                </div>
                <label>
                  Шақыру сілтемесі
                  <input readOnly value={url} />
                </label>
                <button
                  className="btn ghost"
                  onClick={async () =>
                    navigator.share
                      ? navigator.share({ title: "QazaqDos дос шақыруы", url })
                      : navigator.clipboard.writeText(url)
                  }
                >
                  <Share2 /> Бөлісу
                </button>
                <details className="fs-qr">
                  <summary>QR-кодты көрсету</summary>
                  <img
                    src={`/api/friends/qr?code=${data.code}`}
                    alt="Дос шақыру сілтемесінің QR-коды"
                  />
                  <p>
                    Досың телефон камерасымен сканерлеп, сұрауды өзі растайды.
                  </p>
                </details>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void load({ type: "username", username });
                  }}
                >
                  <label>
                    Пайдаланушы атың
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      pattern="[a-z0-9_]{3,24}"
                      placeholder="qazaq_learner"
                    />
                  </label>
                  <button className="btn ghost" disabled={pending}>
                    Сақтау
                  </button>
                </form>
              </article>
              <article className="fs-add">
                <h2>Досыңды тап</h2>
                <p>8 таңбалы кодты немесе пайдаланушы атын енгіз.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void load({ type: "request", query });
                  }}
                >
                  <input
                    aria-label="Дос коды немесе пайдаланушы аты"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                    maxLength={64}
                  />
                  <button className="btn primary" disabled={pending}>
                    <UserPlus /> Сұрау жіберу
                  </button>
                </form>
                <p>
                  <ShieldCheck /> Достық екі жақ растағаннан кейін ғана ашылады.
                </p>
              </article>
            </div>
            {!!data.requests?.length && (
              <section className="fs-requests">
                <h2>Достық сұраулары</h2>
                {data.requests.map((r) => (
                  <article key={r.id}>
                    <div>
                      <strong>{r.otherName}</strong>
                      <p>
                        {r.incoming
                          ? "Саған оқу серіктестігін ұсынды"
                          : "Жауабы күтілуде"}
                      </p>
                    </div>
                    {r.incoming && (
                      <>
                        <button
                          className="btn primary"
                          onClick={() =>
                            void load({
                              type: "respond",
                              requestId: r.id,
                              decision: "accepted",
                            })
                          }
                        >
                          Қабылдау
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() =>
                            void load({
                              type: "respond",
                              requestId: r.id,
                              decision: "declined",
                            })
                          }
                        >
                          Қабылдамау
                        </button>
                      </>
                    )}
                  </article>
                ))}
              </section>
            )}
            <section className="fs-friends">
              <h2>Оқу серіктерім · {data.friends?.length ?? 0}</h2>
              {!data.friends?.length ? (
                <div className="fs-empty">
                  <Mascot />
                  <h3>Жеке оқу да толық әрі қызық</h3>
                  <p>Барлық сабақ, тарих және Vision достарсыз да ашық.</p>
                </div>
              ) : (
                data.friends.map((f) => (
                  <FriendCard key={f.id} f={f} pending={pending} act={load} />
                ))
              )}
            </section>
          </>
        )
      )}
      {notice && (
        <p className="fs-toast" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
function FriendCard({
  f,
  pending,
  act,
}: {
  f: Friend;
  pending: boolean;
  act: (a: Record<string, unknown>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    next = Number.isFinite(f.level.max) ? f.level.max + 1 - f.points : 0;
  return (
    <article
      className={`fs-friend fs-level-${f.level.name.replaceAll(" ", "-")}`}
    >
      <header>
        <span>🤝</span>
        <div>
          <h3>{f.username}</h3>
          <p>{f.level.name}</p>
        </div>
        <strong>{f.points} байланыс</strong>
      </header>
      <progress
        max={
          Number.isFinite(f.level.max)
            ? f.level.max + 1
            : Math.max(1000, f.points)
        }
        value={f.points}
      />
      <small>
        {next ? `Келесі бонусқа ${next} ұпай қалды` : "Ең жоғары деңгей"}
      </small>
      <div className="fs-metrics">
        <span>
          <b>{f.days}</b>бірге оқыған күн
        </span>
        <span>
          <b>{f.streak.current}</b>ортақ серия
        </span>
        <span>
          <b>{f.streak.best}</b>үздік серия
        </span>
        <span>
          <b>{f.teamTasks}</b>миссия
        </span>
      </div>
      <div className="fs-bonus">
        <strong>Деңгей бонусы ашылды ✦</strong>
        <span>
          {f.points >= 600
            ? "Сирек жиектеме · командалық белгі"
            : f.points >= 300
              ? "Досша эмоциясы · көгілдір жиектеме"
              : f.points >= 100
                ? "Оқу серігі белгісі · күлгін жиектеме"
                : "Ортақ миссияларға жол"}
        </span>
        <button
          className="btn ghost"
          disabled={pending || f.freezeUsed}
          onClick={() => void act({ type: "freeze", friendId: f.id })}
        >
          {f.freezeUsed
            ? "Серия сақтауы осы аптада қолданылды"
            : "Серияны сақтау"}
        </button>
      </div>
      <h4>Ортақ миссиялар</h4>
      {f.missions.map((m) => (
        <div className="fs-mission" key={m.id}>
          <strong>
            {m.complete ? "✓ " : ""}
            {m.title}
          </strong>
          <small>
            Сен: {m.a} · Досың: {m.b}
          </small>
          <span>
            {m.total}/{m.target}
          </span>
          <progress max={m.target} value={m.total} />
        </div>
      ))}
      <div className="fs-safe">
        <label>
          Қауіпсіз хабарлама
          <select id={`msg-${f.id}`}>
            {safeMessages.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button
          className="btn primary"
          disabled={pending}
          onClick={() => {
            const e = document.getElementById(
              `msg-${f.id}`,
            ) as HTMLSelectElement;
            void act({ type: "message", friendId: f.id, message: e.value });
          }}
        >
          <Send /> Жіберу
        </button>
        {f.lastMessage?.message && (
          <p>Соңғы реакция: «{f.lastMessage.message}»</p>
        )}
      </div>
      <button className="fs-manage" onClick={() => setOpen(!open)}>
        Достықты басқару
      </button>
      {open && (
        <div className="fs-danger">
          <button onClick={() => void act({ type: "remove", friendId: f.id })}>
            <Trash2 /> Алып тастау
          </button>
          <button onClick={() => void act({ type: "block", friendId: f.id })}>
            <Ban /> Бұғаттау
          </button>
        </div>
      )}
    </article>
  );
}
