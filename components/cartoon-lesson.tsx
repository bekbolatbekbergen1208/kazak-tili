"use client";

import { useState } from "react";
import { Check, Clapperboard, Eye, EyeOff, ExternalLink, Languages, Play, RotateCcw } from "lucide-react";
import { Shell, StudentTop } from "./shell";

type Word = { kk: string; ru: string; note: string };
type Phrase = { kk: string; ru: string; speaker: string };

const words: Word[] = [
  { kk: "Алдар Көсе", ru: "Алдар Косе", note: "главный герой" },
  { kk: "көсе", ru: "безбородый", note: "прозвище Алдара" },
  { kk: "алдау", ru: "обманывать", note: "вводить в заблуждение" },
  { kk: "алдану", ru: "быть обманутым", note: "поверить неправде" },
  { kk: "алдамшы", ru: "обманщик", note: "тот, кто обманывает" },
  { kk: "бай", ru: "богач", note: "богатый человек" },
  { kk: "хан", ru: "хан, правитель", note: "правитель страны" },
  { kk: "кедей", ru: "бедняк", note: "небогатый человек" },
  { kk: "шал", ru: "старик", note: "пожилой мужчина" },
  { kk: "кемпір", ru: "старушка", note: "пожилая женщина" },
  { kk: "айлакер", ru: "хитрый, находчивый", note: "умеет найти выход" },
  { kk: "қулық", ru: "хитрость", note: "ловкий замысел" },
  { kk: "өтірік", ru: "ложь", note: "неправда" },
  { kk: "ақылды", ru: "умный", note: "много знает" },
  { kk: "әділ", ru: "справедливый", note: "поступает честно" },
  { kk: "мейірімді", ru: "добрый", note: "заботится о других" },
  { kk: "ауыл", ru: "аул, деревня", note: "место, где живут люди" },
  { kk: "киіз үй", ru: "юрта", note: "традиционный дом" },
  { kk: "қонақ", ru: "гость", note: "пришедший в дом" },
  { kk: "дастарқан", ru: "накрытый стол", note: "стол с угощениями" },
  { kk: "ас", ru: "еда, угощение", note: "то, что едят" },
  { kk: "нан", ru: "хлеб", note: "продукт из теста" },
  { kk: "ет", ru: "мясо", note: "традиционное угощение" },
  { kk: "қазан", ru: "казан", note: "большая посуда для еды" },
  { kk: "алтын", ru: "золото", note: "дорогой металл" },
  { kk: "ақша", ru: "деньги", note: "средство оплаты" },
  { kk: "ат", ru: "лошадь", note: "животное для езды" },
  { kk: "жол", ru: "дорога, путь", note: "куда идут или едут" },
  { kk: "сапар", ru: "поездка, путешествие", note: "долгий путь" },
  { kk: "көмектесу", ru: "помогать", note: "делать добро другому" },
  { kk: "беру", ru: "давать", note: "передавать кому-то" },
  { kk: "алу", ru: "брать", note: "получать что-то" },
  { kk: "іздеу", ru: "искать", note: "пытаться найти" },
  { kk: "табу", ru: "находить", note: "обнаружить нужное" },
  { kk: "келу", ru: "приходить", note: "прибывать куда-то" },
  { kk: "кету", ru: "уходить", note: "покидать место" },
];

const phrases: Phrase[] = [
  { kk: "Ассалаумағалейкум!", ru: "Здравствуйте!", speaker: "приветствие" },
  { kk: "Қош келдіңіз!", ru: "Добро пожаловать!", speaker: "хозяин дома" },
  { kk: "Төрге шығыңыз.", ru: "Проходите на почётное место.", speaker: "хозяин дома" },
  { kk: "Дастарқанға келіңіз.", ru: "Подходите к столу.", speaker: "приглашение" },
  { kk: "Не істеп жүрсің?", ru: "Что ты делаешь?", speaker: "вопрос" },
  { kk: "Мен жол жүріп келемін.", ru: "Я иду (еду) в путь.", speaker: "путник" },
  { kk: "Маған көмектесіңізші.", ru: "Помогите мне, пожалуйста.", speaker: "просьба" },
  { kk: "Уәдеңде тұр!", ru: "Сдержи своё обещание!", speaker: "требование" },
  { kk: "Бұл әділ емес!", ru: "Это несправедливо!", speaker: "возмущение" },
  { kk: "Мен сені алдай алмаймын.", ru: "Я не могу тебя обмануть.", speaker: "обещание" },
  { kk: "Айлаңды асырып жібердің.", ru: "Ты перехитрил всех.", speaker: "о хитрости" },
  { kk: "Ақылмен іс қыл.", ru: "Поступай с умом.", speaker: "совет" },
  { kk: "Байлық бақыт әкелмейді.", ru: "Богатство не приносит счастья.", speaker: "мудрость" },
  { kk: "Жақсылық жаса.", ru: "Делай добро.", speaker: "совет" },
  { kk: "Рақмет сізге!", ru: "Спасибо вам!", speaker: "благодарность" },
  { kk: "Сау болыңыз!", ru: "До свидания!", speaker: "прощание" },
];
const videos = [
  { id: "qoshqar", level: "A1", title: "Қошқар мен теке", description: "Жануарлар туралы қарапайым ертегі.", videoUrl: "https://www.youtube.com/watch?v=zsrcsLcbKMc", embedUrl: "https://www.youtube.com/embed/zsrcsLcbKMc" },
  { id: "makta", level: "A1", title: "Мақта қыз бен Мысық", description: "Достық пен жауапкершілік туралы ертегі.", videoUrl: "https://www.youtube.com/watch?v=y03JllPau0Y", embedUrl: "https://www.youtube.com/embed/y03JllPau0Y" },
  { id: "fairy-collection", level: "A2", title: "Ертегілер жинағы", description: "Бірнеше қазақша ертегімен сөздік қорды кеңейту.", videoUrl: "https://www.youtube.com/watch?v=kjKrMStb8E0", embedUrl: "https://www.youtube.com/embed/kjKrMStb8E0" },
  { id: "makta-short", level: "A2", title: "Мақта қыз бен мысық: қысқа нұсқа", description: "Күнделікті диалогтарды тыңдауға арналған қысқа видео.", videoUrl: "https://www.youtube.com/watch?v=dHW2YHwkiMw", embedUrl: "https://www.youtube.com/embed/dHW2YHwkiMw" },
] as const;
const levels = ["A1", "A2"] as const;
const videoDictionaries: Record<string, Word[]> = {
  "zsrcsLcbKMc": [
    { kk: "қошқар", ru: "баран", note: "кейіпкер" }, { kk: "ауыл", ru: "аул, деревня", note: "туған жер" }, { kk: "сағыну", ru: "скучать", note: "сағындым" }, { kk: "қайта", ru: "снова, обратно", note: "қайта оралу" }, { kk: "жақсы", ru: "хороший", note: "баға беру" },
  ],
  "y03JllPau0Y": [
    { kk: "сәлем", ru: "привет", note: "амандасу" }, { kk: "балақай", ru: "малыш", note: "балаға қарату" }, { kk: "Мақта қыз", ru: "Макта кыз", note: "кейіпкер" }, { kk: "мысық", ru: "кошка", note: "кейіпкер" }, { kk: "құйрық", ru: "хвост", note: "дене мүшесі" }, { kk: "достық", ru: "дружба", note: "ертегінің тақырыбы" },
  ],
  "kjKrMStb8E0": [
    { kk: "жер", ru: "земля", note: "мекен" }, { kk: "бай", ru: "богач", note: "ертегі кейіпкері" }, { kk: "қыз", ru: "девочка, дочь", note: "кейіпкер" }, { kk: "үй", ru: "дом", note: "тұратын жер" }, { kk: "болыпты", ru: "оказывается, жил-был", note: "ертегінің басталуы" }, { kk: "ертегі", ru: "сказка", note: "оқиға түрі" },
  ],
  "dHW2YHwkiMw": [
    { kk: "баяғыда", ru: "давным-давно", note: "ертегінің басталуы" }, { kk: "Мақта қыз", ru: "Макта кыз", note: "кейіпкер" }, { kk: "мысық", ru: "кошка", note: "кейіпкер" }, { kk: "құйрық", ru: "хвост", note: "дене мүшесі" }, { kk: "сүт", ru: "молоко", note: "тағам" }, { kk: "көмек", ru: "помощь", note: "оқиға тақырыбы" },
  ],
  "D2vA2-rYXpg": [
    { kk: "қоян", ru: "заяц", note: "кейіпкер • тақырып бойынша" }, { kk: "құмырсқа", ru: "муравей", note: "кейіпкер • тақырып бойынша" }, { kk: "қораз", ru: "петух", note: "кейіпкер • тақырып бойынша" }, { kk: "мақтаншақ", ru: "хвастливый", note: "мінез • тақырып бойынша" }, { kk: "адасу", ru: "заблудиться", note: "оқиға • тақырып бойынша" },
  ],
  "bHp_f2x7B7Y": [
    { kk: "түлкі", ru: "лиса", note: "кейіпкер • тақырып бойынша" }, { kk: "қоян", ru: "заяц", note: "кейіпкер • тақырып бойынша" }, { kk: "үй", ru: "дом", note: "оқиға орны • тақырып бойынша" }, { kk: "әтеш", ru: "петух", note: "кейіпкер • тақырып бойынша" }, { kk: "қайтару", ru: "вернуть", note: "әрекет • тақырып бойынша" }, { kk: "достық", ru: "дружба", note: "тақырып" },
  ],
  "tNv1p7yObgw": [
    { kk: "құмырсқа", ru: "муравей", note: "кейіпкер • тақырып бойынша" }, { kk: "шегіртке", ru: "кузнечик", note: "кейіпкер • тақырып бойынша" }, { kk: "еңбекқор", ru: "трудолюбивый", note: "мінез • тақырып бойынша" }, { kk: "жалқау", ru: "ленивый", note: "мінез • тақырып бойынша" }, { kk: "жаз", ru: "лето", note: "жыл мезгілі • тақырып бойынша" }, { kk: "қыс", ru: "зима", note: "жыл мезгілі • тақырып бойынша" },
  ],
  "ZkBfEFv34mo": [
    { kk: "қарлығаш", ru: "ласточка", note: "кейіпкер • тақырып бойынша" }, { kk: "жылан", ru: "змея", note: "кейіпкер • тақырып бойынша" }, { kk: "құйрық", ru: "хвост", note: "ертегі өзегі" }, { kk: "айыр", ru: "вильчатый, раздвоенный", note: "сипаттама" }, { kk: "құтқару", ru: "спасти", note: "әрекет • тақырып бойынша" }, { kk: "табиғат", ru: "природа", note: "тақырып" },
  ],
  "ghPz381opTM": [
    { kk: "көңілді", ru: "весёлый", note: "оқиғаның сипаты • тақырып бойынша" }, { kk: "оқиға", ru: "событие, история", note: "мультфильмдегі жағдай" }, { kk: "айла", ru: "хитрость, уловка", note: "Алдардың тәсілі" }, { kk: "күлкі", ru: "смех", note: "көңіл-күй" }, { kk: "жеңу", ru: "победить", note: "әрекет • тақырып бойынша" },
  ],
  "iPlzkDj566k": [
    { kk: "түлкі", ru: "лиса", note: "кейіпкер • тақырып бойынша" }, { kk: "тырна", ru: "журавль", note: "кейіпкер • тақырып бойынша" }, { kk: "қонақ", ru: "гость", note: "оқиға тақырыбы" }, { kk: "шақыру", ru: "приглашать", note: "әрекет • тақырып бойынша" }, { kk: "құмыра", ru: "кувшин", note: "зат • тақырып бойынша" }, { kk: "сыйластық", ru: "уважение", note: "тақырып" },
  ],
  "Ss4lhn6vQS8": [
    { kk: "Ер Төстік", ru: "Ер Төстік", note: "басты кейіпкер • тақырып бойынша" }, { kk: "батыр", ru: "богатырь", note: "кейіпкер" }, { kk: "отбасы", ru: "семья", note: "ертегі тақырыбы" }, { kk: "аға", ru: "старший брат", note: "туыс" }, { kk: "үміт", ru: "надежда", note: "сезім" },
  ],
  "phlovMQN8Ic": [
    { kk: "жер асты", ru: "подземный мир", note: "оқиға орны • тақырып бойынша" }, { kk: "Шалқұйрық", ru: "Шалкуйрык", note: "тұлпар • тақырып бойынша" }, { kk: "Желаяқ", ru: "Желаяқ", note: "дос • тақырып бойынша" }, { kk: "Мыстан кемпір", ru: "ведьма-старушка", note: "кейіпкер • тақырып бойынша" }, { kk: "жылан", ru: "змея", note: "кейіпкер • тақырып бойынша" }, { kk: "сапар", ru: "путешествие", note: "оқиға тақырыбы" },
  ],
  "ZFkrkxLKxg8": [
    { kk: "Алдар Көсе", ru: "Алдар Косе", note: "басты кейіпкер • тақырып бойынша" }, { kk: "көсе", ru: "безбородый", note: "прозвище • тақырып бойынша" }, { kk: "бай", ru: "богач", note: "кейіпкер • тақырып бойынша" }, { kk: "алдау", ru: "обманывать", note: "Алдардың айласы" }, { kk: "айлакер", ru: "хитрый, находчивый", note: "мінез" }, { kk: "әділдік", ru: "справедливость", note: "тақырып" },
  ],
};
const subtitleVideoIds = new Set(["zsrcsLcbKMc", "y03JllPau0Y", "kjKrMStb8E0", "dHW2YHwkiMw"]);
const videoPhrases: Record<string, Phrase[]> = {
  zsrcsLcbKMc: [
    { kk: "Қошқар, ауылды сағындым.", ru: "Баран, я соскучился по аулу.", speaker: "Қошқар" },
    { kk: "Ауылға қайтайықшы.", ru: "Давайте вернёмся в аул.", speaker: "өтініш" },
    { kk: "Достарым, сендерді көргеніме қуаныштымын.", ru: "Друзья, я рад вас видеть.", speaker: "кездесу" },
  ],
  y03JllPau0Y: [
    { kk: "Сәлем, балақайлар!", ru: "Привет, малыши!", speaker: "жүргізуші" },
    { kk: "Бүгін «Мақта қыз бен мысық» ертегісін оқып беремін.", ru: "Сегодня я расскажу сказку «Макта кыз и кошка».", speaker: "жүргізуші" },
    { kk: "Жайғасып отырып алыңыздар.", ru: "Усаживайтесь поудобнее.", speaker: "жүргізуші" },
    { kk: "Маған бір шелек су беріңізші.", ru: "Дайте мне, пожалуйста, ведро воды.", speaker: "мысық" },
  ],
  kjKrMStb8E0: [
    { kk: "Кімнің үйінде жас қыз бар?", ru: "У кого дома есть молодая девушка?", speaker: "сұрақ" },
    { kk: "Қыздарым, жақсылап дайындалыңдар.", ru: "Дочери, хорошо подготовьтесь.", speaker: "ана" },
    { kk: "Мен бәрібір сені табамын.", ru: "Я всё равно тебя найду.", speaker: "уәде" },
  ],
  dHW2YHwkiMw: [
    { kk: "Баяғыда Мақта қыз болыпты.", ru: "Давным-давно жила Макта кыз.", speaker: "ертегі" },
    { kk: "Мысық, мені неге шақырдың?", ru: "Кошка, зачем ты меня позвала?", speaker: "Мақта қыз" },
    { kk: "Маған бір шелек су берші.", ru: "Дай мне, пожалуйста, ведро воды.", speaker: "мысық" },
    { kk: "Рақмет.", ru: "Спасибо.", speaker: "алғыс" },
  ],
};

export default function CartoonLesson() {
  const [activeVideoId, setActiveVideoId] = useState<(typeof videos)[number]["id"]>("makta");
  const [shown, setShown] = useState<string | null>(null);
  const [direction, setDirection] = useState<"kk-ru" | "ru-kk">("kk-ru");
  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? videos[0];
  const activeVideoKey = activeVideo.embedUrl.slice(-11);
  const activeWords = videoDictionaries[activeVideoKey] ?? [];
  const activePhrases = videoPhrases[activeVideoKey] ?? [];
  const hasSubtitles = subtitleVideoIds.has(activeVideoKey);

  const prompt = direction === "kk-ru" ? "Қазақша сөзді бас" : "Русское слово бас";

  return <Shell><div className="page cartoonPage">
    <StudentTop title="Мультфильм арқылы үйрен" sub="Видеоны көріп, жаңа сөздерді бірден қайтала" />

    <section className="cartoonIntro">
      <div><span className="eyebrow">ҚАЗАҚ ТІЛІ • ВИДЕО САБАҚ</span><h2>Көр, тыңда, сөзді аш</h2><p>Мультфильмге сілтеме қосыңыз. Төмендегі сөздіктегі сөзді басып, оның аудармасын тексеріңіз.</p></div>
      <Clapperboard aria-hidden="true" />
    </section>

    <section className="videoLevels panel" aria-labelledby="level-title">
      <div className="sectionHead"><div><h3 id="level-title">Видео деңгейлері</h3><p>Субтитрі бар 4 видео: A1 және A2. Деңгейді таңдаңыз.</p></div></div>
      <div className="levelGroups">{levels.map((level) => <div className="levelGroup" key={level}><h4>{level} деңгейі</h4><div className="levelCards">{videos.filter((video) => video.level === level).map((video) => {
        const active = video.id === activeVideo.id;
        return <button className={`levelCard ${active ? "active" : ""}`} onClick={() => { setActiveVideoId(video.id); setShown(null); }} type="button" key={video.id} aria-pressed={active}>
          <span>{video.level}</span><b>{video.title}</b><small>{video.description}</small>{active ? <em><Check size={15} /> Таңдалды</em> : <em><Play size={15} /> Ашып көру</em>}
        </button>;
      })}</div></div>)}</div>
    </section>

    <section className="cartoonPlayer panel" aria-labelledby="video-title">
      <div className="sectionHead"><div><span className="eyebrow">{activeVideo.level}</span><h3 id="video-title">{activeVideo.title}</h3><p>{activeVideo.description}</p></div></div>
      <div className="videoStage">
        <iframe src={activeVideo.embedUrl} title={`${activeVideo.title} — мультфильм`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
      <a className="sourceLink" href={activeVideo.videoUrl} target="_blank" rel="noreferrer">YouTube-тан ашу <ExternalLink size={15} /></a>
    </section>

    <section className="dictionary panel" aria-labelledby="dictionary-title">
      <div className="dictionaryHead"><div><span className="eyebrow">{activeVideo.title.toUpperCase()} • {hasSubtitles ? "СУБТИТРЛЕРДЕН" : "БЕЙІМДЕЛГЕН"}</span><h3 id="dictionary-title">Осы видеоның сөздігі</h3><p>{activeWords.length} сөз • {hasSubtitles ? "Субтитрлердегі сөздер." : "Сюжетке сай шамамен алынған сөздер."} {prompt}.</p></div><button className="directionButton" type="button" onClick={() => { setDirection((current) => current === "kk-ru" ? "ru-kk" : "kk-ru"); setShown(null); }}><Languages size={18} /> {direction === "kk-ru" ? "Қаз → Рус" : "Рус → Қаз"}</button></div>
      <div className="wordGrid">
        {activeWords.map((word) => {
          const front = direction === "kk-ru" ? word.kk : word.ru;
          const back = direction === "kk-ru" ? word.ru : word.kk;
          const isShown = shown === word.kk;
          return <button className={`wordCard ${isShown ? "revealed" : ""}`} key={word.kk} type="button" onClick={() => setShown(isShown ? null : word.kk)} aria-pressed={isShown}>
            <span className="wordLanguage">{direction === "kk-ru" ? "ҚАЗАҚША" : "РУССКИЙ"}</span><b>{front}</b>
            {isShown ? <span className="translation"><Eye size={16} /> {back}</span> : <span className="tapHint"><EyeOff size={16} /> Аударманы көру</span>}
            <small>{word.note}</small>
          </button>;
        })}
      </div>
      <button type="button" className="resetWords" onClick={() => setShown(null)}><RotateCcw size={15} /> Сөздерді жабу</button>

      <div className="phraseSection">
        <div><span className="eyebrow">ТЫҢДАП ҚАЙТАЛА</span><h4>Мультфильмге арналған фразалар</h4><p>Фразаны басыңыз — орысша мағынасы ашылады.</p></div>
        <div className="phraseList">
          {activePhrases.map((phrase) => {
            const isShown = shown === phrase.kk;
            return <button className={`phraseCard ${isShown ? "revealed" : ""}`} key={phrase.kk} type="button" onClick={() => setShown(isShown ? null : phrase.kk)} aria-pressed={isShown}>
              <span>{phrase.speaker}</span><b>{phrase.kk}</b>
              {isShown ? <strong><Eye size={16} /> {phrase.ru}</strong> : <em><EyeOff size={16} /> Аударманы көру</em>}
            </button>;
          })}
        </div>
      </div>
    </section>
  </div></Shell>;
}
