import Link from "next/link";
import { assessmentSources, methodologyVersion } from "@/lib/q-level/methodology";
import { questionBank } from "@/lib/q-level/questions";
import "@/components/q-level/q-level.css";
export default function MethodologyPage() {
  const items = questionBank;
  return <main className="page ql-page"><Link href="/learn/q-level">← Q-Level</Link>
    <section className="ql-panel"><h1>Q-Level: әдістеме және әдебиеттер</h1><p>Нұсқа: {methodologyVersion} · авторлық пилот, ресми емтихан емес.</p><p>Дереккөзге бағдарлану — тесттің сол ұйыммен мақұлданғанын немесе деңгейдің дәлелденгенін білдірмейді. Жаңа тестте Айгүл мен Дәулеттің синтетикалық аудиосымен тыңдалым қосылған. Бұрын басталған нұсқаның құрылымы сақталады. Жазылым мен айтылым автоматты бағаланбайды.</p></section>
    <section className="ql-panel"><h2>Неге сүйенеміз?</h2>{assessmentSources.map(s => <article key={s.id}><h3>{s.author} ({s.year})</h3><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><p>{s.use}</p></article>)}</section>
    <section className="ql-panel"><h2>Бағалау нені білдіреді?</h2><p>Q-Score — тапсырма қиындығын ескеретін ішкі формула. 25/45/65/85 шектері CEFR немесе ҚАЗТЕСТ нормаларынан алынған жоқ. A1–B2 — оқу мазмұнын таңдауға арналған әзіргі болжам; қысқа тапсырмалардың негізінде C1 расталмайды.</p><p>«Дерек жеткіліктілігі» — жауап санына негізделген ішкі индикатор, статистикалық сенімділік пайызы емес. Тапсырмаларға жауап беру жылдамдығы тіл деңгейінің бағасы ретінде қолданылмайды.</p><p>Бұрынғы нәтижелер өзгертілмейді. Сұрақтардың мақсатты деңгейі қайта қаралғандықтан, әртүрлі нұсқалардың ұпай айырмасын оқу әсерінің дәлелі деп санауға болмайды.</p></section>
    <section className="ql-panel"><h2>Әр тапсырманың мақсаты</h2><p>Төмендегі сәйкестендіру — әзірлеушінің бастапқы талдауы. Тіл маманының тәуелсіз сараптамасы мен пилоттық деректер әлі жоқ.</p>{items.map(q => <details key={q.id}><summary>{q.id} · {q.level} · {q.alignment?.objective}</summary><p>Шкала: {q.alignment?.cefrScale}</p><p>{q.alignment?.limitation}</p><p>Күйі: сараптау мен калибрлеу қажет.</p></details>)}</section>
    <section className="ql-panel"><h2>Растау үшін келесі қадамдар</h2><ol><li>Қазақ тілі мамандарының сұрақ, жауап, дистрактор және деңгей сәйкестігін тәуелсіз тексеруі.</li><li>Мақсатты жас пен тілдік топтарда келісіммен пилот жүргізу.</li><li>Сұрақ қиындығы, ажыратушылық, дистракторлар және жалпы сенімділікті талдау.</li><li>Сарапшылармен деңгей шектерін белгілеу және сыртқы өлшеммен салыстыру.</li><li>Қайта өлшеуге балама нұсқалар дайындап, нұсқа әсерін оқу әсерінен бөлу.</li></ol></section>
  </main>;
}
