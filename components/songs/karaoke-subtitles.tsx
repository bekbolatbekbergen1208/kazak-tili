"use client";

import { useState } from "react";

type CaptionLine = {
  text: string;
  start?: number;
  end?: number;
};

export function KaraokeSubtitles({
  lines,
  time,
  playing,
}: {
  lines: readonly CaptionLine[];
  time: number;
  playing: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const timed =
    lines.length > 0 &&
    lines.every(
      (line) =>
        Number.isFinite(line.start) &&
        Number.isFinite(line.end) &&
        line.end! > line.start!,
    );
  const syncedIndex = timed
    ? lines.findIndex((line) => time >= line.start! && time < line.end!)
    : -1;
  const index = timed ? syncedIndex : Math.min(selected, lines.length - 1);
  const line = lines[index];
  const progress =
    timed && line
      ? Math.max(
          0,
          Math.min(
            100,
            ((time - line.start!) / (line.end! - line.start!)) * 100,
          ),
        )
      : 0;

  return (
    <div
      className="song-karaoke-captions"
      aria-label="Әннің субтитрлері"
      data-playing={playing || undefined}
      data-synced={timed || undefined}
    >
      <div className="song-karaoke-captions-label">
        <span className="song-karaoke-live-dot" aria-hidden="true" />
        Әннің субтитрлері
      </div>
      <div className="song-karaoke-caption-line" aria-live="polite">
        {line ? (
          <div className="song-karaoke-caption-track">
            <span
              className="song-karaoke-ball"
              style={{ left: timed ? `${progress}%` : undefined }}
              aria-hidden="true"
            />
            <span className="song-karaoke-caption-base">{line.text}</span>
            {timed && (
              <span
                className="song-karaoke-caption-fill"
                style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
                aria-hidden="true"
              >
                {line.text}
              </span>
            )}
          </div>
        ) : (
          <span className="song-karaoke-wait">Ән жолын күтіп тұрмыз…</span>
        )}
      </div>
      {!timed && lines.length > 1 && (
        <div
          className="song-karaoke-caption-choices"
          aria-label="Үзінді жолын таңдау"
        >
          {lines.map((item, itemIndex) => (
            <button
              type="button"
              key={`${itemIndex}-${item.text}`}
              className={itemIndex === index ? "active" : ""}
              aria-pressed={itemIndex === index}
              aria-label={`${itemIndex + 1}-жол: ${item.text}`}
              title={item.text}
              onClick={() => setSelected(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          ))}
        </div>
      )}
      {!timed && (
        <small>Бұл жазбада уақыт белгісі жоқ. Естіген жолыңды таңда.</small>
      )}
    </div>
  );
}
