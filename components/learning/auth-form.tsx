"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Logo, Mascot } from "@/components/icons";
export default function AuthForm({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
}) {
  const [register, setRegister] = useState(initialMode === "register"),
    [lang, setLang] = useState<"ru" | "en">("ru"),
    [nickname, setNickname] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [retryAt, setRetryAt] = useState(0),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    router = useRouter();
  const t = (ru: string, en: string) => (lang === "ru" ? ru : en);
  const retrySeconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
  const submitDisabled = busy || retrySeconds > 0;
  function friendlyError(value: unknown) {
    const text =
      value instanceof Error
        ? value.message
        : t(
            "Не удалось подключиться. Попробуйте снова.",
            "Could not connect. Please try again.",
          );
    const match = text.match(/after\s+(\d+)\s+seconds/i);
    if (match) {
      const seconds = Number(match[1]);
      if (Number.isFinite(seconds)) setRetryAt(Date.now() + seconds * 1000);
      return t(
        `Письмо уже отправлено. Подождите ${seconds} сек. и нажмите снова.`,
        `The email was already sent. Wait ${seconds} seconds and try again.`,
      );
    }
    if (/already registered|user already registered/i.test(text)) {
      return t(
        "Этот email уже зарегистрирован. Нажмите «Войти».",
        "This email is already registered. Choose “Sign in”.",
      );
    }
    return text;
  }
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
    if (retrySeconds > 0) {
      setError(
        t(
          `Подождите ${retrySeconds} сек. перед повторной отправкой.`,
          `Wait ${retrySeconds} seconds before trying again.`,
        ),
      );
      return;
    }
    if (register && nickname.trim().length < 2) {
      setError(
        t(
          "Введите имя: минимум 2 символа.",
          "Enter a name of at least 2 characters.",
        ),
      );
      return;
    }
    if (register && password !== confirmPassword) {
      setError(t("Пароли не совпадают.", "Passwords do not match."));
      return;
    }
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
              data: { nickname: nickname.trim() },
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
      setError(friendlyError(e));
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
          {register && (
            <label className="qd-field">
              {t("Ваше имя", "Your name")}
              <input
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={24}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
          )}
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
          {register && (
            <>
              <p className="qd-password-hint">
                {t("Не менее 8 символов.", "Use at least 8 characters.")}
              </p>
              <label className="qd-field">
                {t("Повторите пароль", "Confirm password")}
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </>
          )}
          <button className="btn primary" disabled={submitDisabled}>
            {retrySeconds > 0
              ? t(`Подождите ${retrySeconds} сек.`, `Wait ${retrySeconds}s`)
              : busy
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
            const next = !register;
            setRegister(next);
            setConfirmPassword("");
            setError("");
            setMessage("");
            router.replace(next ? "/register" : "/login");
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
