import { notFound } from "next/navigation";
import { songLesson } from "@/lib/songs/content";
import { SongModes, type SongMode } from "@/components/songs/modes";
import "@/components/songs/songs.css";
export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string; mode: string }>;
}) {
  const p = await params,
    lesson = songLesson(p.lessonId);
  if (!lesson || !["find", "karaoke", "speak"].includes(p.mode)) notFound();
  return (
    <SongModes
      key={`${lesson.id}-${p.mode}`}
      lesson={lesson}
      mode={p.mode as SongMode}
    />
  );
}
