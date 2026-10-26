"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { maskedSongLine, speechTokens } from "@/lib/songs/practice";

type Line = { text: string; start?: number; end?: number };
export function TimedSongFind({ lines, allowText = false, audioSrc, timings }: {
  lines: readonly string[]; allowText?: boolean; audioSrc?: string; timings?: readonly Line[];
}) {
  const player = useRef<HTMLAudioElement>(null);
  const [text, setText] = useState(lines.join("\n"));
  const [localAudio, setLocalAudio] = useState("");
  const [marks, setMarks] = useState<number[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const rows = useMemo(() => text.split("\n").map(l => l.trim()).filter(l => speechTokens(l).length), [text]);
  const supplied = timings?.length === rows.length && timings.every((l, i) => Number.isFinite(l.start) && l.start! >= 0 && (i === 0 || l.start! > timings[i - 1].start!));
  const starts = marks.length ? marks : supplied ? timings!.map(l => l.start!) : [];
  const ready = rows.length > 0 && starts.length === rows.length;
  const active = ready ? starts.findLastIndex((s, i) => time >= s && (timings?.[i]?.end === undefined || marks.length > 0 || time < timings[i].end!)) : -1;
  const src = localAudio || audioSrc;
  useEffect(() => () => { if (localAudio) URL.revokeObjectURL(localAudio); }, [localAudio]);
  useEffect(() => { setInput(""); setFeedback(""); }, [active]);
  useEffect(() => {
    if (active >= 0) document.getElementById(`sync-line-${active}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);
  function mark() {
    const t = player.current?.currentTime;
    if (t === undefined || marks.length >= rows.length || (marks.length && t <= marks[marks.length - 1])) return;
    setMarks(m => [...m, t]);
  }
  function check() {
    if (!playing || active < 0 || answers[active]) return;
    const expected = rows[active].split(/\s+/)[hiddenToken(rows[active], active)];
    if (speechTokens(input).join(" ") === speechTokens(expected).join(" ")) {
      setAnswers(a => ({ ...a, [active]: true })); setFeedback("✓ Дұрыс!");
    } else setFeedback("Сәйкес келмеді. Жол аяқталғанша қайта көр.");
  }
  return <section className="panel song-find">
    <h2>Әнмен бірге сөзді тап</h2>
    <p>Ән жүріп жатқанда тиісті жол белгіленеді. Әр жолдан бір сөз жасырылған. Кідірту және кері айналдыру мәтінге де әсер етеді.</p>
    {!started && <>
      {allowText && <label>Толық ән мәтіні · әр жолды бөлек енгіз<textarea className="song-full-text-input" rows={7} maxLength={12000} value={text} onChange={e => { setText(e.target.value); setMarks([]); }} /></label>}
      <label>Өз аудиоңды таңдау <input type="file" accept="audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setLocalAudio(URL.createObjectURL(f)); setMarks([]); setError(""); } }} /></label>
      {!ready && <p>Осы жазбаға дайын уақыт белгілері жоқ. Әнді қосып, әр жол басталғанда төмендегі батырманы басып белгіле. Содан кейін жаттығу дәл сол уақытпен жүреді.</p>}
    </>}
    {src ? <audio ref={player} controls preload="metadata" src={src} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onSeeked={e => { setTime(e.currentTarget.currentTime); setEnded(false); }} onPlay={() => { setPlaying(true); setEnded(false); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setEnded(true); }} onError={() => { setPlaying(false); setError("Аудио ашылмады. Құрылғыңнан аудио таңда."); }} /> : <p>Синхрондалған жаттығу үшін аудио файл таңда.</p>}
    {error && <p role="alert">{error}</p>}
    {!started && !ready && rows.length > 0 && <div>
      <p>{marks.length}/{rows.length} жол белгіленді</p><p>{rows[marks.length]}</p>
      <button className="btn primary" disabled={!src || !playing} onClick={mark}>Осы жол қазір басталды</button>
      <button className="btn ghost" onClick={() => setMarks([])}>Белгілерді тазалау</button>
    </div>}
    {!started && ready && <button className="btn primary" disabled={!src} onClick={() => { setStarted(true); setAnswers({}); setEnded(false); if (player.current) { player.current.currentTime = 0; setTime(0); player.current.play().catch(() => setError("Плеердегі ойнату батырмасын бас.")); } }}>Әнмен жаттығуды бастау</button>}
    {started && <>
      <p>{Object.values(answers).filter(Boolean).length}/{rows.length} дұрыс · {Math.floor(time)} сек.</p>
      <div className="song-timed-lyrics">{rows.map((line, i) => <p id={`sync-line-${i}`} key={i} aria-current={active === i ? "step" : undefined}>{maskedSongLine(line, hiddenToken(line, i), answers[i] === true)}</p>)}</div>
      {ended ? <p role="status">Ән аяқталды. Нәтиже: {Object.values(answers).filter(Boolean).length}/{rows.length}. Қайта тыңдау үшін плеерді басына жылжыт.</p> : active < 0 ? <p>Алғашқы жолды күт…</p> : <form onSubmit={e => { e.preventDefault(); check(); }}><label>{active + 1}-жолдағы сөз <input autoComplete="off" value={input} onChange={e => setInput(e.target.value)} disabled={!playing || answers[active] === true} /></label><button className="btn primary" disabled={!playing || !input.trim() || answers[active] === true}>Тексеру</button></form>}
      <p role="status">{feedback}</p><button className="btn ghost" onClick={() => { player.current?.pause(); setStarted(false); }}>Мәтін мен уақытты өзгерту</button>
    </>}
  </section>;
}
function hiddenToken(text: string, index: number) {
  const words = text.split(/\s+/);
  const candidates = words.flatMap((word, i) => speechTokens(word).length ? [i] : []);
  return candidates[index % candidates.length] ?? 0;
}
