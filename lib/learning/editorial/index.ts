import { buildBatch } from "./model";
import { dailyBatch } from "./daily";
import { tourismBatch } from "./tourism";
import { technologyBatch } from "./technology";
import { regionBatches } from "./regions";
import { readingBatch } from "./reading";
import { regions } from "../../travel/catalog";
export const editorialBatches = [
  dailyBatch,
  tourismBatch,
  technologyBatch,
  ...regionBatches,
  readingBatch,
];
export const editorialLessons = editorialBatches
  .flatMap(buildBatch)
  .map((l) => ({
    ...l,
    sources: l.regionId
      ? regions.find((r) => r.id === l.regionId)?.sources.map((s) => s.url)
      : l.sources,
  }));
const serialized = JSON.stringify(editorialLessons);
let fingerprint = 2166136261;
for (let i = 0; i < serialized.length; i++)
  fingerprint = Math.imul(fingerprint ^ serialized.charCodeAt(i), 16777619);
export const editorialRevision = `content-${(fingerprint >>> 0).toString(16)}`;
