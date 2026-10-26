// Reviewed literary facts, independent of a model's agreement with a user's claim.
export function literaryReference(message: string): string | null {
  const text = message.toLocaleLowerCase("kk-KZ");
  if (text.length > 600) return null;
  if (/дәйексөз|цитат|дәл.{0,25}(?:сөйлем|үзінді)/u.test(text)
      && (/\d+[-\s]*бет/u.test(text) || /ойлап тап|мәтіні? қолыңда жоқ/u.test(text))) {
    return "Қолымда сұралған басылымның сол беті жоқ, сондықтан дәл үзінді бере алмаймын. Басылымын және тиісті мәтінді жіберсең, берілген үзіндіні талдап түсіндіремін.";
  }
  if (/абай/u.test(text) && /31|отыз бірінші/u.test(text) && /қара\s*сөз/u.test(text)
      && !/дәйексөз|цитат|дәл.{0,20}үзінді/u.test(text)) {
    return "31-қара сөзде естігенді ұмытпау үшін зейін қою, мәнін түсіну, қайталап ойлау және ойды бөлетін нәрселерден сақтану жайы айтылады. Бұл — қысқа мазмұндама, Абайдың дәл дәйексөзі емес.\nДереккөз: https://www.abai.institute/qara-sozder/otyz-birinsi-soz";
  }
  if (!/автор|кім жаз|жазған.{0,70}дұрыс|дұрыс.{0,70}жазған/u.test(text)
      || /дәйексөз|цитат/u.test(text)) return null;
  const facts: string[] = [];
  if (/қара\s*сөз/u.test(text)) facts.push("«Қара сөздерді» Абай Құнанбайұлы жазған. Бұл — прозалық ой-толғамдар.");
  if (/абай жол/u.test(text)) facts.push("«Абай жолының» авторы — Мұхтар Әуезов. Жанры — роман-эпопея.");
  if (/махаббат.{0,12}қызық мол жыл/u.test(text)) facts.push("«Махаббат, қызық мол жылдар» романының авторы — Әзілхан Нұршайықов.");
  if (/жусан иіс/u.test(text)) facts.push("«Жусан иісі» повесінің авторы — Сайын Мұратбеков.");
  return facts.length ? facts.join("\n") : null;
}
