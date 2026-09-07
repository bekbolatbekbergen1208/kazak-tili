"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Coins, Eye, PackageOpen, ShoppingBag, X } from "lucide-react";
import {
  canWear,
  characterShop,
  rarityLabels,
  slotLabels,
  unlockedCharacters,
} from "@/lib/characters/config";
import {
  equipmentFor,
  getCollection,
  selectedCharacter,
} from "@/lib/characters/state";
import type {
  CharacterId,
  EquipmentSlot,
  ShopItem,
} from "@/lib/characters/types";
import { useLearning } from "@/components/learning/provider";
import { CharacterArt } from "./character-art";
import { CharacterModal } from "./modal";
import { ItemIcon } from "./item-icon";
export function CharacterShop({ inventory = false }: { inventory?: boolean }) {
  const { state, t, dispatch, busy } = useLearning(),
    lang = state.profile.language,
    selected = selectedCharacter(state),
    [characterId, setCharacterId] = useState<CharacterId>(selected.id),
    [category, setCategory] = useState("all"),
    [preview, setPreview] = useState<ShopItem | null>(null),
    [message, setMessage] = useState("");
  const ownedIds = state.progress.inventory,
    equipped = equipmentFor(state, characterId),
    available = unlockedCharacters(state.progress.xp),
    items = characterShop.filter(
      (i) =>
        (!inventory || ownedIds.includes(i.id)) &&
        (category === "all" ||
          (category === "skin"
            ? i.slot === "skin"
            : category === "accessories"
              ? i.slot &&
                ["outfit", "hat", "eyewear", "back", "hand", "neck"].includes(
                  i.slot,
                )
              : i.slot &&
                ["room", "frame", "theme", "victory"].includes(i.slot))),
    );
  async function purchase(item: ShopItem) {
    const next = await dispatch({ type: "buy", itemId: item.id });
    if (next)
      setMessage(
        t(
          `${item.title.ru} добавлен в «Мои вещи».`,
          `${item.title.en} added to your inventory.`,
        ),
      );
  }
  async function equip(item: ShopItem) {
    const result = await dispatch({
      type: "equip",
      characterId,
      itemId: item.id,
    });
    if (result) setMessage(t("Образ сохранён.", "Your look is saved."));
  }
  return (
    <div className="page char-shop">
      <header className="char-page-heading">
        <div>
          <span className="char-kicker">QAZAQDOS ATELIER</span>
          <h1>
            {inventory
              ? t("Менің заттарым · Мои вещи", "Менің заттарым · My inventory")
              : t(
                  "Маленькие детали, большой характер",
                  "Little details, big personality",
                )}
          </h1>
          <p>
            {t(
              "Только заработанные монеты. Вы точно знаете, что получите.",
              "Only coins earned by learning. Always know exactly what you get.",
            )}
          </p>
        </div>
        <span className="char-balance">
          <Coins size={22} />
          {state.progress.coins}
        </span>
      </header>
      <div className="char-shop-links">
        <Link
          className={`btn ${inventory ? "ghost" : "primary"}`}
          href="/learn/shop"
        >
          <ShoppingBag size={17} />
          {t("Дүкен · Магазин", "Дүкен · Shop")}
        </Link>
        <Link
          className={`btn ${inventory ? "primary" : "ghost"}`}
          href="/learn/inventory"
        >
          <PackageOpen size={17} />
          {t("Мои вещи", "My inventory")} · {ownedIds.length}
        </Link>
        <Link className="btn ghost" href="/learn/characters">
          {t("Персонажи", "Companions")}
        </Link>
      </div>
      <div className="char-atelier-layout">
        <aside
          className={`char-dressing-room ${equipped.room === "room-steppe" ? "char-room" : ""}`}
        >
          <label className="qd-field">
            {t("Примерить на персонажа", "Dress a companion")}
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value as CharacterId)}
            >
              {available.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <CharacterArt characterId={characterId} equipped={equipped} />
          <p className="char-muted">
            {t(
              "Покупка и примерка не меняют выбранного помощника.",
              "Buying and dressing do not change your selected companion.",
            )}
          </p>
          <div className="char-equipped">
            {Object.entries(equipped).map(([slot, id]) => {
              const item = characterShop.find((i) => i.id === id);
              return item ? (
                <button
                  key={slot}
                  disabled={busy}
                  onClick={() =>
                    void dispatch({
                      type: "unequip",
                      characterId,
                      slot: slot as EquipmentSlot,
                    })
                  }
                  aria-label={t(
                    `Снять ${item.title.ru}`,
                    `Remove ${item.title.en}`,
                  )}
                >
                  {item.title[lang]}
                  <X size={13} />
                </button>
              ) : null;
            })}
          </div>
          {!Object.keys(equipped).length && (
            <small>{t("Базовый образ", "Original look")}</small>
          )}
        </aside>
        <section>
          <div
            className="char-filters"
            role="group"
            aria-label={t("Категории", "Categories")}
          >
            {[
              ["all", t("Все", "All")],
              ["skin", t("Скины", "Skins")],
              ["accessories", t("Аксессуары", "Accessories")],
              ["space", t("Стиль и комната", "Style & room")],
            ].map(([id, label]) => (
              <button
                aria-pressed={category === id}
                key={id}
                onClick={() => setCategory(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {message && (
            <p className="char-shop-message" role="status">
              {message}
            </p>
          )}
          <div className="char-items-grid">
            {items.map((item) => {
              const owned = ownedIds.includes(item.id),
                wearable = !!item.slot && canWear(item, characterId),
                wearing = !!item.slot && equipped[item.slot] === item.id;
              return (
                <article
                  className="char-item-card"
                  data-testid={`shop-item-${item.id}`}
                  key={item.id}
                >
                  <div className="char-item-top">
                    <ItemIcon item={item} />
                    <span className={`char-rarity ${item.rarity}`}>
                      {rarityLabels[item.rarity][lang]}
                    </span>
                  </div>
                  <h2>{item.title[lang]}</h2>
                  <p>{item.description[lang]}</p>
                  <div className="char-item-meta">
                    <span>
                      <Coins size={15} />
                      {item.price}
                    </span>
                    <button
                      aria-label={t(
                        `Посмотреть ${item.title.ru}`,
                        `Preview ${item.title.en}`,
                      )}
                      onClick={() => setPreview(item)}
                    >
                      <Eye size={16} />
                      {t("Примерить", "Preview")}
                    </button>
                  </div>
                  {owned ? (
                    item.slot ? (
                      <button
                        className="btn ghost"
                        disabled={busy || !wearable || wearing}
                        onClick={() => void equip(item)}
                      >
                        {wearing ? (
                          <>
                            <Check size={16} />
                            {t("Надето", "Equipped")}
                          </>
                        ) : wearable ? (
                          t("Надеть", "Equip")
                        ) : (
                          t("Для другого персонажа", "For another companion")
                        )}
                      </button>
                    ) : (
                      <span className="char-owned">
                        <Check size={16} />
                        {t("Подсказка активна", "Hint is active")}
                      </span>
                    )
                  ) : (
                    <button
                      className="btn primary"
                      disabled={busy || state.progress.coins < item.price}
                      onClick={() => void purchase(item)}
                    >
                      {state.progress.coins < item.price
                        ? t(
                            `Не хватает ${item.price - state.progress.coins} монет`,
                            `${item.price - state.progress.coins} more coins needed`,
                          )
                        : t("Купить", "Buy")}
                    </button>
                  )}
                  {item.compatibleCharacters && (
                    <small>
                      {t("Для", "For")}:{" "}
                      {item.compatibleCharacters
                        .map(
                          (id) =>
                            unlockedCharacters(Infinity).find(
                              (c) => c.id === id,
                            )!.name,
                        )
                        .join(", ")}
                    </small>
                  )}
                </article>
              );
            })}
          </div>
          {items.length === 0 && (
            <div className="panel char-empty">
              <PackageOpen size={35} />
              <h2>{t("Здесь пока пусто", "Nothing here yet")}</h2>
              <p>
                {t(
                  "Зарабатывайте монеты в уроках и выбирайте понравившиеся вещи.",
                  "Earn coins in lessons and choose the items you like.",
                )}
              </p>
              <Link
                className="btn primary"
                href={inventory ? "/learn/shop" : "/learn/map"}
              >
                {inventory
                  ? t("В магазин", "Visit shop")
                  : t("Учиться", "Learn")}
              </Link>
            </div>
          )}
        </section>
      </div>
      {preview && (
        <CharacterModal
          titleId="item-preview-title"
          onClose={() => setPreview(null)}
        >
          <div className="char-item-preview">
            <button
              className="char-close"
              aria-label={t("Закрыть", "Close")}
              onClick={() => setPreview(null)}
            >
              <X />
            </button>
            <h2 id="item-preview-title">{preview.title[lang]}</h2>
            {preview.slot && canWear(preview, characterId) ? (
              <div className={preview.slot === "room" ? "char-room" : ""}>
                <CharacterArt
                  characterId={characterId}
                  equipped={{ ...equipped, [preview.slot]: preview.id }}
                  mood={preview.slot === "victory" ? "victory" : "waiting"}
                />
              </div>
            ) : (
              <ItemIcon item={preview} />
            )}
            <p>{preview.description[lang]}</p>
            <p>
              {preview.slot
                ? slotLabels[preview.slot][lang]
                : t("Учебная подсказка", "Learning hint")}{" "}
              · {preview.price} {t("монет", "coins")}
            </p>
            <p className="char-muted">
              {t(
                "Это только примерка. Монеты не списаны.",
                "This is only a preview. No coins have been spent.",
              )}
            </p>
            <button className="btn primary" onClick={() => setPreview(null)}>
              {t("Вернуться", "Back")}
            </button>
          </div>
        </CharacterModal>
      )}
    </div>
  );
}
