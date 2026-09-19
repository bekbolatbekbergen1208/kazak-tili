"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Clapperboard, Eye, EyeOff, ExternalLink, Languages, Play, RotateCcw } from "lucide-react";
import { Shell, StudentTop } from "./shell";

type Word = { kk: string; ru: string; note: string };

const words: Word[] = [
  { kk: "сәлем", ru: "привет", note: "амандасу" },
  { kk: "дос", ru: "друг", note: "жақын адам" },
  { kk: "үй", ru: "дом", note: "тұратын жер" },
  { kk: "ойнау", ru: "играть", note: "әрекет" },
  { kk: "қуаныш", ru: "радость", note: "жақсы сезім" },
  { kk: "көмектесу", ru: "помогать", note: "біреуге жәрдем беру" },
  { kk: "табиғат", ru: "природа", note: "қоршаған әлем" },
  { kk: "ертегі", ru: "сказка", note: "қызықты әңгіме" },
];

function embedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (url.pathname.startsWith("/embed/")) return url.toString();
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* the validation message is shown in the UI */ }
  return null;
}

export default function CartoonLesson() {
  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  const [direction, setDirection] = useState<"kk-ru" | "ru-kk">("kk-ru");

  useEffect(() => setUrl(localStorage.getItem("qazaqdos-cartoon-url") ?? ""), []);
  const playerUrl = useMemo(() => embedUrl(savedUrl), [savedUrl]);
  const directVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(savedUrl);
  const canPlay = Boolean(playerUrl || directVideo);

  function loadVideo(event: FormEvent) {
    event.preventDefault();
    const next = url.trim();
    setSavedUrl(next);
    if (next) localStorage.setItem("qazaqdos-cartoon-url", next);
    else localStorage.removeItem("qazaqdos-cartoon-url");
  }

  const prompt = direction === "kk-ru" ? "Қазақша сөзді бас" : "Русское слово бас";

  return <Shell><div className="page cartoonPage">
    <StudentTop title="Мультфильм арқылы үйрен" sub="Видеоны көріп, жаңа сөздерді бірден қайтала" />

    <section className="cartoonIntro">
      <div><span className="eyebrow">ҚАЗАҚ ТІЛІ • ВИДЕО САБАҚ</span><h2>Көр, тыңда, сөзді аш</h2><p>Мультфильмге сілтеме қосыңыз. Төмендегі сөздіктегі сөзді басып, оның аудармасын тексеріңіз.</p></div>
      <Clapperboard aria-hidden="true" />
    </section>

    <section className="cartoonPlayer panel" aria-labelledby="video-title">
      <div className="sectionHead"><div><h3 id="video-title">Мультфильм</h3><p>YouTube, Vimeo немесе тікелей MP4 сілтемесін қойыңыз</p></div></div>
      <form className="videoLinkForm" onSubmit={loadVideo}>
        <label htmlFor="cartoon-url">Видео сілтемесі</label>
        <div><input id="cartoon-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /><button className="btn primary" type="submit"><Play size={17} /> Көру</button></div>
      </form>
      {savedUrl && !canPlay && <p className="videoError">Бұл сілтеме әзірге танылмады. YouTube, Vimeo немесе .mp4 сілтемесін қолданыңыз.</p>}
      <div className="videoStage">
        {playerUrl ? <iframe src={playerUrl} title="Мультфильм" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : directVideo ? <video controls src={savedUrl}>Браузеріңіз видеоны қолдамайды.</video> : <div className="videoPlaceholder"><span><Play /></span><b>Мультфильмді бастауға дайынсыз ба?</b><p>Жоғарыға видео сілтемесін енгізіңіз.</p></div>}
      </div>
      {canPlay && <a className="sourceLink" href={savedUrl} target="_blank" rel="noreferrer">Сілтемені ашу <ExternalLink size={15} /></a>}
    </section>

    <section className="dictionary panel" aria-labelledby="dictionary-title">
      <div className="dictionaryHead"><div><span className="eyebrow">ВИДЕОДАҒЫ СӨЗДЕР</span><h3 id="dictionary-title">Интерактивті сөздік</h3><p>{prompt} — аудармасы пайда болады.</p></div><button className="directionButton" type="button" onClick={() => { setDirection((current) => current === "kk-ru" ? "ru-kk" : "kk-ru"); setShown(null); }}><Languages size={18} /> {direction === "kk-ru" ? "Қаз → Рус" : "Рус → Қаз"}</button></div>
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
