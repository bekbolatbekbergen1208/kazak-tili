import assets from "./phrase-assets.json";
export function phraseAudio(text: string) {
  return (assets as Record<string, { url: string; voice: string }>)[text];
}
