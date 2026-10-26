import { notFound } from "next/navigation";
import { songLesson } from "@/lib/songs/content";
import { SongModes, type SongMode } from "@/components/songs/modes";
import { RealSongSession } from "@/components/songs/real-song";
import { realSong } from "@/lib/songs/real-songs";
import "@/components/songs/songs.css";
export default async function Page({
  params,
}: {
  params: Promise<{ lessonId: string; mode: string }>;
}) {
  const p = await params;
  const real = realSong(p.lessonId);
  if (real) {
    if (!["find", "karaoke"].includes(p.mode)) notFound();
    return <RealSongSession key={`${real.id}-${p.mode}`} song={real} mode={p.mode} />;
  }
  const lesson = songLesson(p.lessonId);
  if (!lesson || !["find", "karaoke", "speak"].includes(p.mode)) notFound();
  return (
    <SongModes
      key={`${lesson.id}-${p.mode}`}
      lesson={lesson}
      mode={p.mode as SongMode}
    />
  );
}
