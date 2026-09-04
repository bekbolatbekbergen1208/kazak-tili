"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, ArrowRight, CheckCircle2, Headphones, Keyboard, Lightbulb, Lock, RotateCcw, Volume2} from "lucide-react";
import {courseLessons, type CourseLesson} from "@/lib/curriculum";
import {completeLesson, useLessonProgress} from "@/lib/lesson-progress";
import LessonScene from "./lesson-scene";

type ErrorItem = {step: number; given: string; expected: string};
type Task = {
  kind: "choice" | "listening" | "typing";
  title: string;
  answer: string;
  hint: string;
  prompt?: string;
  options?: string[];
};

const normalize = (text: string) =>
  text.toLocaleLowerCase("kk-KZ").replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();

const topicLessons = courseLessons.slice(0, 20);

function otherTopics(lesson: CourseLesson) {
  const candidates = topicLessons.filter((item) => item.theme !== lesson.theme);
  const rotation = Math.floor((lesson.id - 1) / 20) % candidates.length;
  return [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
}

function placeAnswer(answer: string, wrongAnswers: string[], seed: number) {
  const options = wrongAnswers.filter((item, index, list) =>
    item !== answer && list.indexOf(item) === index
  ).slice(0, 3);
  options.splice(seed % (options.length + 1), 0, answer);
  return options;
}

export default function GenericLesson({lesson}: {lesson: CourseLesson}) {
  const router = useRouter();
  const {unlockedLesson, progressReady} = useLessonProgress();
  const tasks = useMemo<Task[]>(() => {
    const alternatives = otherTopics(lesson);
    const block = Math.floor((lesson.id - 1) / 20);
    const wrongWords = alternatives.map((item, index) => item.words[(block + index) % item.words.length]);
    const wrongTranslations = alternatives.map((item) => item.translation);
    return [
    {
      kind: "choice",
      title: `«${lesson.theme}» тақырыбына қатысты сөзді таңда`,
      options: placeAnswer(lesson.words[0], wrongWords, lesson.id),
      answer: lesson.words[0],
      hint: `Көрініске қара. Дұрыс сөз «${lesson.words[0]}».`,
    },
    {
      kind: "listening",
      title: "Сөйлемді тыңдап, дұрыс аудармасын таңда",
      options: placeAnswer(lesson.translation, wrongTranslations, lesson.id + 1),
      answer: lesson.translation,
      hint: "Сөйлемді тағы бір рет тыңдап, негізгі сөздерге назар аудар.",
    },
    {
      kind: "typing",
      title: "Сөйлемді қазақша пернетақтамен жаз",
      prompt: lesson.translation,
      answer: lesson.sentence,
      hint: `Бірінші сөз: «${lesson.sentence.split(" ")[0]}»`,
    },
    {
      kind: "typing",
      title: `«${lesson.words[1]}» сөзін қолданып үлгі сөйлемді көшіріп жаз`,
      prompt: lesson.sentence,
      answer: lesson.sentence,
      hint: "Қазақ әріптеріне назар аудар: ә, ғ, қ, ң, ө, ұ, ү, һ, і.",
    },
    ];
  }, [lesson]);

  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const task = tasks[step];
  const correct = normalize(value) === normalize(task.answer);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    if (progressReady && lesson.id > unlockedLesson) router.replace("/student");
  }, [lesson.id, progressReady, router, unlockedLesson]);

  function speak() {
    if (!("speechSynthesis" in window)) {
      setAudioError("Бұл браузер дыбысты ойнатуды қолдамайды.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.sentence);
    utterance.lang = "kk-KZ";
    utterance.rate = .82;
    utterance.pitch = 1;
    utterance.onerror = () => setAudioError("Дыбысты ойнату мүмкін болмады. Қайта басып көр.");
    utterance.onstart = () => setAudioError("");
    window.speechSynthesis.speak(utterance);
  }

  function check() {
    if (!value.trim()) return;
    setChecked(true);
    if (!correct) setErrors((current) => [...current, {step, given: value, expected: task.answer}]);
  }

  function next() {
    window.speechSynthesis?.cancel();
    if (step < tasks.length - 1) {
      setStep((current) => current + 1);
      setValue("");
      setChecked(false);
      setShowHint(false);
    } else if (errors.length || !correct) {
      setReview(true);
    } else {
      completeLesson(lesson.id);
      setDone(true);
    }
  }

  function retry() {
    const first = errors[0]?.step ?? 0;
    setStep(first);
    setErrors([]);
    setValue("");
    setChecked(false);
    setShowHint(false);
    setReview(false);
  }

  if (!progressReady || lesson.id > unlockedLesson) return <div className="lessonGate"><Lock /> <p>Сабақ ретімен ашылады…</p></div>;

  if (done) return <div className="genericDone">
    <CheckCircle2 /><span>{lesson.level} • №{lesson.id}</span>
    <h1>Сабақ меңгерілді!</h1>
    <p>«{lesson.title}» сабағындағы тыңдалым, сөздер мен грамматикалық үлгіні дұрыс орындадың.</p>
    <div><Link className="btn ghost" href="/student/lessons">Каталогқа</Link>{lesson.id < 1000 && <Link className="btn primary" href={`/student/lesson/${lesson.id + 1}`}>Келесі сабақ <ArrowRight /></Link>}</div>
  </div>;

  if (review) return <div className="typingReview">
    <h1>Нақты қателер</h1><p>Қай жерде қате кеткенін қарап, тапсырманы қайта орында.</p>
    {errors.map((error, index) => <article key={index}><small>{tasks[error.step].title}</small><div><span>Сен таңдадың: <b>{error.given}</b></span><span>Дұрысы: <b>{error.expected}</b></span></div></article>)}
    <button onClick={retry} className="btn primary"><RotateCcw /> Қателерді қайта орындау</button>
  </div>;

  const sectionName = task.kind === "typing" ? "ЖАЗЫЛЫМ ЖӘНЕ ГРАММАТИКА" : task.kind === "listening" ? "ТЫҢДАЛЫМ" : "ЛЕКСИКА";

  return <div className="genericLesson">
    <header><Link href="/student/lessons"><ArrowLeft /></Link><div><i style={{width: `${(step / tasks.length) * 100}%`}} /></div><span>{lesson.level} • №{lesson.id}</span></header>
    <main>
      <div className="lessonContext"><span>{lesson.theme}</span><b>{lesson.grammar}</b></div>
      <small>{step + 1}/{tasks.length} • {sectionName}</small>
      <LessonScene lesson={lesson} step={step} />
      <h1>{task.title}</h1>
      {task.prompt && <blockquote>{task.prompt}</blockquote>}
      {task.kind === "listening" && <div className="listeningPlayer">
        <Headphones />
        <div><b>Қазақша аудио</b><span>Сөйлемді мұқият тыңда</span></div>
        <button type="button" onClick={speak} aria-label="Сөйлемді тыңдау"><Volume2 /> Тыңдау</button>
      </div>}
      {audioError && <p className="audioError" role="alert">{audioError}</p>}
      {showHint && <div className="dosshaHint" role="status">
        <Lightbulb />
        <div><b>Досшаның көмегі</b><p>{task.hint}</p></div>
        <button type="button" onClick={() => setShowHint(false)} aria-label="Көмекті жабу">×</button>
      </div>}
      {task.kind === "typing"
        ? <label className="typingBox"><Keyboard /><textarea autoFocus value={value} disabled={checked} onChange={(event) => setValue(event.target.value)} placeholder="Жауапты қазақша жаз..." /><span>ә ғ қ ң ө ұ ү һ і</span></label>
        : <div className="genericChoices">{task.options!.map((option) => <button disabled={checked} className={value === option ? "selected" : ""} onClick={() => setValue(option)} key={option}>{option}</button>)}</div>}
      {checked && <div className={correct ? "inlineResult correct" : "inlineResult wrong"}><b>{correct ? "Дұрыс!" : "Қате бар"}</b><p>{correct ? "Жауап дұрыс таңдалды." : <>Дұрыс нұсқа: <strong>{task.answer}</strong></>}</p></div>}
      <footer>{!checked
        ? <><button type="button" onClick={() => setShowHint((visible) => !visible)} className={`hint ${showHint ? "active" : ""}`}><Lightbulb /> {showHint ? "Көмекті жасыру" : "Көмек"}</button><button disabled={!value.trim()} onClick={check} className="btn primary">Тексеру</button></>
        : <button onClick={next} className="btn primary">{step === tasks.length - 1 ? "Нәтиже" : "Келесі"} <ArrowRight /></button>}
      </footer>
    </main>
  </div>;
}
