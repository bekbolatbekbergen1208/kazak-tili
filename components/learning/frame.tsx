"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clapperboard,
  Compass,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  ShoppingBag,
  Trophy,
  RotateCcw,
  PawPrint,
  MessageCircle,
  Users,
  ScanLine,
  Music,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/icons";
import { getCollection } from "@/lib/characters/state";
import { useLearning } from "./provider";
export { Companion } from "@/components/characters/companion";
export function LearningFrame({ children }: { children: React.ReactNode }) {
  const { state, t, demo, localOnly, logout } = useLearning(),
    path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (menuOpen)
      navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [menuOpen]);
  const nav = [
    ["/learn", Home, t("Главная", "Home")],
    ["/learn/q-level", Trophy, "Q-Level"],
    ["/student/lessons", GraduationCap, "Жаттығу каталогы"],
    ["/student/cartoon", Clapperboard, "Мультфильм"],
    ["/kazakhstan", Compass, "Қазақстанға саяхат"],
    ["/learn/history", Compass, "Тарих"],
    ["/learn/national", Trophy, "Ұлттық ойындар"],
    ["/learn/map", Compass, t("Мой маршрут", "My path")],
    ["/learn/books", BookOpen, "Кітап әлемі"],
    ["/learn/songs", Music, "Әнмен үйрен"],
    ["/learn/literature", BookOpen, "Әдебиетпен үйрен"],
    ["/learn/vocabulary", BookOpen, "Менің сөз қорым"],
    ["/learn/writing-coach", MessageCircle, "Жазу көмекшісі"],
    ["/learn/friend", MessageCircle, "Досжанмен чат"],
    ["/learn/friends", Users, "Достық байланыс"],
    ["/learn/vision", ScanLine, "Досжан Vision"],
    ["/learn/review", RotateCcw, t("Повторение", "Review")],
    ["/learn/ranking", Trophy, t("Лиги", "Leagues")],
    ["/learn/characters", PawPrint, t("Персонажи", "Companions")],
    ["/learn/shop", ShoppingBag, t("Магазин", "Shop")],
    ["/learn/settings", Settings, t("Настройки", "Settings")],
  ] as const;
  return (
    <div className={`appShell qd-shell ${menuOpen ? "journey-menu-open" : ""}`}>
      <a className="journey-skip" href="#learning-main">
        Сабаққа өту
      </a>
      <aside
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <Link href="/" className="brand">
          <Logo />
        </Link>
        <nav
          ref={navigation}
          id="learning-navigation"
          aria-label={t("Навигация", "Navigation")}
        >
          {nav.map(([href, Icon, label]) => (
            <Link
              onClick={() => setMenuOpen(false)}
              aria-current={
                path === href ||
                (href !== "/learn" && path.startsWith(href + "/"))
                  ? "page"
                  : undefined
              }
              key={href}
              href={href}
              aria-label={label}
              className={
                path === href ||
                (href !== "/learn" && path.startsWith(href + "/"))
                  ? "active"
                  : ""
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sideBottom">
          <button className="btn ghost" onClick={() => void logout()}>
            <LogOut size={18} />
            {t("Выйти", "Sign out")}
          </button>
        </div>
      </aside>
      <main id="learning-main">
        <header className="qd-bar">
          <button
            ref={menuButton}
            className="btn ghost journey-menu-toggle"
            aria-label={menuOpen ? "Мәзірді жабу" : "Мәзірді ашу"}
            aria-expanded={menuOpen}
            aria-controls="learning-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />} Мәзір
          </button>
          <span>
            {localOnly
              ? "Прогресс осы браузерде сақталады"
              : demo
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
