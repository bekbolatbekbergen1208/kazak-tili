import Link from "next/link";
import "@/components/q-level/q-level.css";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Gamepad2,
  Sparkles,
  Music,
  Compass,
} from "lucide-react";
import { Logo, Mascot } from "@/components/icons";
export default function Landing() {
  return (
    <div className="landing">
      <nav className="landingNav">
        <Logo />
        <div>
          <Link href="/about-research">Зерттеу туралы</Link>
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
            <span className="pill">Әр сөз — жаңа әлемге жол</span>
            <h1>
              Қазақ тілін
              <br />
              <span>ойынмен, саяхатпен және Досшамен үйрен.</span>
            </h1>
            <p>
              Ойын, қызықты оқиға және Досжан атты виртуалды дос арқылы қазақша
              сөйлеуге сенімді қадам жаса.
            </p>
            <div className="heroBtns">
              <Link href="/register" className="btn primary">
                Үйренуді бастау <ArrowRight />
              </Link>
              <Link href="/learn?demo=1" className="btn ghost">
                Байқап көру
              </Link>
            </div>
            <div className="trust">
              <span>✓ Өзіңе ыңғайлы қарқын</span>
              <span>✓ Қысқа сабақтар, күнделікті тәжірибе</span>
            </div>
          </div>
          <div className="landingVisual journey-scene">
            <div className="journey-sun" />
            <svg
              className="journey-landscape"
              viewBox="0 0 560 460"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M0 290 130 95 240 250 350 65 560 300V460H0Z"
                fill="var(--qd-brand-light)"
              />
              <path
                d="m130 95-43 65 42-14 30 24 18-10Zm220-30-57 98 52-26 38 27 26-18Z"
                fill="var(--qd-glass-solid)"
              />
              <path d="M0 320Q135 230 280 325T560 290V460H0Z" fill="#9181db" />
              <path d="M0 388Q160 285 340 370T560 340V460H0Z" fill="var(--qd-brand-dark)" />
              <path
                d="M335 460Q180 370 290 340T310 292"
                stroke="var(--qd-lavender)"
                strokeWidth="18"
                strokeLinecap="round"
              />
            </svg>
            <div className="floatCard fc1">
              <Compass size={22} />
              <b>Еліңді таны</b>
              <small>Қазақстанға саяхат</small>
            </div>
            <div className="mascotBlob">
              <Mascot />
            </div>
            <div className="floatCard fc2">
              <Music size={22} />
              <b>Әнмен үйрен</b>
              <small>Тыңда. Қосылып айт.</small>
            </div>
            <span className="journey-caption">Сәлем! Бірге үйренейік.</span>
          </div>
        </section>
        <section className="ql-marketing">
          <span className="pill">QAZAQDOS Q-LEVEL</span>
          <h2>Қазақша деңгейің қандай?</h2>
          <p>
            QazaqDos Q-Level арқылы қазақ тіліндегі оқылым, тыңдалым, айтылым
            және жазылым деңгейіңді анықта.
          </p>
          <p>
            <strong>Q-Level B1 · 68 Q-Score</strong> — нәтиже үлгісі
          </p>
          <Link href="/learn/q-level/quick" className="btn primary">
            Деңгейді анықтау →
          </Link>
          <p>Нәтиже бойынша QazaqDos сізге жеке оқу маршрутын ұсынады.</p>
          <small>Ішкі диагностикалық жүйе. Ресми сертификат емес.</small>
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
                href: "/learn/songs",
                icon: "🎵",
                title: "Әнмен үйрен",
                text: "Ән тыңда, жаңа сөздерді тап, караокеде қосылып айт.",
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
