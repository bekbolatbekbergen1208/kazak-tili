import type { CSSProperties } from "react";
const drawings: Record<string, React.ReactNode> = {
  cat: (
    <>
      <ellipse cx="48" cy="66" rx="25" ry="16" fill="#d4ba8c" />
      <path d="M57 37 56 16 72 25 88 15 87 41" fill="#d4ba8c" />
      <ellipse cx="73" cy="40" rx="20" ry="17" fill="#e0c99c" />
      <circle cx="65" cy="36" r="3" fill="#49584a" />
      <circle cx="80" cy="36" r="3" fill="#49584a" />
      <path d="m69 45 7 0-3 4Z" fill="#907b65" />
      <path
        d="M26 69Q5 73 10 47"
        fill="none"
        stroke="#c4a777"
        strokeWidth="9"
      />
    </>
  ),
  mountain: (
    <>
      <path d="M5 77 32 24 49 51 66 14 96 77Z" fill="#af9479" />
      <path d="m32 24-9 18 9-4 7 8 5-4Zm34-10-12 27 13-7 9 9Z" fill="#fff5dc" />
      <path d="m66 14 8 63h22Z" fill="#8b7568" />
    </>
  ),
  wave: (
    <>
      <path d="M8 37Q23 18 38 37T68 37T98 37V79H8Z" fill="#63c8d8" />
      <path
        d="M8 51q15-16 30 0t30 0t30 0M8 68q15-16 30 0t30 0t30 0"
        fill="none"
        stroke="#d7f7f9"
        strokeWidth="5"
      />
    </>
  ),
  tree: (
    <>
      <path d="M48 45h9v42h-9Z" fill="#987154" />
      <path d="M50 9 26 43h11L18 67h66L66 43h11Z" fill="#65a27d" />
      <path d="m50 9 4 58h30L66 43h11Z" fill="#448773" />
    </>
  ),
  grass: (
    <>
      <path d="M12 83Q25 34 47 67 54 18 63 64 84 29 91 83" fill="#91b776" />
      <path
        d="m40 84-9-26m29 26 3-42m11 42 6-20"
        stroke="#54856b"
        strokeWidth="3"
      />
    </>
  ),
  wheat: (
    <>
      <path d="M50 86V19" stroke="#99804b" strokeWidth="4" />
      {[25, 40, 55, 70].map((y) => (
        <g key={y}>
          <ellipse
            cx="40"
            cy={y}
            rx="7"
            ry="13"
            transform={`rotate(-38 40 ${y})`}
            fill="#eac268"
          />
          <ellipse
            cx="60"
            cy={y}
            rx="7"
            ry="13"
            transform={`rotate(38 60 ${y})`}
            fill="#d9ad4f"
          />
        </g>
      ))}
    </>
  ),
  ship: (
    <>
      <path d="m6 61 88-5-18 26H27Z" fill="#426e81" />
      <path d="M36 32h32v26H36Z" fill="#f7f0da" />
      <path d="M45 20h9v12h-9Z" fill="#e9b96c" />
      <path
        d="M20 87q20-10 40 0t30 0"
        fill="none"
        stroke="#73cad9"
        strokeWidth="4"
      />
    </>
  ),
  seal: (
    <>
      <ellipse cx="48" cy="66" rx="35" ry="17" fill="#98b6bd" />
      <circle cx="74" cy="46" r="20" fill="#b4cdd0" />
      <circle cx="80" cy="42" r="3" fill="#26474e" />
      <ellipse cx="89" cy="51" rx="4" ry="3" fill="#26474e" />
      <path d="m25 68-18-11 3 17m45-5-12 14 20-3" fill="#7197a2" />
    </>
  ),
  bird: (
    <>
      <path
        d="M47 59Q16 19 6 50 30 42 48 67 69 37 94 48 78 18 47 59Z"
        fill="#f5ebdd"
        stroke="#527784"
        strokeWidth="2"
      />
      <path d="m47 61 10 8-15 5" fill="#e6b662" />
    </>
  ),
  deer: (
    <>
      <ellipse cx="47" cy="55" rx="25" ry="15" fill="#ccad80" />
      <path
        d="m65 52 10-29 9 6-6 31M30 65l-3 20m30-21 5 21"
        fill="none"
        stroke="#af8c65"
        strokeWidth="7"
      />
      <path d="m77 29-5-17m9 17 7-16" stroke="#715a49" strokeWidth="3" />
      <circle cx="80" cy="34" r="2" />
    </>
  ),
  camel: (
    <>
      <path
        d="M14 62q3-33 20-14 14-32 26-1l13-3 5-26 12 2-3 43Z"
        fill="#d6af73"
      />
      <path d="M23 62v23m34-23v23m26-23v23" stroke="#b58d57" strokeWidth="6" />
      <circle cx="84" cy="25" r="2" />
    </>
  ),
  monument: (
    <>
      <path d="M16 47h70v40H16Z" fill="#dec39c" />
      <path d="M30 47Q28 22 50 13 73 22 71 47" fill="#5fa9ad" />
      <path d="M42 87V66q9-17 18 0v21" fill="#987a60" />
      <path d="M20 53h61" stroke="#a27c57" strokeWidth="3" />
    </>
  ),
  city: (
    <>
      <path d="M10 87V42h22V23h24v30h31v34" fill="#719daa" />
      <path
        d="M17 49h7m-7 12h7m15-29h9m-9 12h9m-9 12h9m17 8h13m-13 11h13"
        stroke="#ffe2a4"
        strokeWidth="5"
      />
    </>
  ),
  book: (
    <>
      <path
        d="M10 24q22-8 40 6 20-14 41-6v55q-23-7-41 5-18-12-40-5Z"
        fill="#f9e7bf"
        stroke="#729b8c"
        strokeWidth="4"
      />
      <path
        d="M50 30v51M19 39l22 4m-22 9 22 4m-22 9 22 4m17-25 24-6m-24 18 24-6"
        stroke="#b9a37e"
        strokeWidth="3"
      />
    </>
  ),
  apple: (
    <>
      <path
        d="M50 33C11 13 9 64 29 81q13 10 23 1 20 11 33-16 16-46-35-33"
        fill="#dc8974"
      />
      <path d="M51 32q-2-19 9-22" stroke="#846b4f" strokeWidth="5" />
      <ellipse cx="68" cy="19" rx="14" ry="7" fill="#79a780" />
    </>
  ),
  flower: (
    <>
      <path
        d="M50 85V44m0 25Q21 43 25 68l25 10"
        fill="#7eac79"
        stroke="#7eac79"
        strokeWidth="5"
      />
      <path
        d="M30 20 43 29 51 14 59 29 73 20q5 41-22 35Q25 58 30 20"
        fill="#e49f99"
      />
    </>
  ),
  train: (
    <>
      <rect x="9" y="33" width="76" height="41" rx="8" fill="#68a6ac" />
      <path d="M21 44h15v13H21m24-13h15v13H45m23-13h11v13H68" fill="#d4edf0" />
      <circle cx="26" cy="77" r="7" fill="#41666e" />
      <circle cx="69" cy="77" r="7" fill="#41666e" />
      <path d="M3 88h93" stroke="#a08b70" strokeWidth="3" />
    </>
  ),
  crane: (
    <>
      <path d="M48 86V15h6v71M15 23h72v7H15" fill="#d7ac64" />
      <path
        d="M23 23 50 10l32 13M77 29v27l-7 5"
        fill="none"
        stroke="#9c8153"
        strokeWidth="3"
      />
      <path d="M60 62h27v19H60Z" fill="#88a69d" />
    </>
  ),
  pump: (
    <>
      <path
        d="M37 84 51 38 66 84M20 84h62"
        fill="none"
        stroke="#758e8a"
        strokeWidth="6"
      />
      <path d="m19 30 57-10 9 12-63 10Z" fill="#b69970" />
      <path d="M23 40v38m47-44v25" stroke="#758e8a" strokeWidth="3" />
    </>
  ),
};
export function TravelIcon({
  kind,
  className = "",
  label,
  style,
}: {
  kind: string;
  className?: string;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={typeof style?.width === "number" ? style.width : 100}
      height={typeof style?.height === "number" ? style.height : 100}
      viewBox="0 0 100 100"
      className={`travel-icon ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label}
      style={style}
    >
      {drawings[kind] ?? drawings.mountain}
    </svg>
  );
}
export function RegionStamp({
  name,
  icon,
  index,
  unlocked,
}: {
  name: string;
  icon: string;
  index: number;
  unlocked: boolean;
}) {
  return (
    <div className={`travel-stamp ${unlocked ? "is-stamped" : "is-empty"}`}>
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-label={`${name}: ${unlocked ? "Мөр алынды" : "Мөр ашылмаған"}`}
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="3 3"
        />
        <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" />
        <text
          x="60"
          y="24"
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
        >
          QAZAQDOS · {String(index + 1).padStart(2, "0")}
        </text>
        <svg x="28" y="27" width="64" height="64">
          <TravelIcon kind={icon} style={{ width: 64, height: 64 }} />
        </svg>
        <text
          x="60"
          y="103"
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
        >
          {unlocked ? "ЗЕРТТЕЛДІ" : "САЯХАТ АЛДА"}
        </text>
      </svg>
      <span>{name}</span>
    </div>
  );
}
