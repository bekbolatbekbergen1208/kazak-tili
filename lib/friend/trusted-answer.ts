import { findKazakhExample } from "../dosha/kazakh-examples";
import { literaryReference } from "./literary-reference";

// Narrow teaching references. Do not let an unvalidated model rewrite these facts.
export function trustedTeachingAnswer(message: string): string | null {
  const literary = literaryReference(message);
  if (literary) return literary;
  const normalized = message.toLocaleLowerCase("kk-KZ").replace(/[«»“”"?!.,:]/gu, "").replace(/\s+/gu, " ").trim();
  if (normalized.length < 250 && !/дәйексөз|цитат|үзінді|талда|неге/iu.test(normalized)
      && /автор|кім жаз/iu.test(normalized)
      && /абай жолы/iu.test(normalized) && /қара сөз/iu.test(normalized)) {
    return "«Қара сөздердің» авторы — Абай Құнанбайұлы.\n«Абай жолы» роман-эпопеясының авторы — Мұхтар Әуезов.";
  }
  const corrections: Record<string, { corrected: string; reason: string; practice: string }> = {
    "мен ертең ауылға барады": { corrected: "Мен ертең ауылға барамын.", reason: "«Мен» — бірінші жақ жекеше. Сондықтан «барады» орнына «барамын» қолданылады.", practice: "Сен ертең ауылға ..." },
    "мен бүгін хат жазды": { corrected: "Мен бүгін хат жаздым.", reason: "«Мен» — бірінші жақ жекеше. Өткен шақтағы «жазды» тұлғасына -м жіктік жалғауы жалғанады.", practice: "Мен бүгін кітап оқы..." },
    "мен кеше мектепке барамын": { corrected: "Мен кеше мектепке бардым.", reason: "Бұл аяқталған әрекет туралы жеке сөйлемде «кеше» өткен уақытты білдіреді. Сондықтан «бардым» қолданылады.", practice: "Мен кеше кітап оқимын. Осы сөйлемді түзет." },
  };
  // Require an entire known sentence, optionally followed by a correction request.
  const sentence = normalized.replace(/\s+(?:сөйлемді|сөйлемін|дұрыс нұсқасын|түзет|дұрыс па|қатесін).*$/u, "").trim();
  const correction = corrections[sentence];
  if (correction) return `Дұрыс нұсқа: «${correction.corrected}»\n\n${correction.reason}\n\nЖаттығу: ${correction.practice}`;
  return findKazakhExample(message)?.answer ?? null;
}

export async function preferTrustedAnswer(trusted: string | null, generate: () => Promise<string>) {
  return trusted ?? await generate();
}
