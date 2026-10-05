import { dosshaInstructions } from "../lib/dosha/prompt";
import { literaryDnaProfiles } from "../lib/literary/dna";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LiteraryDnaTrainingRow = {
  id: string;
  group: string;
  source: "literary-dna";
  messages: Message[];
};

const guard =
  "Төмендегі Literary DNA — кітап мәтіні емес, тек тілдік принциптердің қысқаша талдауы. Авторға еліктеме, дәйексөз ойлап таппа, дайын сөйлемді көшірме. Тек сол принциптерге сүйеніп жаңа қазақша мысал жаса.";

const examples = [
  {
    profile: "abai-zholy-analysis",
    id: "nature-b1",
    prompt:
      "B1 деңгейінде кешкі даланы 2 сөйлеммен табиғи әрі бейнелі сипатта. Артық поэтикалық сөз қоспа.",
    answer:
      "Күн еңкейген сайын далаға жұмсақ көлеңке түсті. Алыстан ауылдың үні естіліп, кешкі тыныштық біртіндеп қоюлана бастады.",
  },
  {
    profile: "abai-zholy-analysis",
    id: "character-b2",
    prompt:
      "B2 деңгейінде адамның сабырлы мінезін сыртқы әрекеті арқылы көрсететін 2 сөйлем жаз.",
    answer:
      "Ол дауысты көтермей, әркімнің сөзін соңына дейін тыңдады. Жауап берер алдында аз ғана кідіріп, ойын анық жеткізді.",
  },
  {
    profile: "ulpan-analysis",
    id: "dialogue-b1",
    prompt:
      "B1 деңгейінде қысқа, нық және табиғи қазақша диалог құрастыр. Тақырып: ортақ істі ұйымдастыру.",
    answer:
      "— Істі ертеңге қалдырмайық, — деді Айсұлу. — Алдымен кімге не керек екенін анықтайық.\n— Жақсы, мен тізімді дайындаймын.",
  },
  {
    profile: "ulpan-analysis",
    id: "leadership-b2",
    prompt:
      "B2 деңгейінде жауапкершілігі бар кейіпкерді 2 сөйлеммен сипатта. Тікелей «көшбасшы» деп атама.",
    answer:
      "Ол шешім қабылдамас бұрын жұрттың пікірін тыңдап шықты. Кейін жұмысты бөліп, ең қиын міндетті өз мойнына алды.",
  },
  {
    profile: "mahabbat-kyzyk-analysis",
    id: "youth-dialogue-a2",
    prompt:
      "A2 деңгейінде екі жастың жылы, табиғи диалогын жаз. Тақырып: бірге кітапханаға бару.",
    answer:
      "— Бүгін кітапханаға барасың ба?\n— Иә, барамын. Қаласаң, бірге барайық.\n— Жақсы, сабақтан кейін кездесеміз.",
  },
  {
    profile: "mahabbat-kyzyk-analysis",
    id: "emotion-b1",
    prompt:
      "B1 деңгейінде қуанышты сезімді асыра сілтемей 2 сөйлеммен жеткіз.",
    answer:
      "Күткен хабарын естігенде оның жүзі бірден жадырап кетті. Ол қуанышын жасырмай, достарына жақсы жаңалықты бөлісті.",
  },
  {
    profile: "shakan-sheri-analysis",
    id: "tension-b1",
    prompt:
      "B1 деңгейінде қысқа шиеленісті көрініс жаз. Қорқынышты шамадан тыс күшейтпе.",
    answer:
      "Жел күшейгенде сүрлеу бір сәтке көмескіленіп кетті. Ол қадамын баяулатып, айналадағы әр дыбысқа құлақ түрді.",
  },
  {
    profile: "shakan-sheri-analysis",
    id: "action-b2",
    prompt:
      "B2 деңгейінде қозғалысты динамикалық етістіктермен 2 сөйлемде сипатта.",
    answer:
      "Ат алға ұмтылып, тар соқпақпен төмен қарай жылдам түсті. Шабандоз тізгінді тартып, бұрылыста екпінін бірден бәсеңдетті.",
  },
  {
    profile: "abai-zholy-analysis",
    id: "rewrite-natural",
    prompt:
      "«Ауа райы жақсы болды» сөйлемін B1 деңгейінде табиғи әрі сәл көркем етіп қайта жаз.",
    answer:
      "Күн ашық болып, ауа райы ерекше жайлы еді.",
  },
  {
    profile: "mahabbat-kyzyk-analysis",
    id: "rewrite-emotion",
    prompt:
      "«Мен досымды көріп қуандым» сөйлемін B1 деңгейінде табиғи етіп байыт.",
    answer:
      "Досымды көргенде көңілім көтеріліп, онымен бірден әңгімелесе кеттім.",
  },
  {
    profile: "ulpan-analysis",
    id: "respectful-disagreement",
    prompt:
      "B2 деңгейінде келіспеушілікті құрметпен жеткізетін 2 сөйлем жаз.",
    answer:
      "Сенің ойыңды түсіндім, бірақ бұл мәселенің басқа қыры да бар деп ойлаймын. Алдымен екі ұсыныстың салдарын салыстырып көрейік.",
  },
  {
    profile: "shakan-sheri-analysis",
    id: "atmosphere-c1",
    prompt:
      "C1 деңгейінде табиғат пен кейіпкердің ішкі күйін байланыстыратын 2 сөйлем жаз. Артық метафора қолданба.",
    answer:
      "Аспанды қалың бұлт басқан сайын айналадағы үн де бәсеңдегендей болды. Ол үнсіз жүріп, алда қабылдайтын шешімін қайта таразылады.",
  },
] as const;

export function literaryDnaTrainingRows(): LiteraryDnaTrainingRow[] {
  return examples.map((example) => {
    const profile = literaryDnaProfiles.find(
      (item) => item.id === example.profile,
    );
    if (!profile) throw new Error(`Unknown Literary DNA profile: ${example.profile}`);
    return {
      id: `literary-dna-${example.profile}-${example.id}`,
      group: `literary-dna-${example.profile}`,
      source: "literary-dna" as const,
      messages: [
        {
          role: "system" as const,
          content:
            dosshaInstructions +
            "\n" +
            guard +
            `\nАбстракт белгілер: ${profile.traits.join(", ")}.\nОқу мақсаты: ${profile.learningGoals.join("; ")}.`,
        },
        { role: "user" as const, content: example.prompt },
        { role: "assistant" as const, content: example.answer },
      ],
    };
  });
}
