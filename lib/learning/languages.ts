import type { InterfaceLanguage, Localized } from "./types";

export const interfaceLanguages = [
  {
    code: "ru",
    name: "Русский",
    nativeName: "Русский",
    flag: "🇷🇺",
    hint: "Объяснения и подсказки на русском",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    hint: "Explanations and hints in English",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    hint: "中文说明和提示",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    hint: "Explicaciones y pistas en español",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    hint: "Erklärungen und Hinweise auf Deutsch",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    hint: "Explications et indices en français",
  },
] as const satisfies readonly {
  code: InterfaceLanguage;
  name: string;
  nativeName: string;
  flag: string;
  hint: string;
}[];

export const interfaceLanguageCodes = interfaceLanguages.map(
  ({ code }) => code,
);

export const languageName = (code: InterfaceLanguage) =>
  interfaceLanguages.find((language) => language.code === code)?.nativeName ??
  "Русский";

export function localized(value: Localized, language: InterfaceLanguage) {
  return value[language] ?? value.ru ?? value.en;
}
