import type { SongLesson } from "./types";
// Text preparation only. No synthetic timing or pretend audio is introduced.
const targets: Record<string, number[]> = {
  salem: [0, 1, 1, 1, 1, 1],
  otbasy: [1, 1, 0, 0, 0, 0],
  kun: [0, 2, 0, 3, 2, 0],
  aktau: [0, 0, 0, 0, 0, 1],
  arman: [1, 1, 1, 3, 1, 1],
};
const distractors: Record<string, string[]> = {
  salem: ["теңіз", "мектеп", "кешке"],
  otbasy: ["теңізге", "әуежай", "жетіде"],
  kun: ["қонақүй", "досым", "оңға"],
  aktau: ["отбасым", "кітап", "жетіде"],
  arman: ["аялдама", "сегізде", "қонақүйге"],
};
export function prepareSongModes(lesson: SongLesson) {
  const forms: Record<string, string[]> = {
    "song:aga": ["ағаммен"],
    "song:apa": ["әпкеммен"],
    "song:teniz": ["теңізді"],
    "song:maqsat": ["мақсатымызға"],
  };
  for (const word of lesson.words)
    word.forms = [...new Set([...word.forms, ...(forms[word.id] ?? [])])];
  lesson.mediaStatus ??= lesson.audio ? "ready" : "draft";
  lesson.rights ??= {
    text: "QazaqDos үшін жазылған түпнұсқа оқу мәтіні. Танымал әннен көшірілмеген.",
  };
  lesson.wordFind = lesson.lyrics.map((line, i) => {
    const tokens = line.text.split(/\s+/),
      token = targets[lesson.id][i];
    const answer = tokens[token].replace(/[^\p{L}\p{N}]/gu, "");
    const word = lesson.words.find((w) =>
      w.forms.some(
        (f) =>
          f.toLocaleLowerCase("kk-KZ") === answer.toLocaleLowerCase("kk-KZ"),
      ),
    );
    const wrong = distractors[lesson.id].filter(
      (w) => w.toLocaleLowerCase("kk-KZ") !== answer.toLocaleLowerCase("kk-KZ"),
    );
    return {
      id: `${lesson.id}-find-${i + 1}`,
      line: i,
      token,
      answer,
      options: [answer, ...wrong].slice(0, 4),
      wordId: word?.id,
      explanation: word
        ? `«${answer}»: ${word.meaning} Мысал: ${word.example}`
        : `${({ қазақша: "Қазақша — қазақ тілінде. «Бірге қазақша сөйлесейік» — қазақ тілінде бірге сөйлеуге шақыру.", күлкі: "Күлкі — адамның күлуі. «Үйімізде күлкі бар» отбасының көңілді екенін білдіреді.", үйренемін: "Үйренемін — жаңа білім немесе дағды аламын. «Мектепте жаңа сөз үйренемін». Бастапқы тұлғасы — үйрену.", ақтауға: "Ақтауға — Ақтау қаласына. -ға жалғауы баратын бағытты көрсетеді.", көмектескім: "Көмектескім келеді — біреуге көмек беруді қалаймын. Бастапқы тұлғасы — көмектесу." } as Record<string, string>)[answer.toLocaleLowerCase("kk-KZ")] ?? lesson.grammar} Толық жол: «${line.text}».`,
    };
  });
  lesson.excerpts = [0, 1, 3, 5].map((line) => ({
    id: `${lesson.id}-say-${line + 1}`,
    line,
  }));
}
