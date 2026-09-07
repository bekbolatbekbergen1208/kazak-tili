"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Logo, Mascot } from "@/components/icons";
export default function AuthForm() {
  const [register, setRegister] = useState(false),
    [lang, setLang] = useState<"ru" | "en">("ru"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    router = useRouter();
  const t = (ru: string, en: string) => (lang === "ru" ? ru : en);
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("error") ===
      "confirmation"
    ) {
      setError(
        "Ссылка подтверждения недействительна или истекла. Войдите, если адрес уже подтверждён. / The confirmation link is invalid or expired. Sign in if your email is already confirmed.",
      );
    }
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const db = createClient();
      const { data, error } = register
        ? await db.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await db.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (data.session) {
        sessionStorage.removeItem("qd-demo");
        router.push("/learn?demo=0");
        router.refresh();
      } else
        setMessage(
          t(
            "Проверьте почту и подтвердите адрес. Затем войдите в аккаунт.",
            "Check your email to confirm your address, then sign in.",
          ),
        );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t(
              "Не удалось подключиться. Попробуйте снова.",
              "Could not connect. Please try again.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="loginPage qd-auth" lang={lang}>
      <Link href="/">
        <Logo />
      </Link>
      <div className="loginCard">
        <div className="loginMascot">
          <Mascot />
        </div>
        <div className="qd-actions">
          <button
            className="btn ghost"
            onClick={() => setLang("ru")}
            aria-pressed={lang === "ru"}
          >
            Русский
          </button>
          <button
            className="btn ghost"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            English
          </button>
        </div>
        <h1>
          {t(
            register ? "Начнём путешествие" : "Қош келдің!",
            register ? "Start your journey" : "Welcome back!",
          )}
        </h1>
        <p>
          {t(
            "Ваш личный маршрут к казахскому языку.",
            "Your personal path to learning Kazakh.",
          )}
        </p>
        <form onSubmit={submit}>
          <label className="qd-field">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="qd-field">
            {t("Пароль", "Password")}
            <input
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn primary" disabled={busy}>
            {busy
              ? t("Подключаемся…", "Connecting…")
              : t(
                  register ? "Зарегистрироваться" : "Войти",
                  register ? "Create account" : "Sign in",
                )}
          </button>
        </form>
        {error && (
          <p role="alert" className="qd-error">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button
          className="btn ghost"
          onClick={() => {
            setRegister(!register);
            setError("");
            setMessage("");
          }}
        >
          {t(
            register ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Регистрация",
            register
              ? "Already registered? Sign in"
              : "New here? Create account",
          )}
        </button>
        <Link className="btn ghost" href="/learn?demo=1">
          {t("Попробовать без регистрации", "Try without an account")}
        </Link>
        <details>
          <summary>{t("Исследовательское демо", "Research demo")}</summary>
          <Link className="roleCard" href="/student">
            Оқушы · эксперимент
          </Link>
          <Link className="roleCard" href="/student/control">
            Оқушы · бақылау
          </Link>
          <Link className="roleCard" href="/teacher">
            Мұғалім / зерттеуші
          </Link>
        </details>
      </div>
    </div>
  );
}
