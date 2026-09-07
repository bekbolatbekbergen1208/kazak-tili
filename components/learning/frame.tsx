"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Home,
  LogOut,
  Settings,
  ShoppingBag,
  Trophy,
  RotateCcw,
  PawPrint,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { getCollection } from "@/lib/characters/state";
import { useLearning } from "./provider";
export { Companion } from "@/components/characters/companion";
export function LearningFrame({ children }: { children: React.ReactNode }) {
  const { state, t, demo, logout } = useLearning(),
    path = usePathname();
  const nav = [
    ["/learn", Home, t("Главная", "Home")],
    ["/learn/map", Compass, t("Мой маршрут", "My path")],
    ["/learn/books", BookOpen, t("Произведения", "Literature")],
    ["/learn/review", RotateCcw, t("Повторение", "Review")],
    ["/learn/ranking", Trophy, t("Лиги", "Leagues")],
    ["/learn/characters", PawPrint, t("Персонажи", "Companions")],
    ["/learn/shop", ShoppingBag, t("Магазин", "Shop")],
    ["/learn/settings", Settings, t("Настройки", "Settings")],
  ] as const;
  return (
    <div className="appShell qd-shell">
      <aside>
        <Link href="/" className="brand">
          <Logo />
        </Link>
        <nav aria-label={t("Навигация", "Navigation")}>
          {nav.map(([href, Icon, label]) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={path === href ? "active" : ""}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sideBottom">
          <Link href="/student/lessons">
            {t(
              "Прежний каталог · 1000 уроков",
              "Original catalog · 1,000 lessons",
            )}
          </Link>
          <button className="btn ghost" onClick={() => void logout()}>
            <LogOut size={18} />
            {t("Выйти", "Sign out")}
          </button>
        </div>
      </aside>
      <main>
        <header className="qd-bar">
          <span>
            {demo
              ? t(
                  "Демо · хранится в этом браузере",
                  "Demo · saved in this browser",
                )
              : t("Личный учебный кабинет", "Your learning space")}
          </span>
          <Link
            href="/learn/settings"
            aria-label={t("Настройки профиля", "Profile settings")}
            className={`avatar ${getCollection(state).globalEquipped.frame ? "qd-avatar-frame" : ""}`}
          >
            {state.profile.avatar}
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}
