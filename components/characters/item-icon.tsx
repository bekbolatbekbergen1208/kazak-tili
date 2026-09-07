import {
  Backpack,
  BookOpen,
  Glasses,
  Map,
  Shirt,
  Sparkles,
  Frame,
  Palette,
  Lightbulb,
  Home,
  GraduationCap,
  Ribbon,
} from "lucide-react";
import type { ShopItem } from "@/lib/characters/types";
export function ItemIcon({ item }: { item: ShopItem }) {
  const Icon =
    {
      backpack: Backpack,
      book: BookOpen,
      map: Map,
      shapan: Shirt,
      taqiya: GraduationCap,
      glasses: Glasses,
      scarf: Ribbon,
      room: Home,
      frame: Frame,
      stars: Sparkles,
      theme: Palette,
      skin: Palette,
      hint: Lightbulb,
    }[item.visual] ?? Sparkles;
  return (
    <span
      className="char-item-icon"
      style={{ background: `${item.color}18`, color: item.color }}
    >
      <Icon aria-hidden size={30} />
    </span>
  );
}
