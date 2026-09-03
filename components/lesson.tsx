"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {ArrowRight, Check, Headphones, Heart, Lightbulb, MessageCircle, Mic, RefreshCw, RotateCcw, Star, Volume2, X} from "lucide-react";
import {Mascot} from "./icons";
import {words} from "@/lib/data";

type Question={id:number;skill:string;type:string;title:string;hint:string;options:string[];answer:string;word:string;explanation:string};
type Mistake={questionId:number;chosen:string;round:number};
const baseQuestions:Question[]=[
 {id:1,skill:"Тыңдалым",type:"Тыңда және таңда",title:"Мынау не?",hint:"Адамдар ұшаққа осы жерде отырады.",options:["Теміржол","Әуежай","Мектеп"],answer:"Әуежай",word:"әуежай",explanation:"Әуежай — ұшақ ұшатын және қонатын орын."},
 {id:2,skill:"Грамматика",type:"Сөйлемді толықтыр",title:"Мен Астанаға ___ барамын.",hint:"Көлік атауына «-пен» жалғауы жалғанады.",options:["ұшақпен","кітаппен","сумен"],answer:"ұшақпен",word:"ұшақ",explanation:"Қалай барамын? — ұшақпен. Көмектес септік көлік құралын білдіреді."},
 {id:3,skill:"Лексика",type:"Дұрыс жауапты таңда",title:"Сапарға шығу үшін не керек?",hint:"Оны кассадан немесе интернеттен сатып аласың.",options:["Билет","Доп","Қалам"],answer:"Билет",word:"билет",explanation:"Билет жолаушының сапарға шығу құқығын растайды."},
 {id:4,skill:"Жазылым",type:"Сөйлем құрастыр",title:"Сөздерді дұрыс ретпен қой.",hint:"Сөйлем «Мен» сөзінен басталады.",options:["Мен Астанаға барғым келеді","Барғым мен келеді Астанаға","Астанаға келеді мен"],answer:"Мен Астанаға барғым келеді",word:"қала",explanation:"Қалыпты реті: бастауыш + мекен/бағыт + қимыл."},
 {id:5,skill:"Оқылым",type:"Мәтінді түсіну",title:"Аян билетін алып, жүгін тапсырды. Ол келесіде не істейді?",hint:"Ол әуежайда және сапарға дайын.",options:["Ұшаққа отырады","Мектепке барады","Доп ойнайды"],answer:"Ұшаққа отырады",word:"жүк",explanation:"Билет пен жүк — әуежайдағы сапар ретін көрсететін тірек сөздер."},
 {id:6,skill:"Айтылым",type:"Диалог репликасы",title:"Досша: «Сен қай қалаға барғың келеді?»",hint:"Толық әрі сыпайы жауапты таңда.",options:["Мен Астанаға барғым келеді","Астана","Білмеймін қала"],answer:"Мен Астанаға барғым келеді",word:"қала",explanation:"Диалогте толық сөйлем қолдану ойды анық жеткізеді."}
];
const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

export default function Lesson(){
 const [vocabIndex,setVocabIndex]=useState(0); const [started,setStarted]=useState(false);
 const [queue,setQueue]=useState<number[]>(baseQuestions.map(q=>q.id)); const [queueIndex,setQueueIndex]=useState(0);
 const [round,setRound]=useState(1); const [wrongIds,setWrongIds]=useState<number[]>([]); const [selected,setSelected]=useState("");
 const [checked,setChecked]=useState(false); const [score,setScore]=useState(0); const [attempts,setAttempts]=useState(0);
 const [hints,setHints]=useState(0); const [mastered,setMastered]=useState<number[]>([]); const [done,setDone]=useState(false);
 const [mistakeLog,setMistakeLog]=useState<Mistake[]>([]); const [reviewing,setReviewing]=useState(false);
 const [options,setOptions]=useState<string[]>([]);
 const question=baseQuestions.find(q=>q.id===queue[queueIndex]) ?? baseQuestions[0];
 useEffect(()=>{setOptions(round>1?shuffle(question.options):question.options)},[question.id,round]);
 useEffect(()=>{const raw=localStorage.getItem("qd-travel-result");if(raw){try{const d=JSON.parse(raw);if(d.score)setScore(d.score)}catch{}}},[]);
 const progress=useMemo(()=>!started?(vocabIndex/words.length)*35:35+(mastered.length/baseQuestions.length)*65,[started,vocabIndex,mastered.length]);
 function check(){if(!selected)return;setAttempts(a=>a+1);setChecked(true);if(selected===question.answer){if(!mastered.includes(question.id))setMastered(m=>[...m,question.id]);setScore(s=>s+(round===1?20:10))}else{setWrongIds(w=>w.includes(question.id)?w:[...w,question.id]);setMistakeLog(log=>[...log,{questionId:question.id,chosen:selected,round}])}}
 function next(){const isLast=queueIndex===queue.length-1;
   if(selected!==question.answer){if(!isLast){setQueueIndex(i=>i+1);setSelected("");setChecked(false);return}setReviewing(true);return}
   if(!isLast){setQueueIndex(i=>i+1);setSelected("");setChecked(false);return}
   if(wrongIds.length){setReviewing(true);return}
   setDone(true);localStorage.setItem("qd-travel-result",JSON.stringify({score,attempts:attempts+1,hints,mastered:baseQuestions.length,completedAt:new Date().toISOString()}));
 }
 function startRetry(){setQueue(shuffle(wrongIds));setQueueIndex(0);setWrongIds([]);setRound(r=>r+1);setSelected("");setChecked(false);setReviewing(false)}
 if(done)return <div className="lessonDone"><div className="confetti">✦　✧　✦</div><Mascot/><span className="pill">БАРЛЫҚ СӨЗ МЕҢГЕРІЛДІ</span><h1>Жарайсың, саяхатшы!</h1><p>Сен барлық қате тапсырманы қайта орындап, «Саяхат» модулін толық меңгердің.</p><div className="result"><div><strong>{score}</strong><span>ұпай</span></div><div><strong>{attempts+1}</strong><span>әрекет</span></div><div><strong>{round}</strong><span>айналым</span></div><div><strong>{hints}</strong><span>көмек</span></div></div><p className="adaptive"><Check/> Келесі сабақ: A1 • Әуежайдағы қысқа диалог</p><Link className="btn primary" href="/student/assessment">Дағдыларымды көру</Link></div>;
 if(reviewing){const currentMistakes=mistakeLog.filter(m=>m.round===round);return <div className="mistakeReview"><header><span className="reviewIcon"><RotateCcw/></span><div><span className="overline">ҚАТЕМЕН ЖҰМЫС</span><h1>Нақты қателерді қарап шығайық</h1><p>Алдымен қатенің себебін түсін, содан кейін осы тапсырмаларды қайта орында.</p></div></header><main>{currentMistakes.map((m,i)=>{const q=baseQuestions.find(x=>x.id===m.questionId)!;return <article key={`${m.questionId}-${i}`}><div className="reviewTop"><span>{q.skill}</span><em>{i+1}/{currentMistakes.length}</em></div><h3>{q.title}</h3><div className="answerCompare"><div className="chosen"><small>Сенің жауабың</small><b>✕ {m.chosen}</b></div><div className="correctAnswer"><small>Дұрыс жауап</small><b>✓ {q.answer}</b></div></div><p><Lightbulb/> {q.explanation}</p></article>})}<div className="reviewAction"><div><b>{currentMistakes.length} қате тапсырма</b><span>Сұрақтар мен жауап орындары араластырылады</span></div><button onClick={startRetry} className="btn primary">Қайта орындау <RefreshCw/></button></div></main></div>}
 if(!started){const word=words[vocabIndex];return <LessonFrame progress={progress} score={score}><span className="overline">КОНТЕКСТ ЖӘНЕ ЖАҢА СӨЗ • {vocabIndex+1}/{words.length}</span><h1>Жаңа сөзбен таныс</h1><div className="wordCard"><div className="wordEmoji">{word.emoji}</div><button aria-label="Сөзді тыңдау"><Volume2/></button><h2>{word.kk}</h2><p>{word.ru}</p><div className="example">«Мен <b>{word.kk}</b> сөзін күнделікті жағдайда қолданамын.»</div></div><div className="friendTip"><Mascot/><div><b>Тыңда → қайтала → сөйлемде қолдан</b><p>Сөзді дауыстап екі рет айтып, суретпен байланыстыр.</p></div></div><button className="btn primary nextBtn" onClick={()=>vocabIndex<words.length-1?setVocabIndex(i=>i+1):setStarted(true)}>Жалғастыру <ArrowRight/></button></LessonFrame>}
 const correct=selected===question.answer;
 return <LessonFrame progress={progress} score={score}><div className="lessonRound"><span className="overline">{round===1?"НЕГІЗГІ АЙНАЛЫМ":`ҚАТЕМЕН ЖҰМЫС • ${round}-АЙНАЛЫМ`}</span><em>{queueIndex+1}/{queue.length}</em></div><div className="skillBadge">{question.skill==='Тыңдалым'?<Headphones/>:question.skill==='Айтылым'?<Mic/>:<MessageCircle/>}{question.skill}</div><h1>{question.title}</h1><div className="questionScene"><div className="airport">✈️<span>АСТАНА</span></div><Mascot/></div><div className="answers">{options.map((o,i)=><button disabled={checked} onClick={()=>setSelected(o)} className={`${selected===o?'selected':''} ${checked&&o===question.answer?'correct':''} ${checked&&selected===o&&o!==question.answer?'wrong':''}`} key={`${question.id}-${round}-${o}`}><kbd>{i+1}</kbd>{o}{checked&&o===question.answer&&<Check/>}</button>)}</div>{!checked?<div className="lessonActions"><button className="hint" onClick={()=>{setHints(h=>h+1);alert(question.hint)}}><Lightbulb/> Көмек</button><button disabled={!selected} onClick={check} className="btn primary">Тексеру</button></div>:<div className={`feedback ${correct?'good':'bad'}`}><span>{correct?<Check/>:<RotateCcw/>}</span><div><b>{correct?'Дұрыс! Дағды бекітілді.':'Қазір түсініп алайық'}</b><p>{question.explanation} {!correct&&'Қате сұрақ барлық тапсырмадан кейін араластырылып қайта беріледі.'}</p></div><button className="btn primary" onClick={next}>{correct?(queueIndex===queue.length-1&&wrongIds.length?'Қателерді қайталау':'Жалғастыру'):(queueIndex===queue.length-1?'Қателерді араластырып қайталау':'Келесі сұрақ')} {correct?<ArrowRight/>:<RefreshCw/>}</button></div>}</LessonFrame>
}

function LessonFrame({children,progress,score}:{children:React.ReactNode;progress:number;score:number}){return <div className="lessonPage"><header><Link href="/student"><X/></Link><div className="progress"><i style={{width:`${progress}%`}}/></div><span><Heart fill="currentColor"/> 5</span><span className="lessonScore"><Star fill="currentColor"/> {score}</span></header><main>{children}</main></div>}
