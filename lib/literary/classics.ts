import type { CorpusItem } from "./types";

export type ClassicWork = {
  id: string;
  title: string;
  author: string;
  sourceUrl: string;
  excerpt: string;
  level: CorpusItem["level"];
  keywords: string[];
  explanation: string;
  vocabulary: { word: string; meaning: string; example: string }[];
  questions: { question: string; answer: string }[];
};

// Only the explicitly marked, source-checked excerpt is an author's quotation.
// Explanations, answers and practice sentences are original QazaqDos material.
export const classicWorks: ClassicWork[] = [
  {
    id: "abai-seventeen",
    title: "Он жетінші сөз",
    author: "Абай Құнанбайұлы",
    sourceUrl:
      "https://abaiacademy.kz/kz/abaevedenie/abaj-ara-szderini-tsindirmesi/Onzhetinshi-sz",
    excerpt:
      "Қайрат, ақыл, жүрек үшеуі өнерлерін айтысып, таласып келіп, ғылымға жүгініпті.",
    level: "B1",
    keywords: [
      "Абай",
      "он жетінші",
      "17-қарасөз",
      "17 қара сөз",
      "қайрат",
      "ақыл",
      "жүрек",
    ],
    explanation:
      "Қайрат, ақыл мен жүрек өздерінің маңызын дәлелдеуге тырысады. Ғылым оларды бірлікке шақырады, жүрекке жетекшілік береді. Адам білімін, күш-жігерін және мейірімін бірге қолдануы керек деген ой ашылады.",
    vocabulary: [
      {
        word: "қайрат",
        meaning: "Істі орындауға көмектесетін күш-жігер.",
        example: "Ол қиын тапсырманы қайрат пен сабырдың арқасында аяқтады.",
      },
      {
        word: "жүгіну",
        meaning: "Көмек немесе шешім сұрап біреуге бару.",
        example: "Мәселені түсіну үшін мұғалімге жүгіндім.",
      },
    ],
    questions: [
      {
        question: "Абайдың он жетінші қара сөзінің негізгі ойы қандай?",
        answer:
          "Ақыл, қайрат және жүрек бірлікте болуы керек. Ғылым оларды біріктіріп, жүректің адамгершілікке бастайтын рөлін көрсетеді.",
      },
      {
        question: "Он жетінші қара сөзде ғылымның қызметі қандай?",
        answer:
          "Ғылым қайрат, ақыл мен жүректің таласын тыңдап, оларды біріктіреді. Жүректі жетекші ету арқылы күш пен білімді адамгершілікпен байланыстырады.",
      },
      {
        question: "Он жетінші қара сөздегі кейіптеуді түсіндір.",
        answer:
          "Ақыл, қайрат және жүрек адам сияқты сөйлеп, пікір таластырады. Дерексіз ұғымдарға адам әрекетін беру кейіптеу деп аталады.",
      },
      {
        question:
          "Он жетінші қара сөздің идеясын күнделікті өмірмен байланыстыр.",
        answer:
          "Досыңа сабақ түсіндіргенде біліміңді пайдаланасың, қиындыққа шыдайсың және оны ренжітпеуге тырысасың. Бұл — ақыл, қайрат пен мейірімді бірге қолданудың жаңа оқу мысалы, Абайдың дәйексөзі емес.",
      },
    ],
  },
  {
    id: "altynsarin-garden",
    title: "Бақша ағаштары",
    author: "Ыбырай Алтынсарин",
    sourceUrl:
      "https://wikisource.org/w/index.php?title=Бақша_ағаштары&oldid=387169",
    excerpt:
      "— Олай болса, бағу-қағуда көп мағына бар екен ғой, — деді баласы.",
    level: "A2",
    keywords: [
      "Ыбырай",
      "Алтынсарин",
      "бақша ағаштары",
      "бағу-қағу",
      "тәрбие",
      "күтім",
    ],
    explanation:
      "Әкесі мен баласы бақтағы түзу және қисық өскен ағаштарды салыстырады. Ағаш күтімі бала тәрбиесімен байланыстырылады. Дұрыс бағыт пен пайдалы әдеттің маңызы диалог арқылы түсіндіріледі.",
    vocabulary: [
      {
        word: "бағу-қағу",
        meaning: "Күту, қамқорлық жасау.",
        example: "Көшетті бағу-қағу үшін оны уақытында суарамыз.",
      },
      {
        word: "өсиет",
        meaning: "Жақсылыққа бағыттайтын ақыл, кеңес.",
        example: "Атамның өсиетін есімде сақтадым.",
      },
    ],
    questions: [
      {
        question: "Бақша ағаштары әңгімесінің негізгі ойы қандай?",
        answer:
          "Ағашқа күтім керек болғандай, балаға да тәрбие мен дұрыс бағыт қажет. Әңгіме пайдалы әдетті үйренуге шақырады.",
      },
      {
        question: "Бақша ағаштарында әке мен бала нені салыстырады?",
        answer:
          "Олар күтіммен түзу өскен ағаш пен күтімсіз қисық өскен ағашты салыстырады. Әкесі осы айырма арқылы тәрбиенің маңызын түсіндіреді.",
      },
      {
        question: "Бақша ағаштарындағы бағу-қағу сөзінің мағынасы қандай?",
        answer:
          "Бағу-қағу — күтім мен қамқорлық жасау. Ағаш туралы айтқанда суару, бұтағын реттеу сияқты әрекеттерді білдіреді.",
      },
      {
        question: "Бақша ағаштарының идеясымен жаңа сөйлем құра.",
        answer:
          "Жақсы әдет күнделікті қамқорлық пен жаттығу арқылы қалыптасады. Бұл — QazaqDos құрастырған сөйлем, шығармадан алынған дәйексөз емес.",
      },
    ],
  },
  {
    id: "altynsarin-labour",
    title: "Өрмекші, құмырсқа, қарлығаш",
    author: "Ыбырай Алтынсарин",
    sourceUrl:
      "https://wikisource.org/w/index.php?title=Өрмекші,_құмырсқа,_қарлығаш&oldid=953772",
    excerpt:
      "Қарлығаш балапандарына ұя істеуге шөп жиып жүр. Жұмыссыз жүрген бір жан жоқ.",
    level: "A2",
    keywords: [
      "Ыбырай",
      "Алтынсарин",
      "өрмекші",
      "құмырсқа",
      "қарлығаш",
      "еңбек",
      "еңбекқорлық",
    ],
    explanation:
      "Атасы немересіне өрмекшінің, құмырсқаның және қарлығаштың тіршілігін көрсетеді. Олар қорек пен ұя үшін әрекет етеді. Осы бақылау арқылы атасы баланы еңбекке үйренуге шақырады.",
    vocabulary: [
      {
        word: "өнеге",
        meaning: "Үлгі болатын жақсы әрекет.",
        example: "Еңбекқор адам басқаларға өнеге көрсетеді.",
      },
      {
        word: "азық",
        meaning: "Тіршілікке қажетті тамақ, қорек.",
        example: "Құмырсқа ұясына азық тасиды.",
      },
    ],
    questions: [
      {
        question: "Өрмекші, құмырсқа, қарлығаш әңгімесі неге үйретеді?",
        answer:
          "Әңгіме еңбек етуге және уақытты пайдалы өткізуге үйретеді. Атасы баласына тіршілік иелерінің әрекетін үлгі етеді.",
      },
      {
        question:
          "Өрмекші, құмырсқа, қарлығаш әңгімесіндегі қарлығаш не істейді?",
        answer: "Қарлығаш балапандарына ұя жасау үшін шөп жинап жүр.",
      },
      {
        question:
          "Өрмекші, құмырсқа, қарлығаштағы өрмек тоқып жүр тіркесін түсіндір.",
        answer:
          "Өрмекші тор жасап жатыр. «Тоқып жүр» осы контексте жалғасып жатқан әрекетті білдіреді: тоқып — негізгі етістіктің көсемше тұлғасы, жүр — көмекші етістік.",
      },
      {
        question: "Өрмекші, құмырсқа, қарлығаш идеясымен жаңа сөйлем құра.",
        answer:
          "Күн сайын аз уақыт жаттықсам, қазақша сөйлеуім жақсарады. Бұл — еңбек туралы жаңа оқу мысалы, Ыбырайдың дәйексөзі емес.",
      },
    ],
  },
];

export function classicContext(work: ClassicWork) {
  return `${work.title} — ${work.author}.\nТексерілген қысқа үзінді: «${work.excerpt}»\nQazaqDos түсіндірмесі (автор дәйексөзі емес): ${work.explanation}\nСөздік: ${work.vocabulary.map((v) => `${v.word} — ${v.meaning}`).join(" ")}\nДереккөз: ${work.sourceUrl}\nТолық кітап мәтіні бұл жинаққа енгізілген жоқ. Бет нөмірін ойдан шығарма.`;
}

export const classicCorpus: CorpusItem[] = classicWorks.map((work) => ({
  id: `classic-${work.id}`,
  title: work.title,
  author: work.author,
  source_type: "literature",
  copyright_status: "short_approved_excerpt",
  license:
    "Short educational quotation; QazaqDos commentary and exercises are original.",
  rights_evidence: `Source-checked educational excerpt under 25 words, reviewed 2026-10-07: ${work.sourceUrl}. Only the marked excerpt is quoted; commentary is original. No complete edition reproduced.`,
  level: work.level,
  genre: work.author.startsWith("Абай") ? "қара сөз" : "әңгіме",
  style: "literary",
  topic: "қазақ әдебиеті",
  region: "Қазақстан",
  age_group: "school",
  text: classicContext(work),
  keywords: work.keywords,
  approved_by:
    "QazaqDos source-checked seed 2026-10-07; no human expert endorsement",
  status: "approved",
  created_at: "2026-10-07T00:00:00Z",
  quality_score: 85,
  language_quality: 85,
  educational_value: 90,
  age_suitability: 100,
  revision: 1,
}));
