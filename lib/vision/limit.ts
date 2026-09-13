// Per-process budget. A multi-instance deployment requires a shared limiter.
export function createVisionLimiter() {
  const entries = new Map<string, { times: number[]; busy: boolean }>();
  return (id: string, now = Date.now()): (() => void) | null => {
    for (const [key, entry] of entries)
      if (!entry.busy && entry.times.every((t) => t <= now - 3600000))
        entries.delete(key);
    const entry = entries.get(id) ?? { times: [], busy: false };
    entry.times = entry.times.filter((t) => t > now - 3600000);
    if (
      entry.busy ||
      entry.times.length >= 40 ||
      entry.times.filter((t) => t > now - 60000).length >= 6 ||
      (!entries.has(id) && entries.size >= 5000)
    )
      return null;
    entry.times.push(now);
    entry.busy = true;
    entries.set(id, entry);
    return () => {
      entry.busy = false;
    };
  };
}
