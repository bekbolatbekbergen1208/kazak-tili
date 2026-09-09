export const nationalGames = [
  {
    id: "asyk" as const,
    title: "Асық ату",
    description:
      "Сақаңды көзде, асықтарды шеңберден шығар. Әр соққы — жаңа мүмкіндік!",
    level: 1,
    difficulty: "Жеңіл",
    icon: "🎯",
  },
  {
    id: "arqan" as const,
    title: "Арқан тартыс",
    description:
      "Қазақша сөздерді тап, күшіңді жина және достық сайыста жеңіске жет!",
    level: 2,
    difficulty: "Орташа",
    icon: "🪢",
  },
];
export const questions = [
  {
    prompt: "«Сәлем» сөзінің аудармасын тап.",
    options: ["Hello", "Goodbye", "Thank you"],
    answer: 0,
    explanation: "Сәлем — Hello. Досыңмен осылай амандасасың.",
  },
  {
    prompt: "Бос орынды толтыр: Менің ... — Дос.",
    options: ["үйім", "атым", "суым"],
    answer: 1,
    explanation: "Менің атым — Дос. Атыңды осылай таныстырасың.",
  },
  {
    prompt: "Қайсысы жануар?",
    options: ["Кітап", "Тау", "Түлкі"],
    answer: 2,
    explanation: "Түлкі — жануар. Кітап — зат, тау — табиғат нысаны.",
  },
  {
    prompt: "«Рақмет» қашан айтылады?",
    options: ["Алғыс айтқанда", "Қоштасқанда", "Ұйықтағанда"],
    answer: 0,
    explanation: "Рақмет — алғыс білдіретін сөз.",
  },
  {
    prompt: "«Күш» сөзінің аудармасын тап.",
    options: ["Water", "Strength", "Book"],
    answer: 1,
    explanation: "Күш — Strength. Арқан тартысқа күш пен білім керек.",
  },
  {
    prompt: "Үштен кейін қай сан келеді?",
    options: ["Екі", "Бес", "Төрт"],
    answer: 2,
    explanation: "Бір, екі, үш, төрт, бес.",
  },
  {
    prompt: "«Дос» сөзінің аудармасын тап.",
    options: ["Friend", "Mountain", "Sun"],
    answer: 0,
    explanation: "Дос — Friend. Досыңды қолда!",
  },
  {
    prompt: "Аспанның түсі қандай?",
    options: ["Қызыл", "Көгілдір", "Жасыл"],
    answer: 1,
    explanation: "Ашық аспан көгілдір болады.",
  },
  {
    prompt: "«Мен қазақша ...» сөйлемін толықтыр.",
    options: ["үй", "кітап", "сөйлеймін"],
    answer: 2,
    explanation: "Мен қазақша сөйлеймін — I speak Kazakh.",
  },
  {
    prompt: "«Су» сөзінің аудармасын тап.",
    options: ["Water", "Fire", "Earth"],
    answer: 0,
    explanation: "Су — Water. Ойыннан кейін су ішуді ұмытпа.",
  },
  {
    prompt: "Қай сөз қоштасуды білдіреді?",
    options: ["Сәлем", "Сау бол", "Рақмет"],
    answer: 1,
    explanation: "Сау бол — Goodbye.",
  },
  {
    prompt: "Қазақстанның баспанасы — ...",
    options: ["Кеме", "Көлік", "Киіз үй"],
    answer: 2,
    explanation: "Киіз үй — қазақтың дәстүрлі баспанасы.",
  },
];
export function questionFor(id: string, turn: number) {
  let seed = 0;
  for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const index = (seed + turn) % questions.length,
    q = questions[index],
    shift = (seed + turn * 7) % 3;
  return {
    ...q,
    options: q.options.map((_, i) => q.options[(i + shift) % 3]),
    answer: (q.answer - shift + 3) % 3,
  };
}
export const statLabels = {
  strength: "Күш",
  accuracy: "Дәлдік",
  knowledge: "Білім",
};

export const crystalPrices: Record<string, number> = {
  "victory-stars": 6,
  "skin-night": 5,
};
export const itemNames: Record<string, string> = {
  "skin-steppe": "Дала алтыны",
  "skin-night": "Түнгі аспан",
  "skin-spring": "Көктемгі жалбыз",
  scarf: "Саяхатшының мойынорағышы",
  shapan: "Өрнекті шапан",
  taqiya: "Тақия",
  glasses: "Зерттеуші көзілдірігі",
  backpack: "Саяхатшы сөмкесі",
  dictionary: "Сөздік",
  book: "Әңгімелер кітабы",
  map: "Саяхат картасы",
  "room-steppe": "Жайлы дала",
  frame: "Алтын өрнек",
  "victory-stars": "Шашу · Жеңіс жұлдыздары",
  mint: "Жалбыз түсі",
  hint: "Бірінші сөзге көмек",
};
