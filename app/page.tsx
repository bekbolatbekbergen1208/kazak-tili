import Link from "next/link";
import "@/components/q-level/q-level.css";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Gamepad2,
  Sparkles,
  BookOpen,
  Compass,
  Check,
} from "lucide-react";
import { Logo, Mascot } from "@/components/icons";
export default function Landing() {
  return (
    <div className="landing">
      <nav className="landingNav">
        <Logo />
        <div>
          <Link href="#explore-title">Мүмкіндіктер</Link>
          <Link href="/about-research">Жоба туралы</Link>
          <Link href="/login" className="btn ghost">
            Кіру
          </Link>
          <Link href="/register" className="btn primary">
            Тіркелу
          </Link>
        </div>
      </nav>
      <main>
        <section className="landingHero">
          <div>
            <span className="pill">
              <span className="statusDot" /> ҚАЗАҚШАҒА БІР ҚАДАМ ЖАҚЫН
            </span>
            <h1>
              Қазақша үйрен.
              <br />
              <span>Өз әлеміңді кеңейт.</span>
            </h1>
            <p>
              Қызықты сабақтар, Қазақстанға саяхат және Досжанмен әңгіме. Әр күн
              — жаңа сөз, әр қадам — жаңа сенім.
            </p>
            <div className="heroBtns">
              <Link href="/register" className="btn primary">
                Тегін бастау <ArrowRight />
              </Link>
              <Link href="/learn?demo=1" className="btn ghost">
                Демо көру
              </Link>
            </div>
            <div className="trust">
              <span>
                <Check size={15} /> Қысқа әрі түсінікті сабақтар
              </span>
              <span>
                <Check size={15} /> Өз қарқыныңмен үйрен
              </span>
            </div>
          </div>
          <div className="landingVisual">
            <div className="journeyScene">
              <svg
                className="journeyLandscape"
                viewBox="0 0 540 520"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="sky"
                    x2="0"
                    y2="520"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#e4f0df" />
                    <stop offset="1" stopColor="#f5e9cc" />
                  </linearGradient>
                </defs>
                <rect width="540" height="520" rx="36" fill="url(#sky)" />
                <circle cx="407" cy="109" r="49" fill="#f5c976" />
                <path
                  d="M0 279 99 150 192 253 300 123 447 291 540 206V520H0Z"
                  fill="#adc6b1"
                />
                <path
                  d="m99 150-34 45 35-13 27 15ZM300 123l-47 64 48-18 40 22Z"
                  fill="#f7f8e9"
                />
                <path
                  d="M0 326Q130 226 291 335T540 307V520H0Z"
                  fill="#719b7a"
                />
                <path
                  d="M0 398Q125 310 279 397T540 370V520H0Z"
                  fill="#386b56"
                />
                <path
                  d="M0 470Q130 415 286 466T540 437V520H0Z"
                  fill="#205342"
                />
                <path
                  d="M394 335q-99 43-51 77t-30 108"
                  stroke="#e8d7ad"
                  strokeWidth="28"
                />
                <path
                  d="m52 111 12-7 12 7m54-26 9-5 9 5"
                  stroke="#416651"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="sceneLabel">
                <Compass size={15} /> Сенің тілдік саяхатың
              </span>
              <div className="sceneMascot">
                <Mascot />
              </div>
              <div className="sceneGreeting">
                Сәлем, жаңа дос! <span>Бірге үйренейік ✨</span>
              </div>
            </div>
            <div className="floatCard fc1">
              <span className="floatIcon">
                <BookOpen size={20} />
              </span>
              <div>
                <b>Бүгінгі жаңа сөз</b>
                <small>көкжиек · horizon</small>
              </div>
            </div>
            <div className="floatCard fc2">
              <span className="floatIcon">
                <Check size={20} />
              </span>
              <div>
                <b>Әр қадам маңызды</b>
                <small>Оқы. Қолдан. Есте сақта.</small>
              </div>
            </div>
          </div>
        </section>
        <section className="ql-marketing">
          <div className="ql-landing-symbol" aria-hidden="true">
            Q<span>LEVEL</span>
          </div>
          <div className="ql-landing-copy">
            <span className="overline">ӨЗ ДЕҢГЕЙІҢНЕН БАСТА</span>
            <h2>Қазақша деңгейің қандай?</h2>
            <p>
              Оқылым, тыңдалым, айтылым және жазылым. Деңгейіңді анықтап, өзіңе
              сай оқу жолын тап.
            </p>
            <small>Ішкі диагностика. Ресми сертификат емес.</small>
          </div>
          <Link href="/learn/q-level/quick" className="btn primary">
            Деңгейді анықтау <ArrowRight size={18} />
          </Link>
        </section>
        <section className="features">
          <div>
            <i>
              <Gamepad2 />
            </i>
            <h3>Ойын арқылы</h3>
            <p>
              Сюжеттік сапарлар мен қысқа тапсырмалар қызығушылықты сақтайды.
            </p>
          </div>
          <div>
            <i>
              <BrainCircuit />
            </i>
            <h3>Өзіңе бейім</h3>
            <p>Жүйе қиын сөздерді қайталап, келесі қадамды ұсынады.</p>
          </div>
          <div>
            <i>
              <Sparkles />
            </i>
            <h3>Досжанмен бірге</h3>
            <p>Қауіпсіз виртуалды дос түсіндіреді, сұрайды және қолдайды.</p>
          </div>
          <div>
            <i>
              <BarChart3 />
            </i>
            <h3>Нақты нәтиже</h3>
            <p>Мұғалім оқу ілгерілеуін тек анонимді деректермен көреді.</p>
          </div>
        </section>
        <section className="exploreSection" aria-labelledby="explore-title">
          <div className="exploreHeading">
            <div>
              <span className="pill">Өзіңе ұнайтын жолды таңда</span>
              <h2 id="explore-title">Бір тіл. Талай қызық әлем.</h2>
            </div>
            <p>Оқы, саяхатта, ойна. Әр жаңа сөзді өмірде қолданып үйрен.</p>
          </div>
          <div className="exploreGrid">
            {[
              {
                href: "/kazakhstan",
                icon: "🧭",
                title: "Қазақстанға саяхат",
                text: "Өңірлерді танып, жол үстінде жаңа сөздер үйрен.",
                tone: "mint",
              },
              {
                href: "/learn/books",
                icon: "📚",
                title: "Кітап әлемі",
                text: "Әңгімелерді оқы, кейіпкерлерді таны, тапсырмаларды орында.",
                tone: "peach",
              },
              {
                href: "/learn/national",
                icon: "🏕️",
                title: "Ұлттық ойындар",
                text: "Дәстүрмен танысып, біліміңді ойын арқылы сына.",
                tone: "lavender",
              },
              {
                href: "/learn/friend",
                icon: "💬",
                title: "Досжанмен әңгіме",
                text: "Сұрақ қой, сөйлем құра, қазақша сөйлесіп жаттық.",
                tone: "blue",
              },
            ].map((item) => (
              <Link
                className={`exploreCard ${item.tone}`}
                href={item.href}
                key={item.href}
              >
                <span className="exploreIcon" aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="exploreLink">
                  Танысу <ArrowRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="startSection" aria-labelledby="start-title">
          <div>
            <span className="pill">Алғашқы қадам оңай</span>
            <h2 id="start-title">Бүгін бір сөзден баста.</h2>
            <p>
              Мақсатыңды таңда. Қысқа сабақты аяқта. Ертең қайта келіп, жаңа
              жетістігіңді белгіле.
            </p>
            <Link href="/register" className="btn primary">
              Сапарымды бастау <ArrowRight size={18} />
            </Link>
          </div>
          <ol className="startSteps">
            <li>
              <b>01</b>
              <div>
                <h3>Өз мақсатыңды таңда</h3>
                <p>Күнделікті өмір, оқу немесе саяхат.</p>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <h3>Тыңда, оқы, жауап бер</h3>
                <p>Жаңа сөзді әртүрлі тапсырмада қолдан.</p>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <h3>Жетістігіңді жалғастыр</h3>
                <p>Қиын сөздерді қайталап, келесі сабаққа өт.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="landingFaq" aria-labelledby="faq-title">
          <h2 id="faq-title">Бастамас бұрын</h2>
          <details>
            <summary>Аккаунтсыз байқап көруге бола ма?</summary>
            <p>
              Иә. <Link href="/learn?demo=1">Демо кабинетті ашып</Link>,
              сабақтармен таныса аласың. Демо прогресс осы браузерде сақталады.
            </p>
          </details>
          <details>
            <summary>Досжан қалай көмектеседі?</summary>
            <p>
              Досжан қазақ тілі ережелерін түсіндіруге және сөйлемдерді
              жаттықтыруға көмектеседі. AI режимінің қолжетімділігі аккаунт пен
              қызмет баптауына байланысты. Жауаптарды оқу материалымен
              салыстырып отыр.
            </p>
          </details>
          <details>
            <summary>Неден бастаған дұрыс?</summary>
            <p>
              Тіркелген соң мақсатыңды таңдап, алғашқы сабаққа өт. Күн сайын
              қысқа уақыт бөліп, қиын сөздерді қайталап отыр.
            </p>
          </details>
        </section>
      </main>
      <footer className="landingFooter">
        <Logo />
        <p>Қазақша үйрен. Әлеміңді кеңейт.</p>
        <Link href="/about-research">Жоба туралы</Link>
        <Link href="/methodology">Оқу әдістемесі</Link>
      </footer>
    </div>
  );
}
