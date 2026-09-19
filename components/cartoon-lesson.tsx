"use client";

import { useState } from "react";
import { Clapperboard, Eye, EyeOff, ExternalLink, Languages, RotateCcw } from "lucide-react";
import { Shell, StudentTop } from "./shell";

type Word = { kk: string; ru: string; note: string };

const words: Word[] = [
  { kk: "Алдар Көсе", ru: "Алдар Косе", note: "главный герой" },
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
const videoUrl = "https://www.youtube.com/watch?v=ZFkrkxLKxg8";
const embedUrl = "https://www.youtube.com/embed/ZFkrkxLKxg8";

export default function CartoonLesson() {
  const [shown, setShown] = useState<string | null>(null);
  const [direction, setDirection] = useState<"kk-ru" | "ru-kk">("kk-ru");

  const prompt = direction === "kk-ru" ? "Қазақша сөзді бас" : "Русское слово бас";

  return <Shell><div className="page cartoonPage">
    <StudentTop title="Мультфильм арқылы үйрен" sub="Видеоны көріп, жаңа сөздерді бірден қайтала" />

    <section className="cartoonIntro">
      <div><span className="eyebrow">ҚАЗАҚ ТІЛІ • ВИДЕО САБАҚ</span><h2>Көр, тыңда, сөзді аш</h2><p>Мультфильмге сілтеме қосыңыз. Төмендегі сөздіктегі сөзді басып, оның аудармасын тексеріңіз.</p></div>
      <Clapperboard aria-hidden="true" />
    </section>

    <section className="cartoonPlayer panel" aria-labelledby="video-title">
      <div className="sectionHead"><div><h3 id="video-title">Алдар Көсе</h3><p>Толық мультфильм • шамамен 3 сағат</p></div></div>
      <div className="videoStage">
        <iframe src={embedUrl} title="Алдар Көсе — мультфильм" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
      <a className="sourceLink" href={videoUrl} target="_blank" rel="noreferrer">YouTube-тан ашу <ExternalLink size={15} /></a>
    </section>

    <section className="dictionary panel" aria-labelledby="dictionary-title">
      <div className="dictionaryHead"><div><span className="eyebrow">«АЛДАР КӨСЕ» МУЛЬТФИЛЬМІНДЕГІ СӨЗДЕР</span><h3 id="dictionary-title">Үлкен интерактивті сөздік</h3><p>{words.length} сөз • {prompt} — аудармасы пайда болады.</p></div><button className="directionButton" type="button" onClick={() => { setDirection((current) => current === "kk-ru" ? "ru-kk" : "kk-ru"); setShown(null); }}><Languages size={18} /> {direction === "kk-ru" ? "Қаз → Рус" : "Рус → Қаз"}</button></div>
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
    </section>
  </div></Shell>;
}
