import type { Localized } from "../learning/types";
export type CharacterId =
  | "tilmash"
  | "balapan"
  | "qonyr"
  | "qyran"
  | "aibar"
  | "aqbota"
  | "danaqulaq"
  | "samuryq";
export type CharacterMood =
  | "greeting"
  | "waiting"
  | "joy"
  | "thinking"
  | "support"
  | "celebration"
  | "sleep"
  | "running"
  | "victory";
export type Rarity = "common" | "special" | "rare" | "legendary";
export type CharacterAnimation = {
  id: CharacterMood;
  label: Localized;
  cssClass: string;
  url?: string;
};
export type CharacterUnlockRequirement = {
  characterId: CharacterId;
  xp: number;
};
export type Character = {
  id: CharacterId;
  name: string;
  animalType: Localized;
  description: Localized;
  personality: Localized;
  quirk: Localized;
  primaryColor: string;
  secondaryColor: string;
  unlockXP: number;
  rarity: Rarity;
  imageUrl: string;
  animationUrls: Partial<Record<CharacterMood, string>>;
  dialogueLines: Record<CharacterMood, Localized>;
  isLegendary: boolean;
};
export type EquipmentSlot =
  | "skin"
  | "outfit"
  | "hat"
  | "eyewear"
  | "back"
  | "hand"
  | "neck"
  | "room"
  | "frame"
  | "victory"
  | "theme";
export type ShopItem = {
  id: string;
  title: Localized;
  description: Localized;
  price: number;
  rarity: Rarity;
  slot?: EquipmentSlot;
  compatibleCharacters?: CharacterId[];
  visual: string;
  color: string;
};
export type CharacterSkin = ShopItem & { slot: "skin" };
export type CharacterAccessory = ShopItem & {
  slot: "outfit" | "hat" | "eyewear" | "back" | "hand" | "neck";
};
export type UserCharacter = { characterId: CharacterId; unlockedAt: string };
export type UserInventory = { itemId: string; acquiredAt: string | null };
export type UserEquippedItem = {
  characterId: CharacterId | "global";
  slot: EquipmentSlot;
  itemId: string;
};
export type CharacterCollection = {
  selectedId: CharacterId;
  unlocked: UserCharacter[];
  announcedIds: CharacterId[];
  equipped: Partial<
    Record<CharacterId, Partial<Record<EquipmentSlot, string>>>
  >;
  globalEquipped: Partial<Record<EquipmentSlot, string>>;
};
