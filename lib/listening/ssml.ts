import { voices, type ListeningLesson } from "./content";
const escapeXml = (text: string) => text.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
export function listeningSsml(lesson: ListeningLesson) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="kk-KZ">${lesson.turns.map(turn => `<voice name="${voices[turn.voice].azure}"><prosody rate="-10%">${escapeXml(turn.text)}</prosody><break time="600ms"/></voice>`).join("")}</speak>`;
}
