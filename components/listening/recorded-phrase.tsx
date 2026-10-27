"use client";
import { useEffect, useRef, useState } from "react";
import { phraseAudio } from "@/lib/listening/phrases";
export function RecordedPhrase({ text, onHeard }: { text: string; onHeard?: (ready: boolean) => void }) {
  const asset = phraseAudio(text);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { const audio = audioRef.current; return () => { audio?.pause(); }; }, [text]);
  const [error, setError] = useState(false);
  return <div className="listeningPlayer" style={{ flexWrap: "wrap" }}>
    <div><b>Қазақша AI аудио{asset ? ` · ${asset.voice}` : ""}</b><span>Соңына дейін тыңдап, жауап бер.</span></div>
    {asset ? <audio ref={audioRef} controls preload="none" style={{ maxWidth: "100%" }} src={asset.url} aria-label="Тапсырма аудиосы" onEnded={() => { setError(false); onHeard?.(true); }} onError={() => { setError(true); onHeard?.(false); }} /> : <p role="status">Бұл тапсырманың аудиосы әлі дайын емес.</p>}
    {error && <p role="alert">Аудио ашылмады. Бетті жаңартып, қайта тыңда.</p>}
  </div>;
}
