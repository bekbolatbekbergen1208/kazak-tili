import LessonPlayer from "@/components/learning/lesson-player";
export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonPlayer key={lessonId} lessonId={lessonId} />;
}
