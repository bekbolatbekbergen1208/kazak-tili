import { skills } from "./types";
// Recorded audio is ready. Historical attempts retain their original skill rotation.
export const listeningEnabled = true;
export const activeSkills = skills.filter(s => listeningEnabled || s !== "listening");
export const objectiveSkills = activeSkills.filter(s => s !== "writing" && s !== "speaking");
