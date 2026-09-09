"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Logo, Mascot } from "@/components/icons";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import type { InterfaceLanguage } from "@/lib/learning/types";
export default function AuthForm({
  initialMode = "login",
}: {
  initialMode?: "login" | "register";
}) {
  const [register, setRegister] = useState(initialMode === "register"),
    [lang, setLang] = useState<InterfaceLanguage>("ru"),
    [nickname, setNickname] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [retryAt, setRetryAt] = useState(0),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    router = useRouter();
  const t = (copy: {
    ru: string;
    en: string;
    zh?: string;
    es?: string;
    de?: string;
    fr?: string;
  }) => localized(copy, lang);
  const retrySeconds = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
  const submitDisabled = busy || retrySeconds > 0;
  function friendlyError(value: unknown) {
    const text =
      value instanceof Error
        ? value.message
        : t({
            ru: "Не удалось подключиться. Попробуйте снова.",
            en: "Could not connect. Please try again.",
            zh: "无法连接。请再试一次。",
            es: "No se pudo conectar. Inténtalo de nuevo.",
            de: "Verbindung fehlgeschlagen. Bitte versuche es erneut.",
            fr: "Connexion impossible. Réessaie.",
          });
    const match = text.match(/after\s+(\d+)\s+seconds/i);
    if (match) {
      const seconds = Number(match[1]);
      if (Number.isFinite(seconds)) setRetryAt(Date.now() + seconds * 1000);
      return t({
        ru: `Письмо уже отправлено. Подождите ${seconds} сек. и нажмите снова.`,
        en: `The email was already sent. Wait ${seconds} seconds and try again.`,
        zh: `邮件已发送。请等待 ${seconds} 秒后再试。`,
        es: `El correo ya fue enviado. Espera ${seconds} segundos e inténtalo de nuevo.`,
        de: `Die E-Mail wurde bereits gesendet. Warte ${seconds} Sekunden und versuche es erneut.`,
        fr: `L’e-mail a déjà été envoyé. Attends ${seconds} secondes puis réessaie.`,
      });
    }
    if (/already registered|user already registered/i.test(text)) {
      return t({
        ru: "Этот email уже зарегистрирован. Нажмите «Войти».",
        en: "This email is already registered. Choose “Sign in”.",
        zh: "这个邮箱已注册。请选择“登录”。",
        es: "Este email ya está registrado. Elige “Entrar”.",
        de: "Diese E-Mail ist bereits registriert. Wähle „Anmelden“.",
        fr: "Cet e-mail est déjà inscrit. Choisis « Se connecter ».",
      });
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
        t({
          ru: `Подождите ${retrySeconds} сек. перед повторной отправкой.`,
          en: `Wait ${retrySeconds} seconds before trying again.`,
          zh: `请等待 ${retrySeconds} 秒后再试。`,
          es: `Espera ${retrySeconds} segundos antes de intentarlo de nuevo.`,
          de: `Warte ${retrySeconds} Sekunden, bevor du es erneut versuchst.`,
          fr: `Attends ${retrySeconds} secondes avant de réessayer.`,
        }),
      );
      return;
    }
    if (register && nickname.trim().length < 2) {
      setError(
        t({
          ru: "Введите имя: минимум 2 символа.",
          en: "Enter a name of at least 2 characters.",
          zh: "请输入至少 2 个字符的名字。",
          es: "Escribe un nombre de al menos 2 caracteres.",
          de: "Gib einen Namen mit mindestens 2 Zeichen ein.",
          fr: "Entre un nom d’au moins 2 caractères.",
        }),
      );
      return;
    }
    if (register && password !== confirmPassword) {
      setError(
        t({
          ru: "Пароли не совпадают.",
          en: "Passwords do not match.",
          zh: "两次密码不一致。",
          es: "Las contraseñas no coinciden.",
          de: "Die Passwörter stimmen nicht überein.",
          fr: "Les mots de passe ne correspondent pas.",
        }),
      );
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
          t({
            ru: "Проверьте почту и подтвердите адрес. Затем войдите в аккаунт.",
            en: "Check your email to confirm your address, then sign in.",
            zh: "请查看邮箱并确认地址，然后登录账号。",
            es: "Revisa tu correo y confirma la dirección. Luego entra en tu cuenta.",
            de: "Prüfe deine E-Mail und bestätige die Adresse. Melde dich danach an.",
            fr: "Vérifie ton e-mail et confirme l’adresse. Connecte-toi ensuite.",
          }),
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
          {interfaceLanguages.map((language) => (
            <button
              className="btn ghost"
              onClick={() => setLang(language.code)}
              aria-pressed={lang === language.code}
              key={language.code}
            >
              {language.nativeName}
            </button>
          ))}
        </div>
        <h1>
          {t({
            ru: register ? "Начнём путешествие" : "Қош келдің!",
            en: register ? "Start your journey" : "Welcome back!",
            zh: register ? "开始旅程" : "欢迎回来！",
            es: register ? "Empieza el viaje" : "¡Bienvenido de nuevo!",
            de: register ? "Starte deine Reise" : "Willkommen zurück!",
            fr: register ? "Commence le voyage" : "Bon retour !",
          })}
        </h1>
        <p>
          {t({
            ru: "Ваш личный маршрут к казахскому языку.",
            en: "Your personal path to learning Kazakh.",
            zh: "你的哈萨克语学习路线。",
            es: "Tu ruta personal para aprender kazajo.",
            de: "Dein persönlicher Weg zum Kasachischen.",
            fr: "Ton parcours personnel vers le kazakh.",
          })}
        </p>
        <form onSubmit={submit}>
          {register && (
            <label className="qd-field">
              {t({
                ru: "Ваше имя",
                en: "Your name",
                zh: "你的名字",
                es: "Tu nombre",
                de: "Dein Name",
                fr: "Ton nom",
              })}
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
            {t({
              ru: "Пароль",
              en: "Password",
              zh: "密码",
              es: "Contraseña",
              de: "Passwort",
              fr: "Mot de passe",
            })}
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
                {t({
                  ru: "Не менее 8 символов.",
                  en: "Use at least 8 characters.",
                  zh: "至少 8 个字符。",
                  es: "Usa al menos 8 caracteres.",
                  de: "Mindestens 8 Zeichen.",
                  fr: "Au moins 8 caractères.",
                })}
              </p>
              <label className="qd-field">
                {t({
                  ru: "Повторите пароль",
                  en: "Confirm password",
                  zh: "确认密码",
                  es: "Confirma la contraseña",
                  de: "Passwort bestätigen",
                  fr: "Confirme le mot de passe",
                })}
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
              ? t({
                  ru: `Подождите ${retrySeconds} сек.`,
                  en: `Wait ${retrySeconds}s`,
                  zh: `等待 ${retrySeconds} 秒`,
                  es: `Espera ${retrySeconds}s`,
                  de: `${retrySeconds}s warten`,
                  fr: `Attends ${retrySeconds}s`,
                })
              : busy
                ? t({
                    ru: "Подключаемся…",
                    en: "Connecting…",
                    zh: "正在连接…",
                    es: "Conectando…",
                    de: "Verbinden…",
                    fr: "Connexion…",
                  })
                : t({
                    ru: register ? "Зарегистрироваться" : "Войти",
                    en: register ? "Create account" : "Sign in",
                    zh: register ? "注册" : "登录",
                    es: register ? "Registrarse" : "Entrar",
                    de: register ? "Registrieren" : "Anmelden",
                    fr: register ? "S’inscrire" : "Se connecter",
                  })}
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
          {t({
            ru: register
              ? "Уже есть аккаунт? Войти"
              : "Нет аккаунта? Регистрация",
            en: register
              ? "Already registered? Sign in"
              : "New here? Create account",
            zh: register ? "已有账号？登录" : "还没有账号？注册",
            es: register
              ? "¿Ya tienes cuenta? Entrar"
              : "¿No tienes cuenta? Registrarse",
            de: register
              ? "Schon ein Konto? Anmelden"
              : "Neu hier? Konto erstellen",
            fr: register
              ? "Déjà un compte ? Se connecter"
              : "Nouveau ? Créer un compte",
          })}
        </button>
        <Link className="btn ghost" href="/learn?demo=1">
          {t({
            ru: "Попробовать без регистрации",
            en: "Try without an account",
            zh: "无需注册试用",
            es: "Probar sin cuenta",
            de: "Ohne Konto testen",
            fr: "Essayer sans compte",
          })}
        </Link>
        <details>
          <summary>
            {t({
              ru: "Исследовательское демо",
              en: "Research demo",
              zh: "研究演示",
              es: "Demo de investigación",
              de: "Forschungsdemo",
              fr: "Démo de recherche",
            })}
          </summary>
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
