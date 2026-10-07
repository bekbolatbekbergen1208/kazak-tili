import { validateContent } from "../lib/learning/editorial/validate";
const out = validateContent();
console.log(JSON.stringify(out, null, 2));
if (out.errors.length) process.exitCode = 1;
