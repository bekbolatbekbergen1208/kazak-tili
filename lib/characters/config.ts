import type {
  Character,
  CharacterId,
  CharacterMood,
  CharacterAnimation,
  Rarity,
  ShopItem,
} from "./types";
import type { Localized } from "../learning/types";
const l = (ru: string, en: string): Localized => ({ ru, en });
export const unlockRequirements = [
  { characterId: "tilmash", xp: 0 },
  { characterId: "balapan", xp: 100 },
  { characterId: "qonyr", xp: 350 },
  { characterId: "qyran", xp: 500 },
  { characterId: "aibar", xp: 600 },
  { characterId: "aqbota", xp: 700 },
  { characterId: "danaqulaq", xp: 900 },
  { characterId: "samuryq", xp: 1000 },
] as const;
export const coinRewards = {
  lesson: 10,
  perfect: 5,
  dailyQuest: 15,
  section: 30,
  answer: 1,
  review: 1,
  activeDay: 1,
  level: 10,
  achievement: 10,
  legendaryAchievement: 50,
} as const;
export const rarityLabels: Record<Rarity, Localized> = {
  common: l("Қарапайым · Обычный", "Қарапайым · Common"),
  special: l("Ерекше · Особый", "Ерекше · Special"),
  rare: l("Сирек · Редкий", "Сирек · Rare"),
  legendary: l("Аңыздық · Легендарный", "Аңыздық · Legendary"),
};
export const animations: CharacterAnimation[] = [
  { id: "waiting", label: l("Ожидание", "Idle"), cssClass: "char-waiting" },
  {
    id: "thinking",
    label: l("Размышление", "Thinking"),
    cssClass: "char-thinking",
  },
  {
    id: "joy",
    label: l("Верный ответ", "Correct answer"),
    cssClass: "char-joy",
  },
  {
    id: "support",
    label: l("Поддержка", "Encouragement"),
    cssClass: "char-support",
  },
  {
    id: "celebration",
    label: l("Новый уровень", "Level up"),
    cssClass: "char-celebration",
  },
  { id: "victory", label: l("Победа", "Victory"), cssClass: "char-victory" },
  { id: "sleep", label: l("Отдых", "Rest"), cssClass: "char-sleep" },
];
type Bio = {
  id: CharacterId;
  name: string;
  animalType: Localized;
  description: Localized;
  personality: Localized;
  quirk: Localized;
  primaryColor: string;
  secondaryColor: string;
  rarity: Rarity;
  line: Localized;
  support: Localized;
  success: Localized;
};
const bios: Bio[] = [
  {
    id: "tilmash",
    name: "Тілмаш",
    animalType: l("Түлкі · Лиса", "Түлкі · Fox"),
    description: l(
      "Коллекционирует слова и превращает каждое из них в маленькое открытие.",
      "Collects words and turns each one into a little discovery.",
    ),
    personality: l(
      "Умный, любознательный, внимательный к деталям.",
      "Clever, curious and attentive to detail.",
    ),
    quirk: l(
      "Шевелит ушами и открывает карманный словарь.",
      "Twitches his ears and opens a pocket dictionary.",
    ),
    primaryColor: "#df7948",
    secondaryColor: "#fff0d5",
    rarity: "common",
    line: l(
      "Сәлем! Давайте найдём смысл нового слова.",
      "Сәлем! Let’s discover what a new word means.",
    ),
    support: l(
      "Посмотрим в словарь вместе. Ошибка — начало открытия.",
      "Let’s check the dictionary together. A mistake begins a discovery.",
    ),
    success: l(
      "Дұрыс! Ещё одно слово в нашей коллекции.",
      "Дұрыс! One more word in our collection.",
    ),
  },
  {
    id: "balapan",
    name: "Балапан",
    animalType: l("Қарсақ · Корсак", "Қарсақ · Corsac fox"),
    description: l(
      "Любит короткие квизы и маленькие победы. Скорость никогда не важнее понимания.",
      "Loves quick quizzes and small wins. Understanding always comes before speed.",
    ),
    personality: l(
      "Быстрый, весёлый, озорной.",
      "Quick, cheerful and playful.",
    ),
    quirk: l(
      "Кружится и подпрыгивает после верного ответа.",
      "Spins and hops after a correct answer.",
    ),
    primaryColor: "#cda777",
    secondaryColor: "#fff4df",
    rarity: "common",
    line: l(
      "Кеттік! Готовы к маленькому приключению?",
      "Кеттік! Ready for a little adventure?",
    ),
    support: l(
      "Сделаем паузу. Мы успеем разобраться!",
      "Let’s pause. We have time to work it out!",
    ),
    success: l(
      "Тамаша! Кружок почёта — и дальше!",
      "Тамаша! A victory spin, then onward!",
    ),
  },
  {
    id: "qonyr",
    name: "Қоңыр",
    animalType: l("Аюдың күшігі · Медвежонок", "Аюдың күшігі · Bear cub"),
    description: l(
      "Верит в спокойные шаги и всегда найдёт добрые слова.",
      "Believes in gentle steps and always finds a kind word.",
    ),
    personality: l(
      "Терпеливый, мягкий и заботливый.",
      "Patient, gentle and caring.",
    ),
    quirk: l(
      "Подносит лапу к сердцу и мягко кивает.",
      "Puts a paw over his heart and nods gently.",
    ),
    primaryColor: "#96624c",
    secondaryColor: "#ebc4a0",
    rarity: "special",
    line: l(
      "Асықпа. Будем учиться в вашем темпе.",
      "Асықпа. We’ll learn at your pace.",
    ),
    support: l(
      "Тағы бір рет байқап көрейік! Попробуем ещё раз вместе.",
      "Тағы бір рет байқап көрейік! Let’s try again together.",
    ),
    success: l(
      "Жарайсың! Я знал, что у вас получится.",
      "Жарайсың! I knew you could do it.",
    ),
  },
  {
    id: "qyran",
    name: "Қыран",
    animalType: l("Бүркіт · Беркут", "Бүркіт · Golden eagle"),
    description: l(
      "Помогает увидеть следующую вершину на учебном маршруте.",
      "Helps you spot the next summit on your learning path.",
    ),
    personality: l(
      "Смелый, собранный и целеустремлённый.",
      "Brave, focused and determined.",
    ),
    quirk: l(
      "Расправляет крылья и взлетает на новом уровне.",
      "Spreads his wings and rises at each new level.",
    ),
    primaryColor: "#775750",
    secondaryColor: "#ffe5ad",
    rarity: "special",
    line: l(
      "Алға! Следующая вершина уже видна.",
      "Алға! The next summit is in sight.",
    ),
    support: l(
      "Даже орёл учится летать постепенно. Сделаем ещё попытку.",
      "Even an eagle learns to fly step by step. Let’s try again.",
    ),
    success: l(
      "Керемет! Вы поднялись ещё выше.",
      "Керемет! You’ve climbed a little higher.",
    ),
  },
  {
    id: "aibar",
    name: "Айбар",
    animalType: l("Қар барысы · Снежный барс", "Қар барысы · Snow leopard"),
    description: l(
      "Замечает серии верных ответов и радуется вашей уверенности.",
      "Notices correct-answer streaks and celebrates your confidence.",
    ),
    personality: l(
      "Уверенный, ловкий, надёжный.",
      "Confident, agile and dependable.",
    ),
    quirk: l(
      "Совершает победный прыжок после трёх верных ответов подряд.",
      "Makes a victory leap after three correct answers in a row.",
    ),
    primaryColor: "#a6bcc9",
    secondaryColor: "#f3f6ee",
    rarity: "rare",
    line: l(
      "Бірге үйренейік! Найдём ваш уверенный ритм.",
      "Бірге үйренейік! Let’s find your confident rhythm.",
    ),
    support: l(
      "Ничего страшного. Точность приходит с практикой.",
      "That’s okay. Accuracy comes with practice.",
    ),
    success: l(
      "Жеңіс! Отличный ответ — уверенный шаг.",
      "Жеңіс! A great answer, a confident step.",
    ),
  },
  {
    id: "aqbota",
    name: "Ақбота",
    animalType: l("Бота · Верблюжонок", "Бота · Camel calf"),
    description: l(
      "Носит карту, любит дорогу и знакомиться с новыми людьми.",
      "Carries a map, loves travelling and meeting new people.",
    ),
    personality: l(
      "Добродушная, открытая и любознательная.",
      "Kind-hearted, open and curious.",
    ),
    quirk: l(
      "В туристических заданиях достаёт карту и дорожную сумку.",
      "Brings a map and travel bag to travel exercises.",
    ),
    primaryColor: "#d7af79",
    secondaryColor: "#fff1d5",
    rarity: "rare",
    line: l(
      "Сапарға шығайық! Куда отправимся сегодня?",
      "Сапарға шығайық! Where shall we go today?",
    ),
    support: l(
      "Можно остановиться и посмотреть на карту. Мы найдём дорогу.",
      "We can stop and check the map. We’ll find our way.",
    ),
    success: l(
      "Тамаша! Ещё одна фраза для нашего путешествия.",
      "Тамаша! Another phrase for our journey.",
    ),
  },
  {
    id: "danaqulaq",
    name: "Данақұлақ",
    animalType: l("Үкі · Сова", "Үкі · Owl"),
    description: l(
      "Помогает замечать детали в книгах и разбираться в сложных мыслях.",
      "Helps you notice details in books and untangle complex ideas.",
    ),
    personality: l(
      "Мудрая, спокойная и вдумчивая.",
      "Wise, calm and thoughtful.",
    ),
    quirk: l(
      "Открывает книгу, наклоняет голову и предлагает полезную подсказку.",
      "Opens a book, tilts her head and offers a useful hint.",
    ),
    primaryColor: "#80719b",
    secondaryColor: "#f4e9d8",
    rarity: "rare",
    line: l(
      "Ойланайық. Каждая история хранит важную мысль.",
      "Ойланайық. Every story holds an important idea.",
    ),
    support: l(
      "Вернёмся к примеру. Ответ можно найти шаг за шагом.",
      "Let’s return to the example. We can find the answer step by step.",
    ),
    success: l(
      "Дұрыс! Вы заметили важную деталь.",
      "Дұрыс! You noticed an important detail.",
    ),
  },
  {
    id: "samuryq",
    name: "Самұрық",
    animalType: l("Аңыз құсы · Птица легенд", "Аңыз құсы · Legendary bird"),
    description: l(
      "Хранитель света и знаний. Появляется у тех, кто набрал 1000 XP.",
      "Guardian of light and knowledge. Appears when you reach 1,000 XP.",
    ),
    personality: l(
      "Вдохновляющий, благородный и доброжелательный.",
      "Inspiring, noble and kind.",
    ),
    quirk: l(
      "Окружает учебный путь мягким светом и национальным орнаментом.",
      "Surrounds your learning path with gentle light and Kazakh ornament.",
    ),
    primaryColor: "#38a6a2",
    secondaryColor: "#ffe2a3",
    rarity: "legendary",
    line: l(
      "Білім — қанат. Пусть знания станут вашими крыльями.",
      "Білім — қанат. Let knowledge become your wings.",
    ),
    support: l(
      "Большой путь состоит из попыток. Ваш свет не погас.",
      "A great journey is made of attempts. Your light still shines.",
    ),
    success: l(
      "Керемет! Ещё одна искра знаний.",
      "Керемет! Another spark of knowledge.",
    ),
  },
];
export const characters: Character[] = bios.map((b) => ({
  ...b,
  unlockXP: unlockRequirements.find((r) => r.characterId === b.id)!.xp,
  imageUrl: `/characters/${b.id}.svg`,
  animationUrls: {},
  isLegendary: b.id === "samuryq",
  dialogueLines: {
    greeting: b.line,
    waiting: l(
      "Я рядом. Продолжайте, когда будете готовы.",
      "I’m here. Continue when you feel ready.",
    ),
    thinking: b.line,
    joy: b.success,
    support: b.support,
    celebration: l(
      "Жаңа деңгей! Празднуем ваши новые знания.",
      "Жаңа деңгей! Let’s celebrate your new knowledge.",
    ),
    sleep: l(
      "Демалайық. Отдых тоже помогает учиться.",
      "Демалайық. Rest helps us learn too.",
    ),
    running: l(
      "Кеттік! Читайте внимательно, таймер не страшен.",
      "Кеттік! Read carefully. The timer is nothing to fear.",
    ),
    victory: b.success,
  },
}));
const item = (
  id: string,
  ru: string,
  en: string,
  descRu: string,
  descEn: string,
  price: number,
  slot: ShopItem["slot"],
  visual: string,
  color: string,
  rarity: Rarity = "common",
  compatibleCharacters?: CharacterId[],
): ShopItem => ({
  id,
  title: l(ru, en),
  description: l(descRu, descEn),
  price,
  slot,
  visual,
  color,
  rarity,
  compatibleCharacters,
});
export const characterShop: ShopItem[] = [
  item(
    "skin-steppe",
    "Степное золото",
    "Steppe gold",
    "Тёплая золотая палитра для вашего друга.",
    "A warm golden palette for your companion.",
    40,
    "skin",
    "skin",
    "#d99d44",
    "special",
  ),
  item(
    "skin-night",
    "Ночное небо",
    "Night sky",
    "Глубокая синяя палитра с мягкими акцентами.",
    "A deep blue palette with gentle accents.",
    60,
    "skin",
    "skin",
    "#6672b5",
    "rare",
  ),
  item(
    "skin-spring",
    "Весенняя мята",
    "Spring mint",
    "Свежая зелёная палитра степной весны.",
    "A fresh green palette inspired by spring.",
    50,
    "skin",
    "skin",
    "#60a995",
    "special",
  ),
  item(
    "scarf",
    "Дорожный шарф",
    "Travel scarf",
    "Мягкий шарф для любого персонажа.",
    "A soft scarf for every companion.",
    30,
    "neck",
    "scarf",
    "#e27950",
  ),
  item(
    "shapan",
    "Өрнекті шапан",
    "Ornamented shapan",
    "Национальный халат с геометрическим орнаментом.",
    "A traditional robe with a geometric ornament.",
    65,
    "outfit",
    "shapan",
    "#315f83",
    "rare",
  ),
  item(
    "taqiya",
    "Тақия",
    "Taqiya",
    "Небольшая тюбетейка с золотой вышивкой.",
    "A small cap with golden embroidery.",
    25,
    "hat",
    "taqiya",
    "#22897c",
    "special",
  ),
  item(
    "glasses",
    "Очки исследователя",
    "Explorer glasses",
    "Круглая оправа для внимательных открытий.",
    "Round frames for curious discoveries.",
    20,
    "eyewear",
    "glasses",
    "#54617e",
  ),
  item(
    "backpack",
    "Рюкзак путешественника",
    "Traveller backpack",
    "Компактный рюкзак для новых маршрутов.",
    "A compact backpack for new paths.",
    35,
    "back",
    "backpack",
    "#c77b51",
  ),
  item(
    "dictionary",
    "Сөздік · Словарь",
    "Сөздік · Dictionary",
    "Карманный словарь Тілмаша.",
    "Tilmash’s pocket dictionary.",
    20,
    "hand",
    "book",
    "#607ac7",
    "common",
    ["tilmash"],
  ),
  item(
    "book",
    "Книга историй",
    "Book of stories",
    "Сборник Данақұлақ для вдумчивого чтения.",
    "Danaqulaq’s collection for thoughtful reading.",
    30,
    "hand",
    "book",
    "#876baf",
    "special",
    ["danaqulaq"],
  ),
  item(
    "map",
    "Карта путешествий",
    "Travel map",
    "Карта новых мест для Ақботы.",
    "A map of new places for Aqbota.",
    25,
    "hand",
    "map",
    "#64a890",
    "common",
    ["aqbota"],
  ),
  item(
    "room-steppe",
    "Уютная степь",
    "Cosy steppe",
    "Панорама степи в комнате вашего друга.",
    "A steppe panorama in your companion’s room.",
    45,
    "room",
    "room",
    "#a0bf9a",
    "special",
  ),
  item(
    "frame",
    "Золотой орнамент",
    "Golden ornament",
    "Рамка профиля с геометрическим узором.",
    "A profile frame with a geometric pattern.",
    40,
    "frame",
    "frame",
    "#d9b15c",
    "rare",
  ),
  item(
    "victory-stars",
    "Шашу · Звёзды победы",
    "Шашу · Victory stars",
    "Предсказуемая праздничная анимация без случайных наград.",
    "A festive animation with no random rewards.",
    80,
    "victory",
    "stars",
    "#e1b859",
    "legendary",
  ),
  item(
    "mint",
    "Мятная тема",
    "Mint theme",
    "Спокойные зелёные акценты интерфейса.",
    "Calm green interface accents.",
    50,
    "theme",
    "theme",
    "#29937c",
    "special",
  ),
  item(
    "hint",
    "Подсказка: первое слово",
    "Hint: first word",
    "Постоянная подсказка первого слова в заданиях.",
    "A reusable first-word hint in exercises.",
    5,
    undefined,
    "hint",
    "#e4b153",
  ),
];
export const globalSlots = ["room", "frame", "victory", "theme"] as const;
export const characterById = (id: string) =>
  characters.find((c) => c.id === id);
export const shopItemById = (id: string) =>
  characterShop.find((i) => i.id === id);
export const canWear = (item: ShopItem, characterId: CharacterId) =>
  !item.compatibleCharacters || item.compatibleCharacters.includes(characterId);
export const unlockedCharacters = (xp: number) =>
  characters.filter((c) => xp >= c.unlockXP);
export const slotLabels: Record<string, Localized> = {
  skin: l("Скин", "Skin"),
  outfit: l("Одежда", "Outfit"),
  hat: l("Головной убор", "Hat"),
  eyewear: l("Очки", "Glasses"),
  back: l("Рюкзак", "Backpack"),
  hand: l("В лапах", "Hand-held"),
  neck: l("Шарф", "Scarf"),
  room: l("Комната", "Room"),
  frame: l("Рамка профиля", "Profile frame"),
  victory: l("Победный эффект", "Victory effect"),
  theme: l("Тема", "Theme"),
};
