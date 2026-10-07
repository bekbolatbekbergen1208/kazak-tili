import type { SongLesson } from "./types";
export const speechTokens = (text: string) =>
  text
    .normalize("NFKC")
    .toLocaleLowerCase("kk-KZ")
    .match(/[\p{L}\p{N}]+/gu) ?? [];
export function syncedLine(lesson: SongLesson, time: number) {
  return lesson.lyrics.findIndex(
    (l) =>
      l.start !== undefined &&
      Number.isFinite(l.start) &&
      Number.isFinite(l.end) &&
      l.end !== undefined &&
      time >= l.start &&
      time < l.end,
  );
}
export function validTimings(lesson: SongLesson) {
  return (
    !!lesson.audio?.src &&
    !!lesson.audio.license &&
    lesson.mediaStatus === "ready" &&
    lesson.lyrics.every(
      (l, i) =>
        l.start !== undefined &&
        Number.isFinite(l.start) &&
        Number.isFinite(l.end) &&
        l.end !== undefined &&
        l.start >= 0 &&
        l.end > l.start &&
        (i === 0 || l.start >= lesson.lyrics[i - 1].end!),
    )
  );
}
export function validWordTimings(
  line: SongLesson["lyrics"][number] | undefined,
) {
  if (!line) return false;
  return (
    !!line.words?.length &&
    line.start !== undefined &&
    line.end !== undefined &&
    line.words.every(
      (w, i) =>
        Number.isFinite(w.start) &&
        Number.isFinite(w.end) &&
        w.start >= line.start! &&
        w.end > w.start &&
        w.end <= line.end! &&
        (i === 0 || w.start >= line.words![i - 1].end),
    )
  );
}
export function compareSpeech(
  expected: string,
  recognized: string,
  confidence?: number,
) {
  const a = speechTokens(expected),
    b = speechTokens(recognized);
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  const words: {
    expected?: string;
    recognized?: string;
    status: "matched" | "different" | "missing" | "extra";
  }[] = [];
  let i = a.length,
    j = b.length;
  while (i || j) {
    if (
      i &&
      j &&
      dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
    ) {
      words.unshift({
        expected: a[i - 1],
        recognized: b[j - 1],
        status: a[i - 1] === b[j - 1] ? "matched" : "different",
      });
      i--;
      j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) {
      words.unshift({ expected: a[--i], status: "missing" });
    } else {
      words.unshift({ recognized: b[--j], status: "extra" });
    }
  }
  const matched = words.filter((w) => w.status === "matched").length;
  return {
    words,
    uncertain:
      !b.length ||
      (confidence !== undefined && confidence < 0.65) ||
      matched / Math.max(a.length, b.length, 1) < 0.35,
    confidenceKnown: confidence !== undefined,
  };
}
