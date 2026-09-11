import type { VisionCategory, VisionWord } from "./types";
const W = (
  id: string,
  kk: string,
  plural: string,
  ru: string,
  en: string,
  category: VisionCategory,
  aliases: string[],
  xp = 8,
): VisionWord => ({
  id,
  kk,
  plural,
  ru,
  en,
  category,
  aliases,
  xp,
  pronunciation: kk,
  easy: `Бұл — ${kk}.`,
  medium: `Мен ${kk} сөзін күнделікті өмірде қолданамын.`,
});
export const visionWords: VisionWord[] = [
  W("book", "кітап", "кітаптар", "книга", "book", "Мектеп", [
    "book",
    "textbook",
  ]),
  W("pen", "қалам", "қаламдар", "ручка", "pen", "Мектеп", ["pen"]),
  W("pencil", "қарындаш", "қарындаштар", "карандаш", "pencil", "Мектеп", [
    "pencil",
  ]),
  W("notebook", "дәптер", "дәптерлер", "тетрадь", "notebook", "Мектеп", [
    "notebook",
  ]),
  W("desk", "үстел", "үстелдер", "стол", "table", "Мектеп", ["table", "desk"]),
  W("chair", "орындық", "орындықтар", "стул", "chair", "Үй", ["chair"]),
  W("phone", "телефон", "телефондар", "телефон", "phone", "Технология", [
    "phone",
    "mobile phone",
    "cell phone",
  ]),
  W(
    "computer",
    "компьютер",
    "компьютерлер",
    "компьютер",
    "computer",
    "Технология",
    ["computer", "laptop"],
  ),
  W(
    "keyboard",
    "пернетақта",
    "пернетақталар",
    "клавиатура",
    "keyboard",
    "Технология",
    ["keyboard"],
  ),
  W("mouse", "тінтуір", "тінтуірлер", "мышь", "mouse", "Технология", [
    "computer mouse",
    "mouse",
  ]),
  W("bag", "сөмке", "сөмкелер", "сумка", "bag", "Киім", ["bag", "backpack"]),
  W("bottle", "бөтелке", "бөтелкелер", "бутылка", "bottle", "Ас үй", [
    "bottle",
  ]),
  W("cup", "кесе", "кеселер", "чашка", "cup", "Ас үй", ["cup", "mug"]),
  W("spoon", "қасық", "қасықтар", "ложка", "spoon", "Ас үй", ["spoon"]),
  W("plate", "тәрелке", "тәрелкелер", "тарелка", "plate", "Ас үй", [
    "plate",
    "dish",
  ]),
  W("door", "есік", "есіктер", "дверь", "door", "Үй", ["door"]),
  W("window", "терезе", "терезелер", "окно", "window", "Үй", ["window"]),
  W("clock", "сағат", "сағаттар", "часы", "clock", "Үй", ["clock", "watch"]),
  W("lamp", "шам", "шамдар", "лампа", "lamp", "Үй", ["lamp", "light"]),
  W("ball", "доп", "доптар", "мяч", "ball", "Үй", ["ball"]),
  W("shoe", "аяқкиім", "аяқкиімдер", "обувь", "shoe", "Киім", [
    "shoe",
    "sneaker",
  ]),
  W("clothes", "киім", "киімдер", "одежда", "clothes", "Киім", [
    "clothing",
    "clothes",
    "shirt",
  ]),
  W("flower", "гүл", "гүлдер", "цветок", "flower", "Табиғат", ["flower"]),
  W("tree", "ағаш", "ағаштар", "дерево", "tree", "Табиғат", ["tree"]),
  W("car", "көлік", "көліктер", "машина", "car", "Көлік", ["car", "vehicle"]),
  W("bicycle", "велосипед", "велосипедтер", "велосипед", "bicycle", "Көлік", [
    "bicycle",
    "bike",
  ]),
  W("bread", "нан", "нандар", "хлеб", "bread", "Ас үй", ["bread"]),
  W("apple", "алма", "алмалар", "яблоко", "apple", "Ас үй", ["apple"]),
  W("banana", "банан", "банандар", "банан", "banana", "Ас үй", ["banana"]),
  W("water", "су", "сулар", "вода", "water", "Ас үй", ["water", "drink"]),
];
export const visionWord = (id: string) => visionWords.find((w) => w.id === id);
export const visionCategories: VisionCategory[] = [
  "Мектеп",
  "Үй",
  "Ас үй",
  "Табиғат",
  "Көлік",
  "Технология",
  "Киім",
];
export const visionTasks = [
  "Осы сөзбен сөйлем құрастыр",
  "Заттың түсін қазақша айт",
  "Бұл зат не үшін керек?",
  "Заттың көпше түрін жаз",
  "Бұл зат қай жерде болады?",
  "Затты үш сөзбен сипатта",
  "Осы зат қатысатын сұраулы сөйлем құрастыр",
];
export function acceptableVisionAnswer(
  word: VisionWord,
  task: string,
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.length > 500
  )
    return false;
  const a = value.toLocaleLowerCase("kk").trim(),
    has = a.includes(word.kk);
  if (task === visionTasks[3]) return a.replace(/[.!?]/g, "") === word.plural;
  if (task === visionTasks[0]) return has && a.split(/\s+/).length >= 2;
  if (task === visionTasks[5])
    return a.split(/[,\s]+/).filter(Boolean).length >= 3;
  if (task === visionTasks[6]) return has && a.includes("?");
  return a.split(/\s+/).length >= 2;
}
