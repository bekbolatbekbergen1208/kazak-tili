import type { Localized } from "@/lib/learning/types";

type TranslationItem = {
  kk: string;
  translation: Localized;
};

function item(
  kk: string,
  ru: string,
  en: string,
  extra: Partial<Localized> = {},
) {
  return { kk, translation: { ru, en, ...extra } };
}

export const commonDictionary: TranslationItem[] = [
  item("Сәлем", "Привет", "Hello", {
    zh: "你好",
    es: "Hola",
    de: "Hallo",
    fr: "Bonjour",
  }),
  item("Рақмет", "Спасибо", "Thank you", {
    zh: "谢谢",
    es: "Gracias",
    de: "Danke",
    fr: "Merci",
  }),
  item("Саяхат", "Путешествие", "Travel", {
    zh: "旅行",
    es: "Viaje",
    de: "Reise",
    fr: "Voyage",
  }),
  item("Ұшақ", "Самолёт", "Airplane", {
    zh: "飞机",
    es: "Avión",
    de: "Flugzeug",
    fr: "Avion",
  }),
  item("Дос", "Друг", "Friend", {
    zh: "朋友",
    es: "Amigo",
    de: "Freund",
    fr: "Ami",
  }),
  item("Мектеп", "Школа", "School", {
    zh: "学校",
    es: "Escuela",
    de: "Schule",
    fr: "École",
  }),
  item("Кітап", "Книга", "Book", {
    zh: "书",
    es: "Libro",
    de: "Buch",
    fr: "Livre",
  }),
  item("Қазақстан", "Казахстан", "Kazakhstan", {
    zh: "哈萨克斯坦",
    es: "Kazajistán",
    de: "Kasachstan",
    fr: "Kazakhstan",
  }),
];
