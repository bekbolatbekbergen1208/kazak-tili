import type {
  Achievement,
  Book,
  Course,
  DailyQuest,
  Exercise,
  LearningGoal,
  Lesson,
  Localized,
} from "./types";
export const L = (ru: string, en: string): Localized => ({ ru, en });
export const goals: {
  id: LearningGoal;
  title: Localized;
  description: Localized;
  icon: string;
}[] = [
  {
    id: "tourism",
    title: L("Туризм", "Travel"),
    description: L(
      "От первого приветствия до путешествия по Алматы.",
      "From your first greeting to exploring Almaty.",
    ),
    icon: "✈️",
  },
  {
    id: "work",
    title: L("Работа", "Work"),
    description: L(
      "Коллеги, встречи и уверенное общение.",
      "Colleagues, meetings and confident communication.",
    ),
    icon: "💼",
  },
  {
    id: "study",
    title: L("Учёба", "Study"),
    description: L(
      "Задавайте вопросы и делитесь знаниями.",
      "Ask questions and share what you know.",
    ),
    icon: "🎓",
  },
  {
    id: "daily",
    title: L(
      "Күнделікті өмір · Повседневная жизнь",
      "Күнделікті өмір · Everyday life",
    ),
    description: L(
      "Семья, друзья и маленькие разговоры каждый день.",
      "Family, friends and everyday conversations.",
    ),
    icon: "☀️",
  },
  {
    id: "books",
    title: L(
      "Шығармаларды бекіту · Произведения",
      "Шығармаларды бекіту · Literature",
    ),
    description: L(
      "Читайте, узнавайте героев и обсуждайте идеи.",
      "Read, discover characters and discuss ideas.",
    ),
    icon: "📚",
  },
];
// Each row is a reviewed learning phrase, not UI copy. New courses use the same exercise engine.
type Phrase = [string, string, string, string, string];
const phrases: Record<Exclude<LearningGoal, "books">, Phrase[]> = {
  tourism: [
    [
      "Сәлеметсіз бе",
      "Здравствуйте",
      "Hello",
      "Вы знакомитесь с местным жителем. Поздоровайтесь вежливо.",
      "You meet a local resident. Greet them politely.",
    ],
    [
      "Әуежайға қалай баруға болады",
      "Как добраться до аэропорта",
      "How can I get to the airport",
      "Вам нужно в аэропорт. Спросите дорогу.",
      "You need to reach the airport. Ask for directions.",
    ],
    [
      "Маған бір билет керек",
      "Мне нужен один билет",
      "I need one ticket",
      "Вы у кассы вокзала. Попросите один билет.",
      "You are at the station ticket office. Ask for one ticket.",
    ],
    [
      "Бос бөлме бар ма",
      "Есть ли свободный номер",
      "Is there a room available",
      "Вы приехали в гостиницу без бронирования.",
      "You arrive at a hotel without a reservation.",
    ],
    [
      "Маған мәзірді беріңізші",
      "Дайте мне меню, пожалуйста",
      "Please give me the menu",
      "Вы в кафе. Вежливо попросите меню.",
      "You are at a café. Politely ask for the menu.",
    ],
    [
      "Бұл қанша тұрады",
      "Сколько это стоит",
      "How much does this cost",
      "Вы покупаете сувенир. Узнайте цену.",
      "You are buying a souvenir. Ask the price.",
    ],
    [
      "Медеуге қалай баруға болады",
      "Как добраться до Медеу",
      "How can I get to Medeu",
      "Вы приехали в Алматы и хотите добраться до Медеу.",
      "You have arrived in Almaty and want to get to Medeu.",
    ],
    [
      "Автобус аялдамасы қайда",
      "Где автобусная остановка",
      "Where is the bus stop",
      "Вы ищете городской транспорт.",
      "You are looking for public transport.",
    ],
    [
      "Маған көмектесіңізші",
      "Помогите мне, пожалуйста",
      "Please help me",
      "Вы заблудились. Вежливо попросите помощи.",
      "You are lost. Politely ask for help.",
    ],
    [
      "Дәрігер шақырыңызшы",
      "Позовите врача, пожалуйста",
      "Please call a doctor",
      "Человеку нужна медицинская помощь. Попросите вызвать врача.",
      "Someone needs medical help. Ask for a doctor.",
    ],
  ],
  work: [
    [
      "Менің атым Айдана",
      "Меня зовут Айдана",
      "My name is Aidana",
      "Представьтесь новым коллегам как Айдана.",
      "Introduce yourself to new colleagues as Aidana.",
    ],
    [
      "Мен мұғалім болып жұмыс істеймін",
      "Я работаю учителем",
      "I work as a teacher",
      "На собеседовании назовите свою профессию: учитель.",
      "At an interview, say that you work as a teacher.",
    ],
    [
      "Менің жұмыс орным осында",
      "Моё рабочее место здесь",
      "My workplace is here",
      "Покажите коллеге своё рабочее место.",
      "Show a colleague your workplace.",
    ],
    [
      "Хатыңызға рақмет",
      "Спасибо за ваше письмо",
      "Thank you for your letter",
      "Начните вежливый ответ на деловое письмо.",
      "Start a polite reply to a business letter.",
    ],
    [
      "Жиналыс сағат онда басталады",
      "Совещание начинается в десять",
      "The meeting starts at ten",
      "Сообщите коллегам время совещания.",
      "Tell your colleagues when the meeting starts.",
    ],
    [
      "Кейінірек қоңырау шаламын",
      "Я позвоню позже",
      "I will call later",
      "Вы заняты. Пообещайте позвонить позже.",
      "You are busy. Say you will call later.",
    ],
    [
      "Құжатты жіберіңізші",
      "Отправьте документ, пожалуйста",
      "Please send the document",
      "Вежливо попросите прислать документ.",
      "Politely ask someone to send a document.",
    ],
    [
      "Біз жаңа жоба дайындап жатырмыз",
      "Мы готовим новый проект",
      "We are preparing a new project",
      "Расскажите о текущей работе команды.",
      "Describe what your team is working on.",
    ],
    [
      "Менің жұмыс тәжірибем бар",
      "У меня есть опыт работы",
      "I have work experience",
      "На собеседовании скажите об опыте работы.",
      "Mention your work experience at an interview.",
    ],
    [
      "Менің бір ұсынысым бар",
      "У меня есть одно предложение",
      "I have a suggestion",
      "Вы хотите поделиться идеей на встрече.",
      "You want to share an idea at a meeting.",
    ],
  ],
  study: [
    [
      "Маған дәптер керек",
      "Мне нужна тетрадь",
      "I need a notebook",
      "Для урока нужна тетрадь. Скажите об этом.",
      "You need a notebook for class. Say so.",
    ],
    [
      "Маған қазақ тілі ұнайды",
      "Мне нравится казахский язык",
      "I like Kazakh",
      "Назовите предмет, который вам нравится: казахский язык.",
      "Say that you like studying Kazakh.",
    ],
    [
      "Қайталап айтыңызшы",
      "Повторите, пожалуйста",
      "Please say it again",
      "Вы не расслышали учителя. Попросите повторить.",
      "You did not hear the teacher. Ask them to repeat.",
    ],
    [
      "Сұрақ қоюға бола ма",
      "Можно задать вопрос",
      "May I ask a question",
      "Вы хотите задать вопрос на уроке.",
      "You want to ask a question in class.",
    ],
    [
      "Мен тапсырманы орындадым",
      "Я выполнил задание",
      "I have completed the task",
      "Сообщите учителю о выполненном задании.",
      "Tell the teacher you have finished the task.",
    ],
    [
      "Сабақ сағат тоғызда басталады",
      "Урок начинается в девять",
      "The lesson starts at nine",
      "Объясните другу расписание.",
      "Tell a friend when class starts.",
    ],
    [
      "Мен жақсы баға алдым",
      "Я получил хорошую оценку",
      "I got a good grade",
      "Расскажите о хорошем результате.",
      "Share your good result.",
    ],
    [
      "Біз бірге жоба жасаймыз",
      "Мы вместе делаем проект",
      "We are doing a project together",
      "Расскажите о совместном учебном проекте.",
      "Describe a shared school project.",
    ],
    [
      "Мен бүгін баяндама жасаймын",
      "Сегодня я делаю доклад",
      "I am giving a presentation today",
      "Сообщите о своём выступлении сегодня.",
      "Say that you are presenting today.",
    ],
    [
      "Мен емтиханға дайындалып жатырмын",
      "Я готовлюсь к экзамену",
      "I am preparing for an exam",
      "Расскажите о подготовке к экзамену.",
      "Say you are preparing for an exam.",
    ],
  ],
  daily: [
    [
      "Менің отбасым үлкен",
      "Моя семья большая",
      "My family is large",
      "Расскажите о своей большой семье.",
      "Describe your large family.",
    ],
    [
      "Мен досыммен кездесемін",
      "Я встречусь с другом",
      "I will meet my friend",
      "Поделитесь планом встретиться с другом.",
      "Share your plan to meet a friend.",
    ],
    [
      "Мен үйде демаламын",
      "Я отдыхаю дома",
      "I relax at home",
      "Расскажите, где вы отдыхаете.",
      "Say where you relax.",
    ],
    [
      "Маған нан мен сүт керек",
      "Мне нужны хлеб и молоко",
      "I need bread and milk",
      "Назовите два продукта в магазине.",
      "Ask for two groceries at the shop.",
    ],
    [
      "Бүгін күн жылы",
      "Сегодня тепло",
      "It is warm today",
      "Опишите сегодняшнюю тёплую погоду.",
      "Describe today’s warm weather.",
    ],
    [
      "Қазір сағат бес",
      "Сейчас пять часов",
      "It is five o’clock",
      "Ответьте на вопрос о времени: пять часов.",
      "Say that it is five o’clock.",
    ],
    [
      "Мен кітап оқығанды ұнатамын",
      "Я люблю читать книги",
      "I like reading books",
      "Расскажите о своём хобби — чтении.",
      "Talk about your hobby: reading.",
    ],
    [
      "Мен досыма хабарлама жаздым",
      "Я написал другу сообщение",
      "I wrote a message to my friend",
      "Расскажите об отправленном сообщении.",
      "Talk about a message you wrote.",
    ],
    [
      "Мен автобуспен барамын",
      "Я поеду на автобусе",
      "I will go by bus",
      "Назовите выбранный транспорт.",
      "Say which transport you will take.",
    ],
    [
      "Ертең дүкенге барамын",
      "Завтра я пойду в магазин",
      "I will go to the shop tomorrow",
      "Расскажите о планах на завтра.",
      "Share your plans for tomorrow.",
    ],
  ],
};
function makeLesson(
  goal: Exclude<LearningGoal, "books">,
  row: Phrase,
  index: number,
): Lesson {
  const [kk, ru, en, situationRu, situationEn] = row,
    id = `${goal}-${index + 1}`;
  const translation = L(ru, en),
    words = kk.split(" "),
    last = words.at(-1)!;
  const base = {
    explanation: L(
      `«${kk}» означает «${ru}». Обратите внимание на порядок слов в образце.`,
      `“${kk}” means “${en}”. Notice the word order in the example.`,
    ),
    translation,
    example: kk,
  };
  const alternatives = phrases[goal]
    .filter((x) => x !== row)
    .slice(index % 7, (index % 7) + 2);
  const opts = [
    { id: "correct", text: translation },
    ...alternatives.map((x, i) => ({ id: `other${i}`, text: L(x[1], x[2]) })),
  ];
  const ex = (
    suffix: string,
    extra: Omit<Exercise, "id" | "explanation" | "translation" | "example">,
  ): Exercise => ({ ...base, id: `${id}-${suffix}`, ...extra });
  return {
    id,
    goal,
    sectionId: `${goal}-${index < 5 ? "a" : "b"}`,
    title: translation,
    kind:
      index % 5 === 4
        ? "test"
        : index % 5 === 3
          ? "review"
          : index % 5 === 2
            ? "game"
            : "lesson",
    exercises: [
      ex("meaning", {
        kind:
          index % 5 === 2 ? "timed" : index % 5 === 3 ? "flashcard" : "choice",
        prompt: L(
          `Выберите перевод: «${kk}»`,
          `Choose the translation: “${kk}”`,
        ),
        answer: "correct",
        options: opts,
      }),
      ex("sentence", {
        kind: index % 5 === 1 ? "correction" : "sentence",
        prompt: L(`Составьте фразу: «${ru}»`, `Build the phrase: “${en}”`),
        answer: kk,
        words: [...words].reverse(),
      }),
      ex("gap", {
        kind: "gap",
        prompt: L(
          `Заполните пропуск: ${words.slice(0, -1).join(" ")} ___`,
          `Fill the gap: ${words.slice(0, -1).join(" ")} ___`,
        ),
        answer: last,
      }),
      ex("use", {
        kind:
          index % 5 === 1
            ? "listening"
            : index % 5 === 2
              ? "speaking"
              : index % 5 === 3
                ? "dialogue"
                : "situation",
        prompt: L(situationRu, situationEn),
        answer: kk,
        audio: kk,
        options: [
          { id: kk, text: kk },
          ...alternatives.map((x) => ({ id: x[0], text: x[0] })),
        ],
      }),
      ex("match", {
        kind: "match",
        prompt: L(
          "Сопоставьте фразы с переводами.",
          "Match the phrases to their translations.",
        ),
        answer: "0,1,2",
        pairs: [row, ...alternatives].map((x) => ({
          kk: x[0],
          translation: L(x[1], x[2]),
        })),
      }),
    ],
  };
}
export const books: Book[] = [
  {
    id: "father-son",
    title: "Әке мен бала",
    author: "Ыбырай Алтынсарин",
    source:
      "https://adebiportal.kz/ru/news/view/stranicka-ucenika-ybyrai-altynsarin__23580",
    summary: L(
      "Отец подбирает старую подкову, которую сын поленился поднять. Продав её, он покупает вишни. Сын много раз наклоняется за ягодами и понимает ценность небольшого труда.",
      "A father picks up an old horseshoe that his son would not bother to lift. He sells it and buys cherries. The son bends down repeatedly to pick up berries and learns the value of small efforts.",
    ),
    characters: [
      {
        name: "Әке",
        description: L(
          "Отец: учит примером.",
          "Father: teaches through his actions.",
        ),
      },
      {
        name: "Бала",
        description: L(
          "Сын: учится ценить труд.",
          "Son: learns to value effort.",
        ),
      },
    ],
    events: [
      L("Отец находит подкову.", "The father finds a horseshoe."),
      L(
        "Отец продаёт подкову и покупает вишни.",
        "The father sells the horseshoe and buys cherries.",
      ),
      L("Сын подбирает упавшие вишни.", "The son picks up fallen cherries."),
    ],
    vocabulary: [
      { kk: "таға", translation: L("подкова", "horseshoe") },
      { kk: "еңбек", translation: L("труд", "effort") },
      { kk: "шие", translation: L("вишня", "cherry") },
    ],
    chapters: [],
    quiz: { bookId: "father-son", lessonId: "books-2" },
  },
  {
    id: "precious-herb",
    title: "Асыл шөп",
    author: "Ыбырай Алтынсарин",
    source:
      "https://adebiportal.kz/ru/news/view/stranicka-ucenika-ybyrai-altynsarin__23580",
    summary: L(
      "Зылиха и Батима несут тяжёлые корзины с фруктами. Зылиха жалуется, а Батима спокойно продолжает путь. Её «драгоценная трава» — терпение: оно помогает справляться с трудностями.",
      "Zyliha and Batima carry heavy loads of fruit. Zyliha complains, while Batima keeps going calmly. Her “precious herb” is patience, which helps her face difficulties.",
    ),
    characters: [
      {
        name: "Зылиха",
        description: L(
          "Жалуется на тяжесть ноши.",
          "Complains about the heavy load.",
        ),
      },
      {
        name: "Бәтима",
        description: L(
          "Объясняет силу терпения.",
          "Explains the power of patience.",
        ),
      },
    ],
    events: [
      L("Девушки несут фрукты.", "The girls carry fruit."),
      L("Зылиха жалуется.", "Zyliha complains."),
      L("Батима говорит о терпении.", "Batima talks about patience."),
    ],
    vocabulary: [
      { kk: "сабыр", translation: L("терпение", "patience") },
      { kk: "жеміс", translation: L("фрукт", "fruit") },
      { kk: "ауыр", translation: L("тяжёлый", "heavy") },
    ],
    chapters: [],
    quiz: { bookId: "precious-herb", lessonId: "books-4" },
  },
];
books.forEach((b) => {
  b.chapters = [
    {
      id: `${b.id}-summary`,
      title: L("Краткое содержание", "Summary"),
      summary: b.summary,
    },
  ];
});
function bookLesson(index: number): Lesson {
  const book = books[index < 2 ? 0 : 1],
    id = `books-${index + 1}`,
    isFather = book.id === "father-son";
  const base = {
    translation: L(
      "Подумайте о поступках героев.",
      "Think about the characters’ actions.",
    ),
    example: isFather ? "Еңбек ету керек." : "Сабыр сақтау керек.",
    explanation: L(
      "Ответ опирается на краткое содержание произведения выше.",
      "The answer follows the story summary above.",
    ),
  };
  const e = (
    n: number,
    x: Omit<Exercise, "id" | "translation" | "example" | "explanation">,
  ): Exercise => ({ ...base, id: `${id}-${n}`, ...x });
  const vocab = book.vocabulary[0];
  return {
    id,
    goal: "books",
    sectionId: "books-a",
    bookId: book.id,
    kind: index === 1 || index === 3 || index === 4 ? "test" : "lesson",
    title: L(
      `${book.title}: ${index % 2 ? "проверка понимания" : "герои и слова"}`,
      `${book.title}: ${index % 2 ? "comprehension quiz" : "characters and words"}`,
    ),
    exercises: [
      e(1, {
        kind: "choice",
        prompt: L(
          isFather
            ? "Что отец подобрал на дороге?"
            : "Что означает «асыл шөп» в рассказе?",
          isFather
            ? "What did the father pick up on the road?"
            : "What does “precious herb” stand for in the story?",
        ),
        answer: "a",
        options: [
          {
            id: "a",
            text: isFather
              ? L("Подкову", "A horseshoe")
              : L("Терпение", "Patience"),
          },
          { id: "b", text: L("Книгу", "A book") },
          { id: "c", text: L("Монету", "A coin") },
        ],
      }),
      e(2, {
        kind: "order",
        prompt: L(
          "Расположите события по порядку.",
          "Put the events in order.",
        ),
        answer: "0 1 2",
        options: book.events.map((text, i) => ({ id: String(i), text })),
      }),
      e(3, {
        kind: "match",
        prompt: L(
          "Сопоставьте героя и его действие.",
          "Match each character to their action.",
        ),
        answer: "0,1",
        pairs: book.characters.map((c) => ({
          kk: c.name,
          translation: c.description,
        })),
      }),
      e(4, {
        kind: "gap",
        prompt: L(
          `Напишите казахское слово: «${vocab.translation.ru}».`,
          `Write the Kazakh word for “${vocab.translation.en}”.`,
        ),
        answer: vocab.kk,
      }),
      e(5, {
        kind: "open",
        prompt: L(
          isFather
            ? "Чему научился сын? Напишите ответ и сравните с образцом."
            : "Как терпение помогает вам учиться? Напишите ответ и сравните с образцом.",
          isFather
            ? "What did the son learn? Write your answer and compare it with the model."
            : "How does patience help you learn? Write your answer and compare it with the model.",
        ),
        answer: isFather ? "Еңбек ету керек." : "Сабыр сақтау керек.",
      }),
    ],
  };
}
export const lessons: Lesson[] = [
  ...Object.entries(phrases).flatMap(([goal, rows]) =>
    rows.map((r, i) =>
      makeLesson(goal as Exclude<LearningGoal, "books">, r, i),
    ),
  ),
  ...Array.from({ length: 5 }, (_, i) => bookLesson(i)),
];
export const courses: Course[] = goals.map((g) => ({
  ...g,
  topics:
    g.id === "books"
      ? books.map((b) => L(b.title, b.title))
      : phrases[g.id].map((p) => L(p[1], p[2])),
  sections: (g.id === "books" ? ["a"] : ["a", "b"]).map((s, i) => ({
    id: `${g.id}-${s}`,
    title:
      i === 0
        ? L("Первые шаги", "First steps")
        : L("Применяем в жизни", "Use it in real life"),
    lessonIds: lessons
      .filter((l) => l.sectionId === `${g.id}-${s}`)
      .map((l) => l.id),
  })),
}));
export const achievements: Achievement[] = [
  ["first", "Первый урок", "First lesson", "🌱"],
  ["hundred", "100 правильных ответов", "100 correct answers", "🎯"],
  ["week", "7 дней подряд", "7-day streak", "🔥"],
  ["perfect", "Идеальный урок", "Perfect lesson", "⭐"],
  ["section", "Первый раздел", "First section", "🧭"],
  ["thousand", "1 000 XP", "1,000 XP", "⚡"],
  ["tourism", "Знаток путешествий", "Travel expert", "✈️"],
  ["daily", "Мастер повседневных фраз", "Everyday phrase master", "☀️"],
  ["books", "Эксперт по произведениям", "Literature expert", "📚"],
].map(([id, ru, en, icon]) => ({ id, title: L(ru, en), icon }));
export const quests: DailyQuest[] = [
  {
    id: "lessons",
    title: L("Пройти два урока", "Complete two lessons"),
    target: 2,
    reward: 20,
    metric: "lessons",
  },
  {
    id: "words",
    title: L("Разобрать 10 фраз и слов", "Practise 10 phrases and words"),
    target: 10,
    reward: 15,
    metric: "words",
  },
  {
    id: "combo",
    title: L("Пять верных ответов подряд", "Five correct answers in a row"),
    target: 5,
    reward: 15,
    metric: "combo",
  },
  {
    id: "reviews",
    title: L("Повторить три ошибки", "Review three mistakes"),
    target: 3,
    reward: 15,
    metric: "reviews",
  },
  {
    id: "dialogues",
    title: L("Завершить один диалог", "Complete one dialogue"),
    target: 1,
    reward: 10,
    metric: "dialogues",
  },
];
export const shop = [
  {
    id: "scarf",
    title: L("Шарф для Досши", "Dossha’s scarf"),
    price: 30,
    icon: "🧣",
  },
  { id: "mint", title: L("Мятная тема", "Mint theme"), price: 50, icon: "🌿" },
  {
    id: "frame",
    title: L("Рамка профиля", "Profile frame"),
    price: 40,
    icon: "✨",
  },
  {
    id: "hint",
    title: L("Подсказка: первое слово", "Hint: first word"),
    price: 5,
    icon: "💡",
  },
];
export const lessonById = (id: string) => lessons.find((l) => l.id === id);
export const exerciseById = (id: string) =>
  lessons.flatMap((l) => l.exercises).find((e) => e.id === id);
