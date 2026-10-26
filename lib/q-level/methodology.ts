import type { Level, Skill } from "./types";
export const methodologyVersion = "descriptor-pilot-2026-10";
export const assessmentSources = [
  { id: "cefr2020", author: "Council of Europe", year: "2020", title: "CEFR — Companion volume", url: "https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4", use: "Оқылым және тілдік құзырет шкалалары; тапсырманың қандай әрекетті өлшейтінін сипаттау." },
  { id: "qaztest2023", author: "Ұлттық тестілеу орталығы", year: "2023", title: "Қазақ тілін меңгеру деңгейлерінің сипаттамалары", url: "https://testcenter.kz/?page_id=23654", use: "Қазақ тіліндегі коммуникативтік мазмұнды жоспарлау. ҚАЗТЕСТ тапсырмалары көшірілген жоқ." },
  { id: "alte2011", author: "ALTE / Council of Europe", year: "2011", title: "Manual for Language Test Development and Examining", url: "https://rm.coe.int/1680667a2b", use: "Спецификация, сараптау, пилоттау, сенімділік пен әділдікті тексеру үдерісі." },
] as const;
const objectives = [
  "Танысу жағдаятында жіктік жалғауын таңдау", "Заттың кімге тиесілі екенін білдіру",
  "Кеше болған әрекетті білдіру", "Ертеңгі жоспарды білдіру",
  "Шарт пен нәтижені байланыстыру", "Қарсылықты байланысты тану",
  "Іс-әрекеттің мақсатын білдіру", "Әрекеттердің уақыттық ретін тану",
  "Қарсылық пен іске аспаған нәтижені байланыстыру", "Шектеу мен тыйымды ажырату",
  "Күнделікті сөздің қарама-қарсы мағынасын тану", "Жағдаятқа сай күнделікті сөзді таңдау",
  "Қонақ қарсы алу тіркесін таңдау", "Қызмет орнының атауын жағдаятпен байланыстыру",
  "Тұрақты тіркестің мағынасын тану", "Мақсатты білдіретін сөзді тану",
  "Сөздің контекстегі мағынасын түсіндіру", "Орынды сөз тіркесін таңдау",
  "Абстрактілі атаудың мағынасын тану", "Пікірді негіздеу ұғымын ажырату",
  "Қысқа таныстырудан нақты ақпаратты табу", "Хабарландырудан уақытты табу",
  "Қысқа оқиғадағы себепті анықтау", "Хабарламадағы өзгерісті анықтау",
  "Жоба сипаттамасынан негізгі мақсатты табу", "Қысқа кеңестің негізгі ойын табу",
  "Қысқа дәлелді мәтіндегі автор ұстанымын тану", "Дәлелдерді байланыстырып қорытынды таңдау",
  "Қысқа талдаудағы астарлы болжамды тану", "Қорытындының қолданылу шегін анықтау",
] as const;
export function questionAlignment(id: string, skill: Skill, level: Level) {
  const index = Number(id.replace("q-", "")) - 1;
  const objective = objectives[index];
  if (!objective || skill === "listening") return undefined;
  return {
    version: methodologyVersion,
    objective,
    targetBand: level,
    status: "pilot-unvalidated" as const,
    cefrScale: skill === "reading" ? "3.1.1.3 Reading comprehension, pp. 53–58" : skill === "grammar" ? "5.1 Grammatical accuracy, p. 132" : "5.1 Vocabulary range / control, pp. 131–132",
    sourceIds: ["cefr2020", "qaztest2023", "alte2011"],
    limitation: skill === "reading" ? "Қысқа мәтін үлгісі ғана; толық деңгейдің дәлелі емес." : "Дұрыс нұсқаны тануды өлшейді; еркін сөйлеу мен жазуды бағаламайды.",
  };
}
