import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Gamepad2,
  Sparkles,
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
            <span className="pill">Қазақ тілі • Ойын • AI дос</span>
            <h1>
              Қазақ тілін
              <br />
              <span>саяхатпен үйрен!</span>
            </h1>
            <p>
              Ойын, қызықты оқиға және Досжан атты виртуалды дос арқылы қазақша
              сөйлеуге сенімді қадам жаса.
            </p>
            <div className="heroBtns">
              <Link href="/register" className="btn primary">
                Тегін бастау <ArrowRight />
              </Link>
              <Link href="/teacher" className="btn ghost">
                Зерттеуші демосы
              </Link>
            </div>
            <div className="trust">
              <span>✓ Аккаунт Supabase арқылы қорғалады</span>
              <span>✓ Қысқа сабақтар, күнделікті тәжірибе</span>
            </div>
          </div>
          <div className="landingVisual">
            <div className="floatCard fc1">
              🔥 <b>7 күн</b>
              <small>серия үлгісі</small>
            </div>
            <div className="mascotBlob">
              <Mascot />
            </div>
            <div className="floatCard fc2">
              +120 <b>ұпай</b>
              <small>марапат үлгісі</small>
            </div>
          </div>
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
