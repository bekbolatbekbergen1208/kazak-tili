import { skills } from "./types";
// Re-enable here when listening audio is ready; stored results keep their schema.
export const listeningEnabled = false;
export const activeSkills = skills.filter(s => listeningEnabled || s !== "listening");
export const objectiveSkills = activeSkills.filter(s => s !== "writing" && s !== "speaking");
