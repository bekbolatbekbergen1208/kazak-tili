import { notFound } from "next/navigation";
import { songLesson } from "@/lib/songs/content";
import { SongSession } from "@/components/songs/session";
import "@/components/songs/songs.css";
export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = songLesson(lessonId);
  if (!lesson) notFound();
  return <SongSession key={lesson.id} lesson={lesson} />;
}
