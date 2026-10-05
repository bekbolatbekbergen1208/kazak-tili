"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react";
import { approvedCorpus, literatureLessons } from "@/lib/literary/corpus";
import { literaryWords } from "@/lib/literary/words";
import { useLanguage } from "./provider";
import { WordCard } from "./word";
function AnnotatedText({
  text,
  onWord,
}: {
  text: string;
  onWord: (id: string) => void;
}) {
  const lookup = new Map(
    literaryWords.flatMap((w) =>
      w.forms.map((form) => [form.toLocaleLowerCase(), w.id] as const),
    ),
  );
  const phrases = [...lookup.keys()]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(
    `((?<!\\p{L})(?:${phrases.join("|")})(?!\\p{L}))`,
    "giu",
  );
  return (
    <div className="lit-excerpt">
      {text.split(regex).map((part, i) =>
        lookup.has(part.toLocaleLowerCase()) ? (
          <button
            key={i}
            onClick={() => onWord(lookup.get(part.toLocaleLowerCase())!)}
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}
export default function Literature() {
  const l = useLanguage();
  const [selected, setSelected] = useState(""),
    [word, setWord] = useState(""),
    [filter, setFilter] = useState("all"),
    [feedback, setFeedback] = useState(""),
    [writing, setWriting] = useState("");
  const lesson = literatureLessons.find((x) => x.id === selected),
    source = approvedCorpus.find((x) => x.id === lesson?.corpusId),
    progress = lesson ? l.state.lessons[lesson.id] : null;
  return (
    <div className="page lit-page">
      <header className="lit-heading">
        <div>
          <span className="overline">СӨЗДІ СЕЗІН. ОЙЫҢДЫ ЖЕТКІЗ.</span>
          <h1>Әдебиет арқылы қазақ тілі</h1>
          <p>Қысқа мәтінді оқы. Жаңа сөзді таны. Өз ойыңда қолдан.</p>
        </div>
        <BookOpen size={32} />
      </header>
      <div className="lit-notice">
        Алғашқы жинақ — QazaqDos үшін арнайы жазылған оқу мәтіндері. Сыртқы
        автордың дәйексөзі ретінде берілмейді.
      </div>
      <nav className="lit-links">
        <Link href="/learn/vocabulary">Менің сөз қорым →</Link>
        <Link href="/learn/writing-coach">Қазақша жазу көмекшісі →</Link>
      </nav>
      {l.error && (
        <p className="lit-error" role="alert">
          {l.error}
          <button onClick={() => void l.load()}>Қайта жүктеу</button>
        </p>
      )}
      {!l.ready ? (
        <p>Оқу прогресі жүктелуде…</p>
      ) : !lesson ? (
        <>
          <div className="lit-levels">
            {["all", "A1", "A2", "B1", "B2", "C1"].map((level) => (
              <button
                key={level}
                className={filter === level ? "active" : ""}
                onClick={() => setFilter(level)}
              >
                {level === "all" ? "Барлық деңгей" : level}
              </button>
            ))}
          </div>
          <div className="lit-grid">
            {literatureLessons
              .filter((x) => filter === "all" || x.level === filter)
              .map((x, i) => (
                <button
                  className="lit-text-card"
                  key={x.id}
                  onClick={() => {
                    setSelected(x.id);
                    setWord(x.wordIds[0]);
                    setWriting(l.state.lessons[x.id]?.writing ?? "");
                    setFeedback("");
                  }}
                >
                  <span className="lit-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="pill">{x.level}</span>
                  <h2>{x.title}</h2>
                  <p>{x.mainIdea}</p>
                  <small>
                    {x.wordIds.length} сөз · 2 сұрақ · жазу тапсырмасы
                  </small>
                  <b>
                    {l.state.lessons[x.id]?.completedAt
                      ? "✓ Аяқталды"
                      : "Оқуды бастау →"}
                  </b>
                </button>
              ))}
          </div>
        </>
      ) : source ? (
        <>
          <button className="btn ghost" onClick={() => setSelected("")}>
            <ArrowLeft size={16} /> Мәтіндерге оралу
          </button>
          <div className="lit-reading-grid">
            <section className="lit-panel">
              <span className="pill">
                {lesson.level} · {source.genre}
              </span>
              <h2>{source.title}</h2>
              <small>
                {source.author} · {source.license}
              </small>
              <AnnotatedText text={source.text} onWord={setWord} />
              <small>Асты сызылған сөзді басып, мағынасын аш.</small>
              <details>
                <summary>Мәтінді талдау</summary>
                <h3>Негізгі ой</h3>
                <p>{lesson.mainIdea}</p>
                <h3>Стиль</h3>
                <p>{lesson.styleAnalysis}</p>
                <h3>Грамматика үлгілері</h3>
                {lesson.grammar.map((x) => (
                  <p key={x}>{x}</p>
                ))}
                <h3>Қызықты тіркестер</h3>
                <p>
                  {lesson.expressions.join(" · ") ||
                    "Бұл мәтінде арнайы тұрақты тіркес жоқ."}
                </p>
                <h3>Кейіпкер сөзі</h3>
                <p>{lesson.characterSpeech}</p>
              </details>
            </section>
            <aside className="lit-word-aside">
              <WordCard wordId={word || lesson.wordIds[0]} />
            </aside>
          </div>
          <section className="lit-panel">
            <h2>Оқығаныңды түсіндің бе?</h2>
            {lesson.questions.map((q) => (
              <div className="lit-question" key={q.id}>
                <h3>{q.question}</h3>
                {progress?.correct.includes(q.id) ? (
                  <p className="lit-correct">
                    <CheckCircle2 size={16} /> {q.explanation}
                  </p>
                ) : (
                  <div className="lit-answer-options">
                    {q.options.map((answer) => (
                      <button
                        disabled={l.busy}
                        key={answer}
                        onClick={async () => {
                          const result = await l.dispatch({
                            type: "literature-answer",
                            lessonId: lesson.id,
                            questionId: q.id,
                            answer,
                          });
                          if (result)
                            setFeedback(
                              result.correct
                                ? q.explanation
                                : "Мәтінге қайта қарап көр.",
                            );
                        }}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p role="status">{feedback}</p>
            <h3>Өз ойыңды жаз</h3>
            <p>{lesson.writingTask}</p>
            <textarea
              aria-label="Әдебиетке жазылым жауабы"
              rows={5}
              maxLength={5000}
              value={writing}
              disabled={!!progress?.completedAt}
              onChange={(e) => setWriting(e.target.value)}
            />
            <button
              className="btn ghost"
              disabled={l.busy || !!progress?.completedAt}
              onClick={() =>
                void l.dispatch({
                  type: "literature-writing",
                  lessonId: lesson.id,
                  text: writing,
                })
              }
            >
              Жауапты сақтау
            </button>
            <button
              className="btn primary"
              disabled={l.busy || !!progress?.completedAt}
              onClick={async () => {
                const result = await l.dispatch({
                  type: "literature-finish",
                  lessonId: lesson.id,
                });
                if (result)
                  setFeedback(
                    result.xp
                      ? `Мәтін аяқталды! +${result.xp} XP`
                      : "Бұл мәтін бұрын аяқталған.",
                  );
              }}
            >
              {progress?.completedAt ? "✓ Аяқталды" : "Мәтінді аяқтау · +20 XP"}
            </button>
            <p>
              <small>
                XP түсіну сұрақтары мен өз жауабыңды аяқтағаның үшін беріледі.
                Жазылымға ресми баға қойылмайды.
              </small>
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
