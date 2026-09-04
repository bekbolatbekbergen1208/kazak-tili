import {Mascot} from "./icons";
import type {CourseLesson} from "@/lib/curriculum";

type Scene = {place: string; sky: string; objects: string[]; intro: string};

const scenes: Record<string, Scene> = {
  "Саяхат": {place: "Әуежай", sky: "sky", objects: ["✈️", "🧳", "🎫", "🛫"], intro: "Біз әуежайдамыз. Сапарға керек заттарды бірге табайық!"},
  "Мектеп": {place: "Сынып", sky: "classroom", objects: ["📚", "✏️", "🎒", "🖍️", "📐"], intro: "Біз сыныптамыз. Мектептегі заттарды атап, сөйлем құрайық!"},
  "Отбасы": {place: "Үй", sky: "home", objects: ["🏠", "👨‍👩‍👧‍👦", "🛋️", "🖼️"], intro: "Бұл — жылы үй. Отбасы мүшелері туралы қазақша сөйлесейік!"},
  "Достық": {place: "Ойын алаңы", sky: "park", objects: ["🧒", "👧", "🤝", "⚽"], intro: "Достар бірге ойнап жүр. Достық пен көмек туралы айтайық!"},
  "Табиғат": {place: "Табиғат", sky: "nature", objects: ["⛰️", "🌲", "🌊", "🦋"], intro: "Таза ауаға шықтық. Табиғаттағы заттарды байқап көр!"},
  "Спорт": {place: "Стадион", sky: "sport", objects: ["⚽", "🏀", "🏃", "🏆"], intro: "Біз стадиондамыз. Қимыл мен спорт түрлерін атайық!"},
  "Тағам": {place: "Асхана", sky: "food", objects: ["🍞", "🥛", "🍎", "🥣"], intro: "Асханада дәмді тағамдар бар. Оларды қазақша атайық!"},
  "Қала": {place: "Қала көшесі", sky: "city", objects: ["🏢", "🚌", "🚦", "🌳"], intro: "Қала көшесімен келеміз. Көрген жерлерді атап шық!"},
  "Ауыл": {place: "Ауыл", sky: "village", objects: ["🏡", "🐄", "🌾", "🚜"], intro: "Біз ауылдамыз. Дала мен ауыл тіршілігін танып көр!"},
  "Киім": {place: "Киім дүкені", sky: "shop", objects: ["👕", "👗", "👟", "🧢"], intro: "Киім дүкеніне келдік. Түсін және атауын қазақша айт!"},
  "Денсаулық": {place: "Емхана", sky: "health", objects: ["🏥", "🩺", "💊", "🍊"], intro: "Денсаулықты күту маңызды. Пайдалы сөздерді бірге үйренейік!"},
  "Уақыт": {place: "Күн тәртібі", sky: "time", objects: ["⏰", "📅", "🌞", "🌙"], intro: "Күн тәртібін жоспарлайық. Уақытты қазақша айтып көр!"},
  "Ауа райы": {place: "Ауа райы", sky: "weather", objects: ["☀️", "☁️", "🌧️", "❄️"], intro: "Терезеге қара! Бүгінгі ауа райын сипаттайық."},
  "Мәдениет": {place: "Мұражай", sky: "culture", objects: ["🎵", "🪕", "🏺", "🎭"], intro: "Қазақ мәдениетімен танысамыз. Ұлттық мұраны бірге зерттейік!"},
  "Кітап": {place: "Кітапхана", sky: "library", objects: ["📚", "📖", "✍️", "🔖"], intro: "Кітапханаға келдік. Әңгіме мен кейіпкер туралы сөйлесейік!"},
  "Ғылым": {place: "Зертхана", sky: "science", objects: ["🔬", "🧪", "🧬", "💡"], intro: "Біз зертханадамыз. Тәжірибе жасап, жаңа сөздерді ашайық!"},
  "Технология": {place: "IT зертханасы", sky: "tech", objects: ["💻", "🤖", "⌨️", "🌐"], intro: "Технология әлеміне кірдік. Компьютер туралы қазақша сөйлесейік!"},
  "Экология": {place: "Жасыл әлем", sky: "eco", objects: ["♻️", "🌱", "💧", "🗑️"], intro: "Табиғатты қорғайық. Қоқысты сұрыптап, суды үнемдеуді үйрен!"},
  "Мамандық": {place: "Мамандықтар қаласы", sky: "jobs", objects: ["👩‍⚕️", "👨‍🏫", "👨‍🚀", "👷"], intro: "Әртүрлі мамандармен танысамыз. Кім не істейтінін айтып көр!"},
  "Қазақстан": {place: "Қазақстан", sky: "kazakhstan", objects: ["🇰🇿", "🏔️", "🏙️", "🦅"], intro: "Бұл — Қазақстан! Отанымыз туралы мақтанышпен сөйлесейік."},
};

const coachByStep = [
  "Көрініске мұқият қара. Қай сөз осы тақырыпқа сәйкес келеді?",
  "Алдымен сөйлемді тыңда. Таныс сөздерді естісең, мағынасын болжа.",
  "Орысша мағынаны оқып, қазақша сөйлемді өзің жаз.",
  "Үлгіге қарап жаз. Қазақ әріптерін дұрыс қолдануды ұмытпа!",
];

export default function LessonScene({lesson, step}: {lesson: CourseLesson; step: number}) {
  const scene = scenes[lesson.theme] ?? scenes["Қазақстан"];
  const message = step === 0 ? scene.intro : coachByStep[step];

  return <section className={`topicScene ${scene.sky}`} aria-label={`${lesson.theme}: интерактивті көрініс`}>
    <div className="scenePlace">{scene.place}</div>
    <div className="sceneObjects">{scene.objects.map((object, index) =>
      <span style={{"--object-delay": `${index * .35}s`} as React.CSSProperties} key={`${object}-${index}`}>{object}</span>
    )}</div>
    <div className="sceneCoach">
      <Mascot />
      <p><b>Досша:</b> {message}</p>
    </div>
  </section>;
}
