import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isCorpusAdmin } from "@/lib/literary/admin";
import { literaryDnaProfiles } from "@/lib/literary/dna";

const dimensionLabels: Record<string, string> = {
  lexicalRichness: "Сөздік байлық",
  dialogueNaturalness: "Табиғи диалог",
  descriptionDepth: "Сипаттау тереңдігі",
  emotionalNuance: "Эмоциялық реңк",
  sentenceComplexity: "Сөйлем күрделілігі",
  figurativeDensity: "Бейнелі тіл",
  culturalContext: "Мәдени контекст",
  narrativeDynamics: "Баяндау динамикасы",
};

export default async function LiteraryDnaAdminPage() {
  const {
    data: { user },
  } = await createClient(await cookies()).auth.getUser();

  if (!user || !isCorpusAdmin(user))
    return (
      <main className="page lit-page">
        <h1>Literary DNA</h1>
        <p>Бұл бөлім уәкілетті әкімшіге арналған.</p>
        <Link className="btn primary" href="/login">
          Аккаунтқа кіру
        </Link>
      </main>
    );

  const admin = createAdminClient();
  const stored = admin
    ? await admin
        .from("literary_dna_profiles")
        .select(
          "id,work_title,author,recommended_levels,dimensions,traits,learning_goals,status,approved_by,updated_at",
        )
        .order("work_title")
    : null;

  const rows =
    stored && !stored.error && stored.data?.length
      ? stored.data
      : literaryDnaProfiles.map((profile) => ({
          id: profile.id,
          work_title: profile.workTitle,
          author: profile.author,
          recommended_levels: profile.recommendedLevels,
          dimensions: profile.dimensions,
          traits: profile.traits,
          learning_goals: profile.learningGoals,
          status: "local-seed",
          approved_by: null,
          updated_at: null,
        }));

  return (
    <main className="page lit-page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Qazaq Literary Intelligence</p>
          <h1>Literary DNA</h1>
          <p>
            Бұл бет кітап мәтінін сақтамайды. Мұнда тек оқытуға арналған
            абстракт тілдік белгілер көрсетіледі.
          </p>
        </div>
        <Link className="btn secondary" href="/admin/kazakh-corpus">
          Қазақша корпус
        </Link>
      </div>

      {stored?.error ? (
        <div className="panel">
          <strong>Supabase migration 016 әлі қолданылмаған.</strong>
          <p>
            Қазір GitHub-тағы жергілікті Literary DNA seed көрсетіліп тұр.
          </p>
        </div>
      ) : null}

      <div className="cards-grid">
        {rows.map((profile) => {
          const dimensions = profile.dimensions as Record<string, number>;
          return (
            <article className="panel" key={profile.id}>
              <p className="eyebrow">
                {profile.status === "approved"
                  ? "Мақұлданған профиль"
                  : "Жергілікті seed"}
              </p>
              <h2>{profile.work_title}</h2>
              <p>{profile.author}</p>
              <p>
                Деңгейлер:{" "}
                {(profile.recommended_levels as string[]).join(", ")}
              </p>

              <div>
                {Object.entries(dimensions).map(([key, value]) => (
                  <p key={key}>
                    <strong>{dimensionLabels[key] ?? key}:</strong>{" "}
                    {Math.round(Number(value) * 100)}%
                  </p>
                ))}
              </div>

              <h3>Traits</h3>
              <p>{(profile.traits as string[]).join(" · ")}</p>

              <h3>Оқу мақсаты</h3>
              <ul>
                {(profile.learning_goals as string[]).map((goal) => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </main>
  );
}
