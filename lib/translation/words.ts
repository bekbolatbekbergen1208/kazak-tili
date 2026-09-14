export function wordAt(text: string, offset: number) {
  const segments = new Intl.Segmenter(undefined, { granularity: "word" });
  for (const part of segments.segment(text)) {
    if (part.isWordLike && offset >= part.index && offset < part.index + part.segment.length)
      return { word: part.segment, start: part.index, end: part.index + part.segment.length };
  }
  return null;
}
