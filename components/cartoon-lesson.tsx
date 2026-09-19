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
  { id: "aldar", level: "1-деңгей", title: "Алдар Көсе", description: "Халық ертегісіндегі айлакер кейіпкердің оқиғалары.", videoUrl: "https://www.youtube.com/watch?v=ZFkrkxLKxg8", embedUrl: "https://www.youtube.com/embed/ZFkrkxLKxg8" },
  { id: "aldar-fun", level: "2-деңгей", title: "Алдар Көсенің көңілді оқиғалары", description: "Диалогтары көбірек, күнделікті сөздерді тыңдауға ыңғайлы.", videoUrl: "https://www.youtube.com/watch?v=ghPz381opTM", embedUrl: "https://www.youtube.com/embed/ghPz381opTM" },
  { id: "er-tostik", level: "3-деңгей", title: "Ер Төстік және Жылан Бапы хан", description: "Батырлық ертегі: сапар, достық және ғажайып кейіпкерлер.", videoUrl: "https://www.youtube.com/watch?v=phlovMQN8Ic", embedUrl: "https://www.youtube.com/embed/phlovMQN8Ic" },
] as const;

export default function CartoonLesson() {
  const [activeVideoId, setActiveVideoId] = useState<(typeof videos)[number]["id"]>("aldar");
  const [shown, setShown] = useState<string | null>(null);
  const [direction, setDirection] = useState<"kk-ru" | "ru-kk">("kk-ru");
  const activeVideo = videos.find((video) => video.id === activeVideoId) ?? videos[0];

  const prompt = direction === "kk-ru" ? "Қазақша сөзді бас" : "Русское слово бас";

  return <Shell><div className="page cartoonPage">
    <StudentTop title="Мультфильм арқылы үйрен" sub="Видеоны көріп, жаңа сөздерді бірден қайтала" />

    <section className="cartoonIntro">
      <div><span className="eyebrow">ҚАЗАҚ ТІЛІ • ВИДЕО САБАҚ</span><h2>Көр, тыңда, сөзді аш</h2><p>Мультфильмге сілтеме қосыңыз. Төмендегі сөздіктегі сөзді басып, оның аудармасын тексеріңіз.</p></div>
      <Clapperboard aria-hidden="true" />
    </section>

    <section className="videoLevels panel" aria-labelledby="level-title">
      <div className="sectionHead"><div><h3 id="level-title">Видео деңгейлері</h3><p>Деңгейді таңдаңыз: видео сол деңгейге ауысады.</p></div></div>
      <div className="levelCards">{videos.map((video) => {
        const active = video.id === activeVideo.id;
        return <button className={`levelCard ${active ? "active" : ""}`} onClick={() => { setActiveVideoId(video.id); setShown(null); }} type="button" key={video.id} aria-pressed={active}>
          <span>{video.level}</span><b>{video.title}</b><small>{video.description}</small>{active ? <em><Check size={15} /> Таңдалды</em> : <em><Play size={15} /> Ашып көру</em>}
        </button>;
      })}</div>
    </section>

    <section className="cartoonPlayer panel" aria-labelledby="video-title">
      <div className="sectionHead"><div><span className="eyebrow">{activeVideo.level}</span><h3 id="video-title">{activeVideo.title}</h3><p>{activeVideo.description}</p></div></div>
      <div className="videoStage">
        <iframe src={activeVideo.embedUrl} title={`${activeVideo.title} — мультфильм`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
      <a className="sourceLink" href={activeVideo.videoUrl} target="_blank" rel="noreferrer">YouTube-тан ашу <ExternalLink size={15} /></a>
    </section>

    <section className="dictionary panel" aria-labelledby="dictionary-title">
      <div className="dictionaryHead"><div><span className="eyebrow">ВИДЕОҒА АРНАЛҒАН СӨЗДЕР</span><h3 id="dictionary-title">Үлкен интерактивті сөздік</h3><p>{words.length} сөз • {prompt} — аудармасы пайда болады.</p></div><button className="directionButton" type="button" onClick={() => { setDirection((current) => current === "kk-ru" ? "ru-kk" : "kk-ru"); setShown(null); }}><Languages size={18} /> {direction === "kk-ru" ? "Қаз → Рус" : "Рус → Қаз"}</button></div>
      <div className="wordGrid">
        {words.map((word) => {
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
          {phrases.map((phrase) => {
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
