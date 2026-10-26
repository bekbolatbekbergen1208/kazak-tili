import { notFound } from "next/navigation";
import { songLesson } from "@/lib/songs/content";
import { SongSession } from "@/components/songs/session";
import { RealSongSession } from "@/components/songs/real-song";
import { realSong } from "@/lib/songs/real-songs";
import "@/components/songs/songs.css";
export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const real = realSong(lessonId);
  if (real) return <RealSongSession key={real.id} song={real} />;
  const lesson = songLesson(lessonId);
  if (!lesson) notFound();
  return <SongSession key={lesson.id} lesson={lesson} />;
}
