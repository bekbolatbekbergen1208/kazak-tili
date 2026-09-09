"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { goals } from "@/lib/learning/content";
import { interfaceLanguages, localized } from "@/lib/learning/languages";
import { useLearning } from "./provider";
import { Logo } from "@/components/icons";
import Link from "next/link";
import { Companion } from "./frame";
export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { state, dispatch, busy, logout } = useLearning(),
    [profile, setProfile] = useState(state.profile),
    [step, setStep] = useState(onboarding ? 1 : 2),
    [saved, setSaved] = useState(false),
    router = useRouter();
  const t = (copy: {
    ru: string;
    en: string;
    zh?: string;
    es?: string;
    de?: string;
    fr?: string;
  }) => localized(copy, profile.language);
  async function save() {
    const s = await dispatch({
      type: "profile",
      profile: { ...profile, onboarded: true },
    });
    if (s) {
      setSaved(true);
      if (onboarding) router.replace("/learn");
    }
  }
  return (
    <main className="page qd-profile">
      <Logo />
      {!onboarding && (
        <>
          <Companion context="profile" />
          <Link className="btn ghost" href="/learn/characters">
            {t({
              ru: "Менің кейіпкерлерім · Мои персонажи",
              en: "Менің кейіпкерлерім · My companions",
              zh: "Менің кейіпкерлерім · 我的伙伴",
              es: "Менің кейіпкерлерім · Mis compañeros",
              de: "Менің кейіпкерлерім · Meine Begleiter",
              fr: "Менің кейіпкерлерім · Mes compagnons",
            })}
          </Link>
        </>
      )}
      <span className="pill">{onboarding ? `${step} / 2` : "QazaqDos"}</span>
      <h1>
        {step === 1
          ? t({
              ru: "Как вам удобнее учиться?",
              en: "How would you like to learn?",
              zh: "你想怎样学习？",
              es: "¿Cómo prefieres aprender?",
              de: "Wie möchtest du lernen?",
              fr: "Comment veux-tu apprendre ?",
            })
          : t({
              ru: onboarding ? "Что вас вдохновляет?" : "Настройки обучения",
              en: onboarding ? "What inspires you?" : "Learning settings",
              zh: onboarding ? "什么激励你？" : "学习设置",
              es: onboarding ? "¿Qué te inspira?" : "Ajustes de aprendizaje",
              de: onboarding ? "Was motiviert dich?" : "Lerneinstellungen",
              fr: onboarding
                ? "Qu’est-ce qui t’inspire ?"
                : "Paramètres d’apprentissage",
            })}
      </h1>
      <p>
        {t({
          ru: "Казахский язык — шаг за шагом, в вашем ритме.",
          en: "Kazakh, step by step, at your own pace.",
          zh: "按照你的节奏，一步一步学习哈萨克语。",
          es: "Kazajo paso a paso, a tu ritmo.",
          de: "Kasachisch Schritt für Schritt, in deinem Tempo.",
          fr: "Le kazakh pas à pas, à ton rythme.",
        })}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) setStep(2);
          else void save();
        }}
      >
        <fieldset>
          <legend>
            {t({
              ru: "Язык объяснений",
              en: "Explanation language",
              zh: "说明语言",
              es: "Idioma de explicación",
              de: "Erklärungssprache",
              fr: "Langue des explications",
            })}
          </legend>
          <div className="qd-grid languages">
            {interfaceLanguages.map((language) => (
              <button
                type="button"
                aria-pressed={profile.language === language.code}
                className={`qd-option ${profile.language === language.code ? "selected" : ""}`}
                key={language.code}
                onClick={() => {
                  setProfile({ ...profile, language: language.code });
                  setSaved(false);
                }}
              >
                <span>{language.flag}</span>
                <b>{language.nativeName}</b>
                <small>{language.hint}</small>
              </button>
            ))}
          </div>
        </fieldset>
        {step === 2 && (
          <>
            <label className="qd-field">
              {t({
                ru: "Никнейм",
                en: "Nickname",
                zh: "昵称",
                es: "Apodo",
                de: "Spitzname",
                fr: "Pseudo",
              })}
              <input
                value={profile.nickname}
                minLength={2}
                maxLength={24}
                required
                onChange={(e) => {
                  setProfile({ ...profile, nickname: e.target.value });
                  setSaved(false);
                }}
              />
            </label>
            <fieldset>
              <legend>
                {t({
                  ru: "Цель обучения",
                  en: "Learning goal",
                  zh: "学习目标",
                  es: "Objetivo",
                  de: "Lernziel",
                  fr: "Objectif",
                })}
              </legend>
              <div className="qd-grid goals">
                {goals.map((g) => (
                  <button
                    type="button"
                    className={`qd-option ${profile.goal === g.id ? "selected" : ""}`}
                    aria-pressed={profile.goal === g.id}
                    key={g.id}
                    onClick={() => {
                      setProfile({ ...profile, goal: g.id });
                      setSaved(false);
                    }}
                  >
                    <span>{g.icon}</span>
                    <b>{localized(g.title, profile.language)}</b>
                    <small>{localized(g.description, profile.language)}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>
                {t({
                  ru: "Аватар",
                  en: "Avatar",
                  zh: "头像",
                  es: "Avatar",
                  de: "Avatar",
                  fr: "Avatar",
                })}
              </legend>
              {["🌱", "🦊", "🦉", "🌟"].map((a) => (
                <button
                  type="button"
                  aria-label={a}
                  aria-pressed={profile.avatar === a}
                  className={`btn ${profile.avatar === a ? "primary" : "ghost"}`}
                  key={a}
                  onClick={() => setProfile({ ...profile, avatar: a })}
                >
                  {a}
                </button>
              ))}
            </fieldset>
            <label className="qd-check">
              <input
                type="checkbox"
                checked={profile.animations}
                onChange={(e) =>
                  setProfile({ ...profile, animations: e.target.checked })
                }
              />
              {t({
                ru: "Плавные анимации",
                en: "Gentle animations",
                zh: "柔和动画",
                es: "Animaciones suaves",
                de: "Sanfte Animationen",
                fr: "Animations douces",
              })}
            </label>
            {state.progress.inventory.includes("mint") && (
              <label className="qd-field">
                {t({
                  ru: "Тема",
                  en: "Theme",
                  zh: "主题",
                  es: "Tema",
                  de: "Design",
                  fr: "Thème",
                })}
                <select
                  value={profile.theme}
                  onChange={(e) =>
                    setProfile({ ...profile, theme: e.target.value })
                  }
                >
                  <option value="default">
                    {t({
                      ru: "Лавандовая",
                      en: "Lavender",
                      zh: "薰衣草",
                      es: "Lavanda",
                      de: "Lavendel",
                      fr: "Lavande",
                    })}
                  </option>
                  <option value="mint">
                    {t({
                      ru: "Мятная",
                      en: "Mint",
                      zh: "薄荷",
                      es: "Menta",
                      de: "Minze",
                      fr: "Menthe",
                    })}
                  </option>
                </select>
              </label>
            )}
          </>
        )}
        <div className="qd-actions">
          {onboarding && step === 2 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setStep(1)}
            >
              {t({
                ru: "Назад",
                en: "Back",
                zh: "返回",
                es: "Atrás",
                de: "Zurück",
                fr: "Retour",
              })}
            </button>
          )}
          <button disabled={busy} className="btn primary">
            {busy
              ? t({
                  ru: "Сохраняем…",
                  en: "Saving…",
                  zh: "正在保存…",
                  es: "Guardando…",
                  de: "Speichern…",
                  fr: "Enregistrement…",
                })
              : step === 1
                ? t({
                    ru: "Продолжить",
                    en: "Continue",
                    zh: "继续",
                    es: "Continuar",
                    de: "Weiter",
                    fr: "Continuer",
                  })
                : t({
                    ru: onboarding ? "Создать мой маршрут" : "Сохранить",
                    en: onboarding ? "Create my path" : "Save",
                    zh: onboarding ? "创建我的路线" : "保存",
                    es: onboarding ? "Crear mi ruta" : "Guardar",
                    de: onboarding ? "Meinen Weg erstellen" : "Speichern",
                    fr: onboarding ? "Créer mon parcours" : "Enregistrer",
                  })}
          </button>
        </div>
        {saved && (
          <p role="status">
            {t({
              ru: "Настройки сохранены. Прогресс других направлений сохранён.",
              en: "Settings saved. Your progress in other courses is preserved.",
              zh: "设置已保存。其他课程的进度已保留。",
              es: "Ajustes guardados. Tu progreso se conserva.",
              de: "Einstellungen gespeichert. Dein Fortschritt bleibt erhalten.",
              fr: "Paramètres enregistrés. Ta progression est conservée.",
            })}
          </p>
        )}
      </form>
      {!onboarding && (
        <button className="btn ghost" onClick={() => void logout()}>
          {t({
            ru: "Выйти из аккаунта",
            en: "Sign out",
            zh: "退出登录",
            es: "Cerrar sesión",
            de: "Abmelden",
            fr: "Se déconnecter",
          })}
        </button>
      )}
    </main>
  );
}
