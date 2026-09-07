import {
  canWear,
  characterById,
  characters,
  coinRewards,
  globalSlots,
  shopItemById,
  unlockedCharacters,
} from "./config";
import type { LearningState } from "../learning/types";
import type { CharacterCollection, CharacterId, EquipmentSlot } from "./types";
export function freshCollection(): CharacterCollection {
  return {
    selectedId: "tilmash",
    unlocked: [{ characterId: "tilmash", unlockedAt: "starter" }],
    announcedIds: ["tilmash"],
    equipped: {},
    globalEquipped: {},
  };
}
/** Backward-compatible hydration: never resets balances, lesson answers or legacy inventory. */
export function hydrateCharacters(
  input: LearningState,
  now = new Date(),
): LearningState {
  const state = structuredClone(input),
    p = state.progress,
    legacy = !p.characters;
  const collection = p.characters ?? freshCollection();
  const unlocked = unlockedCharacters(p.xp);
  collection.unlocked = unlocked.map(
    (c) =>
      collection.unlocked.find((u) => u.characterId === c.id) ?? {
        characterId: c.id,
        unlockedAt: now.toISOString(),
      },
  );
  if (!unlocked.some((c) => c.id === collection.selectedId))
    collection.selectedId = "tilmash";
  collection.announcedIds = [...new Set(collection.announcedIds)].filter((id) =>
    unlocked.some((c) => c.id === id),
  );
  collection.equipped ??= {};
  collection.globalEquipped ??= {};
  if (legacy) {
    if (p.inventory.includes("scarf"))
      collection.equipped.tilmash = { neck: "scarf" };
    if (p.inventory.includes("frame"))
      collection.globalEquipped.frame = "frame";
    if (state.profile.theme === "mint" && p.inventory.includes("mint"))
      collection.globalEquipped.theme = "mint";
  }
  p.characters = collection;
  return state;
}
export function getCollection(s: LearningState): CharacterCollection {
  return s.progress.characters ?? freshCollection();
}
export function selectedCharacter(s: LearningState) {
  return characterById(getCollection(s).selectedId) ?? characters[0];
}
export function pendingReveals(s: LearningState) {
  return unlockedCharacters(s.progress.xp).filter(
    (c) => !getCollection(s).announcedIds.includes(c.id),
  );
}
export function equipmentFor(
  s: LearningState,
  id = getCollection(s).selectedId,
) {
  return {
    ...getCollection(s).globalEquipped,
    ...getCollection(s).equipped[id],
  };
}
export function awardLegendary(s: LearningState, stamp: string) {
  const p = s.progress;
  if (
    p.xp >= characters.find((c) => c.isLegendary)!.unlockXP &&
    !p.achievements.some((a) => a.achievementId === "legendary")
  ) {
    p.achievements.push({ achievementId: "legendary", date: stamp });
    awardAchievementCoins(s, "legendary", stamp);
  }
}
export function awardAchievementCoins(
  s: LearningState,
  id: string,
  stamp: string,
) {
  const p = s.progress,
    txId = `achievement-${id}`;
  if (p.coinTransactions.some((t) => t.id === txId)) return;
  const amount =
    id === "legendary"
      ? coinRewards.legendaryAchievement
      : coinRewards.achievement;
  p.coins += amount;
  p.coinTransactions.push({
    id: txId,
    amount,
    reason: "achievement",
    date: stamp,
  });
}
export function selectCharacter(s: LearningState, id: CharacterId) {
  const c = characterById(id);
  if (!c || s.progress.xp < c.unlockXP) throw new Error("Character locked");
  getCollection(s).selectedId = id;
}
export function equipItem(
  s: LearningState,
  characterId: CharacterId,
  itemId: string,
) {
  const item = shopItemById(itemId),
    c = characterById(characterId);
  if (
    !item?.slot ||
    !s.progress.inventory.includes(itemId) ||
    !c ||
    s.progress.xp < c.unlockXP ||
    !canWear(item, characterId)
  )
    throw new Error("Item cannot be equipped");
  const collection = getCollection(s);
  if (globalSlots.some((slot) => slot === item.slot)) {
    collection.globalEquipped[item.slot] = item.id;
    if (item.slot === "theme") s.profile.theme = item.id;
  } else {
    (collection.equipped[characterId] ??= {})[item.slot] = item.id;
  }
}
export function unequipItem(
  s: LearningState,
  characterId: CharacterId,
  slot: EquipmentSlot,
) {
  const c = characterById(characterId);
  if (
    !c ||
    s.progress.xp < c.unlockXP ||
    ![
      "skin",
      "outfit",
      "hat",
      "eyewear",
      "back",
      "hand",
      "neck",
      ...globalSlots,
    ].includes(slot)
  )
    throw new Error("Invalid equipment slot");
  const collection = getCollection(s);
  if (globalSlots.some((x) => x === slot)) {
    delete collection.globalEquipped[slot];
    if (slot === "theme") s.profile.theme = "default";
  } else if (collection.equipped[characterId])
    delete collection.equipped[characterId]![slot];
}
