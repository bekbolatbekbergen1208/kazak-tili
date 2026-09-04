"use client";

import Link from "next/link";
import {ArrowRight, BookOpen, Check, Clock, Lock, Play, Star, Trophy, Zap} from "lucide-react";
import {Mascot} from "./icons";
import {Shell, StudentTop} from "./shell";
import {courseLessons} from "@/lib/curriculum";
import {useLessonProgress} from "@/lib/lesson-progress";

export default function StudentHome() {
  const {unlockedLesson} = useLessonProgress();
  const courseComplete = unlockedLesson > 1000;
  const current = courseLessons[Math.min(unlockedLesson, 1000) - 1];
  const completed = Math.min(unlockedLesson - 1, 1000);
  const percent = Math.round((completed / 1000) * 100);
  const levelNumber = Math.min(5, Math.floor((current.id - 1) / 200) + 1);
  const nearby = courseLessons.slice(Math.max(0, current.id - 2), Math.min(1000, current.id + 2));

  return <Shell><div className="page">
    <StudentTop title="Сәлем, Айбын! 👋" sub="1000 сабақты ретімен меңгер" />
    <section className="heroCard">
      <div className="heroCopy">
        <span className="eyebrow">{courseComplete ? "1000 САБАҚ АЯҚТАЛДЫ" : `КЕЛЕСІ САБАҚ • №${current.id} • ${current.level}`}</span>
        <h2>{courseComplete ? "Курсты толық меңгердің!" : current.title}</h2>
        <p>{current.context}: {current.words.join(", ")}. Алдыңғы сабақты аяқтағаннан кейін келесі сабақ автоматты түрде ашылады.</p>
        <div className="heroMeta"><span><Clock /> 10 минут</span><span><Star /> +100 ұпай</span></div>
        <Link href={`/student/lesson/${current.id}`} className="btn white">{courseComplete ? "Соңғы сабақты қайталау" : completed ? "Оқуды жалғастыру" : "Бірінші сабақты бастау"} <ArrowRight size={18} /></Link>
      </div>
      <div className="heroArt"><div className="speech">№{current.id} сабаққа дайынсың ба?</div><Mascot /></div>
    </section>
    <div className="statsGrid">
      <div className="stat"><i className="sun"><Zap /></i><div><strong>{levelNumber}</strong><span>Деңгей</span></div></div>
      <div className="stat"><i className="coral"><Star /></i><div><strong>{completed * 100}</strong><span>Жалпы ұпай</span></div></div>
      <div className="stat"><i className="violet"><Trophy /></i><div><strong>{completed}</strong><span>Аяқталған сабақ</span></div></div>
      <div className="stat"><i className="green"><BookOpen /></i><div><strong>{percent}%</strong><span>Жалпы прогресс</span></div></div>
    </div>
    <section className="panel lessonPath">
      <div className="sectionHead"><div><h3>Сабақ реті</h3><p>Бір сабақты аяқта — келесісін аш</p></div><Link href="/student/lessons">1000 сабақты көру</Link></div>
      <div className="homeLessonPath">{nearby.map((lesson) => {
        const isDone = lesson.id < unlockedLesson;
        const isCurrent = lesson.id === unlockedLesson;
        return <div className={isDone ? "done" : isCurrent ? "current" : "locked"} key={lesson.id}>
          <span>{isDone ? <Check /> : isCurrent ? <Play /> : <Lock />}</span>
          <div><small>№{lesson.id} • {lesson.level}</small><b>{lesson.title}</b></div>
          {isCurrent && <Link href={`/student/lesson/${lesson.id}`}>Бастау <ArrowRight /></Link>}
        </div>;
      })}</div>
    </section>
  </div></Shell>;
}
