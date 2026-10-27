"use client";
import { useState } from "react";
import { voices, type ListeningLesson } from "@/lib/listening/content";
type Lesson = ListeningLesson & { audio: string | null; provider: "azure" | "edge-tts" | null };
export default function ListeningPractice({ lessons }: { lessons: Lesson[] }) {
  const [selected, setSelected] = useState(lessons[0].id);
  const lesson = lessons.find(l => l.id === selected)!;
  return <section className="listen-page"><header><span>АЙГҮЛ + ДӘУЛЕТ</span><h1>Тыңдап үйрен</h1><p>Диалогты тыңда, негізгі ақпаратты тап, жауабыңды тексер. Бұл — оқу жаттығуы; тілдік деңгей туралы сертификат бермейді.</p></header><nav aria-label="Тыңдалымды таңдау">{lessons.map(l => <button key={l.id} aria-pressed={selected === l.id} onClick={() => setSelected(l.id)}>{l.level} · {l.title}</button>)}</nav><LessonPractice key={lesson.id} lesson={lesson} /></section>;
}
function LessonPractice({ lesson }: { lesson: Lesson }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [heard, setHeard] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const [usedTranscript, setUsedTranscript] = useState(false);
  const score = lesson.questions.filter((q, i) => answers[i] === q.answer).length;
  return <article className="listen-lesson"><h2>{lesson.title}</h2><p>{lesson.provider === "edge-tts" ? "Microsoft Edge" : lesson.provider === "azure" ? "Microsoft Azure" : "Жоспарланған"} дауыстары: Айгүл және Дәулет. Аудио жасанды дауыспен оқылады.</p>{lesson.audio ? <><audio key={lesson.audio} controls preload="none" src={lesson.audio} onEnded={() => setHeard(true)} onError={() => setAudioError(true)} aria-label={`${lesson.title}: Айгүл мен Дәулеттің диалогы`} />{audioError && <p role="alert">Аудио жүктелмеді. Бетті жаңартып, қайта көр.</p>}<p>Алдымен диалогты соңына дейін тыңда. Қажет болса, қайталап тыңдай аласың.</p></> : <p role="status" className="listen-pending">Аудио әзірленіп жатыр. Дайын болғанда осы жерден тыңдай аласың. Әзірге мәтінмен танысуға болады.</p>}<button className="btn ghost" aria-expanded={transcript} onClick={() => { setTranscript(!transcript); setUsedTranscript(true); }}>{transcript ? "Мәтінді жабу" : "Диалог мәтінін ашу"}</button>{transcript && <div className="listen-transcript">{lesson.turns.map((turn, i) => <p key={i}><b>{voices[turn.voice].name}:</b> {turn.text}</p>)}<small>Мәтін ашылса, бұл тапсырманы оқылым көмегімен орындағаныңды ескер.</small></div>}<form onSubmit={e => { e.preventDefault(); setChecked(true); }}>{lesson.questions.map((q, i) => <fieldset key={i} disabled={checked || !heard || audioError}><legend>{i + 1}. {q.prompt}</legend>{q.options.map((option, j) => <label key={j}><input type="radio" name={`${lesson.id}-${i}`} value={j} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} required />{option}</label>)}{checked && <p className={answers[i] === q.answer ? "listen-correct" : "listen-wrong"}>{answers[i] === q.answer ? "Дұрыс." : `Қате. Дұрыс жауап: ${q.options[q.answer]}.`} {q.explanation}</p>}</fieldset>)}{checked ? <div role="status"><h3>Нәтиже: {score}/{lesson.questions.length}</h3><p>Бұл тыңдалым бойынша жаттығу нәтижесі. Мәтін көмегі {usedTranscript ? "қолданылды" : "қолданылмады"}.</p><button className="btn ghost" type="button" onClick={() => { setChecked(false); setAnswers({}); }}>Қайта орындау</button></div> : <button className="btn primary" disabled={!heard || audioError || Object.keys(answers).length !== lesson.questions.length}>Жауаптарды тексеру</button>}</form></article>;
}
