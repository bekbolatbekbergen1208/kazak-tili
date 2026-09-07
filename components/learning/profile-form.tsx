"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { goals } from "@/lib/learning/content";
import { useLearning } from "./provider";
import { Logo } from "@/components/icons";
export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { state, dispatch, busy, logout } = useLearning(),
    [profile, setProfile] = useState(state.profile),
    [step, setStep] = useState(onboarding ? 1 : 2),
    [saved, setSaved] = useState(false),
    router = useRouter();
  const t = (ru: string, en: string) => (profile.language === "en" ? en : ru);
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
      <span className="pill">{onboarding ? `${step} / 2` : "QazaqDos"}</span>
      <h1>
        {step === 1
          ? t("Как вам удобнее учиться?", "How would you like to learn?")
          : t(
              onboarding ? "Что вас вдохновляет?" : "Настройки обучения",
              onboarding ? "What inspires you?" : "Learning settings",
            )}
      </h1>
      <p>
        {t(
          "Казахский язык — шаг за шагом, в вашем ритме.",
          "Kazakh, step by step, at your own pace.",
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) setStep(2);
          else void save();
        }}
      >
        <fieldset>
          <legend>{t("Язык объяснений", "Explanation language")}</legend>
          <div className="qd-grid two">
            {(["ru", "en"] as const).map((lang) => (
              <button
                type="button"
                aria-pressed={profile.language === lang}
                className={`qd-option ${profile.language === lang ? "selected" : ""}`}
                key={lang}
                onClick={() => {
                  setProfile({ ...profile, language: lang });
                  setSaved(false);
                }}
              >
                <span>{lang === "ru" ? "🇷🇺" : "🇬🇧"}</span>
                <b>{lang === "ru" ? "Русский" : "English"}</b>
                <small>
                  {lang === "ru"
                    ? "Объяснения и подсказки на русском"
                    : "Explanations and hints in English"}
                </small>
              </button>
            ))}
          </div>
        </fieldset>
        {step === 2 && (
          <>
            <label className="qd-field">
              {t("Никнейм", "Nickname")}
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
              <legend>{t("Цель обучения", "Learning goal")}</legend>
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
                    <b>{g.title[profile.language]}</b>
                    <small>{g.description[profile.language]}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>{t("Аватар", "Avatar")}</legend>
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
              {t("Плавные анимации", "Gentle animations")}
            </label>
            {state.progress.inventory.includes("mint") && (
              <label className="qd-field">
                {t("Тема", "Theme")}
                <select
                  value={profile.theme}
                  onChange={(e) =>
                    setProfile({ ...profile, theme: e.target.value })
                  }
                >
                  <option value="default">{t("Лавандовая", "Lavender")}</option>
                  <option value="mint">{t("Мятная", "Mint")}</option>
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
              {t("Назад", "Back")}
            </button>
          )}
          <button disabled={busy} className="btn primary">
            {busy
              ? t("Сохраняем…", "Saving…")
              : step === 1
                ? t("Продолжить", "Continue")
                : t(
                    onboarding ? "Создать мой маршрут" : "Сохранить",
                    onboarding ? "Create my path" : "Save",
                  )}
          </button>
        </div>
        {saved && (
          <p role="status">
            {t(
              "Настройки сохранены. Прогресс других направлений сохранён.",
              "Settings saved. Your progress in other courses is preserved.",
            )}
          </p>
        )}
      </form>
      {!onboarding && (
        <button className="btn ghost" onClick={() => void logout()}>
          {t("Выйти из аккаунта", "Sign out")}
        </button>
      )}
    </main>
  );
}
