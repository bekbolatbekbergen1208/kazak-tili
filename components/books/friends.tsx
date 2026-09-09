"use client";
import { useEffect, useState } from "react";
import { useLearning } from "@/components/learning/provider";
type Friend = {
  id: string;
  nickname: string;
  books: number;
  xp: number;
  me: boolean;
};
type FriendsData = { code: string | null; friends: Friend[] };
export function BookFriends() {
  const { demo, state } = useLearning();
  const [data, setData] = useState<FriendsData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function request(action?: Record<string, string>) {
    setPending(true);
    setError("");
    try {
      const res = await fetch(
        "/api/books/friends",
        action
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(action),
            }
          : { cache: "no-store" },
      );
      const body = await res.json();
      if (!res.ok)
        throw Error(body.error ?? "Рейтингті жүктеу мүмкін болмады.");
      setData(body);
      if (action?.type === "join") {
        setCode("");
        setMessage("Досың рейтингке қосылды.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Байланысты тексеріп, қайталап көр.",
      );
    } finally {
      setPending(false);
    }
  }
  useEffect(() => {
    if (!demo) void request();
  }, [demo]);
  return (
    <section className="panel bw-friends" aria-labelledby="friends-title">
      <span className="bw-eyebrow">БІРГЕ ОҚЫҒАН ҚЫЗЫҚ</span>
      <h2 id="friends-title">Достардың кітап лигасы</h2>
      <p>
        Шақыру коды арқылы қосыл. Достарыңа тек атың, аяқтаған кітап саны және
        кітаптан жинаған XP көрінеді.
      </p>
      {demo ? (
        <p>
          Демо режимінде жеке прогресс осы браузерде сақталады. Достар рейтингін
          пайдалану үшін аккаунтпен кір.
        </p>
      ) : (
        <>
          {error && (
            <>
              <p className="bw-friend-error" role="alert">
                {error}
              </p>
              <button
                className="btn ghost"
                disabled={pending}
                onClick={() => void request()}
              >
                Қайта жүктеу
              </button>
            </>
          )}
          {pending && !data && <p role="status">Жүктелуде…</p>}
          {data && !data.code && (
            <button
              className="btn primary"
              disabled={pending}
              onClick={() => void request({ type: "enable" })}
            >
              Лигаға қосылу
            </button>
          )}
          {data?.code && (
            <>
              <div className="bw-invite">
                <code>{data.code}</code>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(data.code!);
                      setMessage("Шақыру коды көшірілді.");
                    } catch {
                      setMessage("Кодты белгілеп, қолмен көшіріп ал.");
                    }
                  }}
                >
                  Кодты көшіру
                </button>
              </div>
              <form
                className="bw-friend-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void request({ type: "join", code: code.trim() });
                }}
              >
                <input
                  className="bw-friend-input"
                  aria-label="Досыңның шақыру коды"
                  placeholder="Досыңның коды"
                  minLength={12}
                  maxLength={12}
                  required
                  pattern="[a-fA-F0-9]{12}"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button className="btn primary" disabled={pending}>
                  Қосу
                </button>
              </form>
              <div aria-label="Достар рейтингі">
                {data.friends.map((f, i) => (
                  <div className="bw-friend-row" key={f.id}>
                    <b>{i + 1}</b>
                    <div>
                      <strong>
                        {f.me ? `${state.profile.nickname} · сен` : f.nickname}
                      </strong>
                      <small>
                        {f.books} кітап · {f.xp} XP
                      </small>
                    </div>
                    {!f.me && (
                      <button
                        disabled={pending}
                        onClick={() =>
                          void request({ type: "remove", friendId: f.id })
                        }
                        aria-label={`${f.nickname}: достардан алып тастау`}
                      >
                        Алып тастау
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {data.friends.length <= 1 && (
                <p>
                  Әзірге мұнда сен ғана барсың. Шақыру кодыңды досыңа жібер.
                </p>
              )}
            </>
          )}
          {message && <p role="status">{message}</p>}
        </>
      )}
    </section>
  );
}
