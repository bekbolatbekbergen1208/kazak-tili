import { courseLessons, type CourseLesson } from "../curriculum";

export type Task = {
  kind: "choice" | "listening" | "typing";
  title: string;
  answer: string;
  hint: string;
  prompt?: string;
  options?: string[];
};

const topicLessons = courseLessons.slice(0, 20);

function otherTopics(lesson: CourseLesson) {
  const candidates = topicLessons.filter((item) => item.theme !== lesson.theme);
  const rotation = Math.floor((lesson.id - 1) / 20) % candidates.length;
  return [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
}

function placeAnswer(answer: string, wrongAnswers: string[], seed: number) {
  const options = wrongAnswers
    .filter(
      (item, index, list) => item !== answer && list.indexOf(item) === index,
    )
    .slice(0, 3);
  options.splice(seed % (options.length + 1), 0, answer);
  return options;
}

export function courseTasks(lesson: CourseLesson): Task[] {
  const alternatives = otherTopics(lesson);
  const block = Math.floor((lesson.id - 1) / 20);
  const wrongWords = alternatives.map(
    (item, index) => item.words[(block + index) % item.words.length],
  );
  const wrongTranslations = alternatives.map((item) => item.translation);
  return [
    {
      kind: "choice",
      title: `«${lesson.theme}» тақырыбына қатысты сөзді таңда`,
      options: placeAnswer(lesson.words[0], wrongWords, lesson.id),
      answer: lesson.words[0],
      hint: `Көрініске қара. Дұрыс сөз «${lesson.words[0]}».`,
    },
    {
      kind: "listening",
      title: "Сөйлемді тыңдап, дұрыс аудармасын таңда",
      options: placeAnswer(
        lesson.translation,
        wrongTranslations,
        lesson.id + 1,
      ),
      answer: lesson.translation,
      hint: "Сөйлемді тағы бір рет тыңдап, негізгі сөздерге назар аудар.",
    },
    {
      kind: "typing",
      title: "Сөйлемді қазақша пернетақтамен жаз",
      prompt: lesson.translation,
      answer: lesson.sentence,
      hint: `Бірінші сөз: «${lesson.sentence.split(" ")[0]}»`,
    },
    {
      kind: "typing",
      title: `«${lesson.words[1]}» сөзін қолданып үлгі сөйлемді көшіріп жаз`,
      prompt: lesson.sentence,
      answer: lesson.sentence,
      hint: "Қазақ әріптеріне назар аудар: ә, ғ, қ, ң, ө, ұ, ү, һ, і.",
    },
  ];
}
