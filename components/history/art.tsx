import type { HistoryObject } from "@/lib/history/types";

/** Small, original vector learning models; not scans of museum objects. */
export function HistoryArt({
  kind,
  className = "",
}: {
  kind: HistoryObject["kind"];
  className?: string;
}) {
  return (
    <svg
      className={`hs-art ${className}`}
      viewBox="0 0 160 150"
      aria-hidden="true"
      fill="none"
    >
      <ellipse cx="80" cy="136" rx="62" ry="10" fill="#3c2860" opacity=".12" />
      {kind === "gate" || kind === "wall" ? (
        <g stroke="#744c56" strokeWidth="3" strokeLinejoin="round">
          <path
            fill="#ebad71"
            d="M20 130V45h16V29h16v16h16V29h24v16h16V29h16v16h16v85Z"
          />
          <path fill="#99638c" d="M57 130V88a23 23 0 0 1 46 0v42" />
          <path
            className="hs-gate"
            fill="#c17b5c"
            d="M57 130V88a23 23 0 0 1 23-23v65Z"
          />
          <path d="M25 66h25m60 0h25M24 94h22m67 0h22M80 29V8" />
          <path className="hs-flag" fill="#64d8d3" d="M80 8h35l-9 10 9 9H80" />
        </g>
      ) : kind === "dome" ? (
        <g stroke="#467e94" strokeWidth="3">
          <path fill="#bce8e0" d="M34 129V73h92v56Z" />
          <path
            fill="#56c5d4"
            d="M30 74C28 49 50 42 80 14c30 28 52 35 50 60Z"
          />
          <path d="M80 15V5M58 70c-6-21 6-35 22-56m22 56c6-21-6-35-22-56" />
          <path fill="#776198" d="M64 130V99a16 16 0 0 1 32 0v31" />
          <path d="M41 84h11m56 0h11" />
        </g>
      ) : kind === "pottery" || kind === "cauldron" ? (
        <g stroke="#865342" strokeWidth="3">
          <path
            fill={kind === "pottery" ? "#e8a569" : "#c59e67"}
            d={
              kind === "pottery"
                ? "M58 28h44v20c-1 20 32 34 28 58s-20 30-50 30-46-6-50-30 29-38 28-58Z"
                : "M27 65h106l-9 51c-3 15-85 15-88 0Z"
            }
          />
          <path d="M46 88q34 23 68 0M50 100q30 23 60 0M61 36h38" />
          <path d="M34 73C9 46 7 104 35 94m91-21c25-27 27 31-1 21" />
          <path fill="#776198" d="m74 96 6-8 6 8-6 8Z" />
        </g>
      ) : kind === "book" ? (
        <g stroke="#745b9a" strokeWidth="3">
          <path
            fill="#fff8df"
            d="M20 34q30-16 60 3 30-19 60-3v90q-30-16-60 3-30-19-60-3Z"
          />
          <path d="M80 37v90M32 52q18-9 36 0m-36 16q18-9 36 0m-36 16q18-9 36 0m24-32q18-9 36 0m-36 16q18-9 36 0m-36 16q18-9 36 0" />
          <path stroke="#e9a152" strokeWidth="8" d="M94 30v40l8-7 8 7V27" />
        </g>
      ) : kind === "market" ? (
        <g stroke="#965d65" strokeWidth="3">
          <path fill="#f8d8a7" d="M24 63h112v67H24Z" />
          <path fill="#b9e8e0" d="m15 64 19-34h92l19 34Z" />
          <path fill="#9a73cb" d="M50 30h20l-4 34H40Zm40 0h20l10 34H94Z" />
          <path d="M35 130V72m90 58V72M28 103h105" />
          <path fill="#efaf55" d="M43 102V83h25v19Zm40 0V88h27v14Z" />
        </g>
      ) : kind === "coin" ? (
        <g stroke="#ba7b33" strokeWidth="4">
          <circle cx="80" cy="77" r="50" fill="#ffd778" />
          <circle cx="80" cy="77" r="38" strokeDasharray="4 5" />
          <path
            d="m80 48 9 18 20 11-20 9-9 19-9-19-20-9 20-11Z"
            fill="#f8bd54"
          />
        </g>
      ) : (
        <g stroke="#687ca1" strokeWidth="3">
          <rect x="29" y="25" width="102" height="104" rx="9" fill="#bae8e3" />
          <path
            fill="#9276c5"
            d="m80 34 14 25 26 17-26 17-14 27-14-27-26-17 26-17Z"
          />
          <path fill="#f9ce84" d="m80 53 9 15 14 8-14 8-9 15-9-15-14-8 14-8Z" />
          <path d="M37 34h15m56 0h15M37 120h15m56 0h15" />
        </g>
      )}
    </svg>
  );
}

export function Atmosphere() {
  return (
    <div className="hs-atmosphere" aria-hidden="true">
      <span className="hs-sun" />
      <span className="hs-cloud">☁</span>
      <span className="hs-cloud hs-cloud-two">☁</span>
      <span className="hs-birds">⌁ ⌁</span>
      <span className="hs-caravan">🐪 · 🐪 · 🐪</span>
      <span className="hs-water" />
      <span className="hs-fire">♨</span>
    </div>
  );
}
