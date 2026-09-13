import React, { useId, type CSSProperties } from "react";
import { characterById, shopItemById } from "@/lib/characters/config";
import type {
  CharacterId,
  CharacterMood,
  EquipmentSlot,
} from "@/lib/characters/types";
export type CharacterArtProps = {
  characterId: CharacterId;
  mood?: CharacterMood;
  equipped?: Partial<Record<EquipmentSlot, string>>;
  silhouette?: boolean;
  className?: string;
  label?: string;
  decorative?: boolean;
  lighting?: boolean;
};
/** Layered vector renderer. External image/animation adapters can replace it without changing learning state. */
export function CharacterArt({
  characterId,
  mood = "waiting",
  equipped = {},
  silhouette = false,
  className = "",
  label,
  decorative = false,
  lighting = false,
}: CharacterArtProps) {
  const c = characterById(characterId)!,
    uid = useId().replaceAll(":", ""),
    skin = shopItemById(equipped.skin ?? ""),
    primary = skin?.color ?? c.primaryColor,
    secondary = skin ? "#f3e6d4" : c.secondaryColor;
  const bird = characterId === "qyran" || characterId === "samuryq",
    owl = characterId === "danaqulaq",
    fox = characterId === "tilmash" || characterId === "balapan",
    bear = characterId === "qonyr",
    camel = characterId === "aqbota",
    leopard = characterId === "aibar";
  const happy = ["joy", "celebration", "victory"].includes(mood),
    soft = mood === "support" || mood === "sleep",
    hood = equipped.outfit === "shapan";
  return (
    <div
      className={`char-art char-${characterId} char-${mood} ${silhouette ? "char-silhouette" : ""} ${equipped.frame ? "with-frame" : ""} ${equipped.theme ? "with-theme" : ""} ${equipped.victory && ["joy", "victory", "celebration"].includes(mood) ? "with-stars" : ""} ${className}`}
      style={
        {
          "--char-primary": primary,
          "--char-secondary": secondary,
        } as CSSProperties
      }
      data-character={characterId}
      data-mood={mood}
    >
      <svg
        viewBox="0 0 320 330"
        role={decorative ? "presentation" : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : (label ?? c.name)}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-fur`} x1="0" y1="0" x2=".85" y2="1">
            <stop
              stopColor={
                lighting
                  ? `color-mix(in srgb, ${primary}, #fff4cc 30%)`
                  : primary
              }
            />
            {lighting && <stop offset=".45" stopColor={primary} />}
            <stop
              offset="1"
              stopColor={
                lighting
                  ? `color-mix(in srgb, ${primary}, #25443d 32%)`
                  : primary
              }
              stopOpacity={lighting ? 1 : 0.86}
            />
          </linearGradient>
          <linearGradient id={`${uid}-cream`} x2="0" y2="1">
            <stop stopColor="#fff9ee" />
            <stop offset="1" stopColor={secondary} />
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x2="1" y2="1">
            <stop stopColor="#fff0b3" />
            <stop offset="1" stopColor="#c58a3a" />
          </linearGradient>
        </defs>
        <ellipse
          className="char-shadow"
          cx="160"
          cy="305"
          rx="81"
          ry="13"
          fill="#283250"
          opacity=".12"
        />
        <g
          className="char-body"
          stroke="#373348"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {fox && (
            <g className="char-tail">
              <path
                d="M215 264C299 262 299 192 271 170C274 222 231 213 212 238Z"
                fill={`url(#${uid}-fur)`}
              />
              <path
                d="M264 204C273 194 273 182 271 170C294 190 292 214 285 227L264 222Z"
                fill={secondary}
                stroke="none"
              />
            </g>
          )}
          {leopard && (
            <g className="char-tail">
              <path
                d="M209 266C279 301 299 240 267 222"
                fill="none"
                stroke={primary}
                strokeWidth="27"
              />
              <path
                d="M264 264L273 276M279 243L288 244M257 271L259 282"
                stroke="#667a93"
                strokeWidth="5"
              />
            </g>
          )}
          {camel && (
            <g>
              <path
                d="M183 245Q195 191 215 202Q233 203 233 248Z"
                fill={primary}
              />
              <path
                d="M205 268C270 264 251 211 225 235"
                fill="none"
                stroke={primary}
                strokeWidth="11"
              />
            </g>
          )}
          {characterId === "samuryq" && (
            <g className="char-tail">
              <path
                d="M138 254Q96 299 91 311Q144 309 160 273Q169 310 212 314Q219 284 184 254"
                fill={primary}
              />
              <path
                d="M160 270V305M143 273L116 301M178 275L197 304"
                stroke="#e3bd65"
                strokeWidth="5"
              />
            </g>
          )}
          {equipped.back === "backpack" && (
            <g data-item="backpack">
              <rect
                x="197"
                y="202"
                width="48"
                height="73"
                rx="15"
                fill="#bd7951"
              />
              <path d="M207 225H238V258H207Z" fill="#dfab6d" />
              <path d="M212 203V194H229V203" fill="none" />
            </g>
          )}
          <ellipse
            cx="160"
            cy="238"
            rx={camel ? 48 : 58}
            ry="60"
            fill={hood ? "#315f83" : `url(#${uid}-fur)`}
          />
          <ellipse
            cx="160"
            cy="242"
            rx="34"
            ry="43"
            fill={hood ? "#487fa2" : `url(#${uid}-cream)`}
            stroke="none"
          />
          {hood && (
            <g data-item="shapan" stroke="#f0c56e" strokeWidth="3">
              <path
                d="M159 193V290M130 219L140 229L130 239L120 229ZM187 251L197 261L187 271L177 261Z"
                fill="none"
              />
              <path d="M110 260Q160 279 209 259" fill="none" />
            </g>
          )}
          <ellipse
            className="char-foot char-foot-left"
            cx="127"
            cy="292"
            rx="24"
            ry="13"
            fill={bird || owl ? "#e7b75d" : primary}
          />
          <ellipse
            className="char-foot char-foot-right"
            cx="193"
            cy="292"
            rx="24"
            ry="13"
            fill={bird || owl ? "#e7b75d" : primary}
          />
          {bird ? (
            <>
              <g className="char-wing char-wing-left">
                <path
                  d="M109 205C79 179 49 191 48 226L67 219L60 239L81 229L80 248Q111 242 120 220Z"
                  fill={primary}
                />
                <path
                  d="M63 216L93 205M75 231L105 215"
                  fill="none"
                  stroke={secondary}
                />
              </g>
              <g className="char-wing char-wing-right">
                <path
                  d="M211 205C241 179 271 191 272 226L253 219L260 239L239 229L240 248Q209 242 200 220Z"
                  fill={primary}
                />
                <path
                  d="M257 216L227 205M245 231L215 215"
                  fill="none"
                  stroke={secondary}
                />
              </g>
            </>
          ) : (
            <>
              <ellipse
                className="char-paw char-paw-left"
                cx="108"
                cy="238"
                rx="17"
                ry="32"
                fill={primary}
              />
              <ellipse
                className="char-paw char-paw-right"
                cx="212"
                cy="238"
                rx="17"
                ry="32"
                fill={primary}
              />
            </>
          )}
          <g className="char-head">
            {(fox || camel) && (
              <>
                <g className="char-ear char-ear-left">
                  <path
                    d={
                      camel
                        ? "M120 91Q61 60 68 101Q75 126 112 116Z"
                        : "M105 112Q69 48 87 35Q125 45 139 89Z"
                    }
                    fill={primary}
                  />
                  <path
                    d={
                      camel
                        ? "M106 100Q76 80 80 101L102 109Z"
                        : "M104 87L92 49Q115 57 126 83Z"
                    }
                    fill="#e9b1a0"
                    stroke="none"
                  />
                </g>
                <g className="char-ear char-ear-right">
                  <path
                    d={
                      camel
                        ? "M200 91Q259 60 252 101Q245 126 208 116Z"
                        : "M215 112Q251 48 233 35Q195 45 181 89Z"
                    }
                    fill={primary}
                  />
                  <path
                    d={
                      camel
                        ? "M214 100Q244 80 240 101L218 109Z"
                        : "M216 87L228 49Q205 57 194 83Z"
                    }
                    fill="#e9b1a0"
                    stroke="none"
                  />
                </g>
              </>
            )}
            {(bear || leopard) && (
              <>
                <g className="char-ear char-ear-left">
                  <circle cx="105" cy="92" r={bear ? 27 : 21} fill={primary} />
                  <circle
                    cx="105"
                    cy="92"
                    r="12"
                    fill={secondary}
                    stroke="none"
                  />
                </g>
                <g className="char-ear char-ear-right">
                  <circle cx="215" cy="92" r={bear ? 27 : 21} fill={primary} />
                  <circle
                    cx="215"
                    cy="92"
                    r="12"
                    fill={secondary}
                    stroke="none"
                  />
                </g>
              </>
            )}
            {owl && (
              <path
                d="M95 115L79 71L128 88L160 80L192 88L241 71L225 115Z"
                fill={primary}
              />
            )}
            {bird && (
              <path
                d={
                  characterId === "samuryq"
                    ? "M143 94L148 54L162 77L179 51L183 94"
                    : "M140 94L151 76L160 83L181 72L183 94"
                }
                fill={characterId === "samuryq" ? `url(#${uid}-gold)` : primary}
              />
            )}
            <path
              d={
                camel
                  ? "M109 110Q116 78 160 79Q204 78 211 110L218 164Q216 213 160 215Q104 213 102 164Z"
                  : fox
                    ? "M81 114Q107 71 160 78Q213 71 239 114L246 153Q219 203 160 213Q101 203 74 153Z"
                    : "M81 136Q80 79 160 79Q240 79 239 136L236 160Q229 211 160 211Q91 211 84 160Z"
              }
              fill={`url(#${uid}-fur)`}
            />
            {fox ? (
              <path
                d="M86 138Q106 143 123 172Q143 151 160 157Q177 151 197 172Q214 143 234 138Q224 197 160 205Q96 197 86 138"
                fill={`url(#${uid}-cream)`}
                stroke="none"
              />
            ) : owl ? (
              <>
                <ellipse
                  cx="126"
                  cy="145"
                  rx="39"
                  ry="43"
                  fill={secondary}
                  stroke="none"
                />
                <ellipse
                  cx="194"
                  cy="145"
                  rx="39"
                  ry="43"
                  fill={secondary}
                  stroke="none"
                />
              </>
            ) : (
              <ellipse
                cx="160"
                cy={bird ? 156 : 178}
                rx={camel ? 46 : 49}
                ry={bird ? 43 : 27}
                fill={`url(#${uid}-cream)`}
                stroke="none"
              />
            )}
            {leopard && (
              <g fill="#667d91" stroke="none">
                <ellipse cx="99" cy="131" rx="5" ry="8" />
                <ellipse cx="222" cy="131" rx="5" ry="8" />
                <ellipse cx="111" cy="109" rx="7" ry="4" />
                <ellipse cx="209" cy="109" rx="7" ry="4" />
                <ellipse cx="149" cy="99" rx="4" ry="6" />
                <ellipse cx="174" cy="100" rx="4" ry="6" />
                <path
                  d="M94 160L108 163M225 160L212 163"
                  stroke="#667d91"
                  strokeWidth="5"
                />
              </g>
            )}
            {camel && (
              <path
                d="M140 82Q135 64 148 68L158 82L164 66L180 83"
                fill={primary}
              />
            )}
            <g className="char-eyes" stroke="#323043" strokeWidth="4">
              {happy || soft ? (
                <>
                  <path
                    d={
                      happy
                        ? "M113 145Q125 132 137 145"
                        : "M114 144Q126 151 137 143"
                    }
                    fill="none"
                  />
                  <path
                    d={
                      happy
                        ? "M183 145Q195 132 207 145"
                        : "M183 143Q195 151 206 144"
                    }
                    fill="none"
                  />
                </>
              ) : (
                <>
                  <ellipse
                    cx="125"
                    cy="144"
                    rx={owl ? 11 : 8}
                    ry="12"
                    fill="#323043"
                  />
                  <ellipse
                    cx="195"
                    cy="144"
                    rx={owl ? 11 : 8}
                    ry="12"
                    fill="#323043"
                  />
                  <circle cx="128" cy="140" r="3" fill="white" stroke="none" />
                  <circle cx="198" cy="140" r="3" fill="white" stroke="none" />
                </>
              )}
            </g>
            <ellipse
              cx="107"
              cy="164"
              rx="10"
              ry="5"
              fill="#e89b89"
              opacity=".55"
              stroke="none"
            />
            <ellipse
              cx="213"
              cy="164"
              rx="10"
              ry="5"
              fill="#e89b89"
              opacity=".55"
              stroke="none"
            />
            {bird || owl ? (
              <path
                d={
                  owl
                    ? "M151 167Q160 160 169 167L160 179Z"
                    : "M145 164Q160 155 178 168L158 182Z"
                }
                fill={`url(#${uid}-gold)`}
              />
            ) : (
              <>
                <path
                  d="M150 173Q160 168 170 173Q169 183 160 185Q151 183 150 173Z"
                  fill="#383043"
                />
                <path
                  d={
                    happy
                      ? "M145 187Q160 207 175 187"
                      : "M146 189Q160 199 174 189"
                  }
                  fill={happy ? "#a95560" : "none"}
                />
              </>
            )}
            {equipped.eyewear === "glasses" && (
              <g
                data-item="glasses"
                fill="none"
                stroke="#3c537a"
                strokeWidth="5"
              >
                <circle cx="125" cy="145" r="25" />
                <circle cx="195" cy="145" r="25" />
                <path d="M150 144Q160 137 170 144M100 139L84 135M220 139L236 135" />
              </g>
            )}
            {equipped.hat === "taqiya" && (
              <g data-item="taqiya">
                <path d="M119 83Q120 52 160 52Q200 52 201 83Z" fill="#26897c" />
                <path
                  d="M118 81H202M133 71L143 61L153 71L163 61L173 71L183 61L193 71"
                  stroke="#f4d28c"
                  fill="none"
                />
              </g>
            )}
            {characterId === "samuryq" && (
              <g stroke="#f5d28a" fill="none" strokeWidth="3">
                <path d="M141 110L160 94L179 110L160 123Z" />
                <path d="M150 109L160 101L170 109L160 115Z" />
              </g>
            )}
          </g>
          {equipped.neck === "scarf" && (
            <g data-item="scarf">
              <path
                d="M117 201Q160 219 204 201L199 223Q156 238 121 221Z"
                fill="#e47c54"
              />
              <path d="M181 220L197 225L185 264L166 255Z" fill="#e47c54" />
              <path d="M176 247L188 251" stroke="#ffe4b5" />
            </g>
          )}
          {equipped.hand && (
            <g
              className="char-prop"
              data-item={equipped.hand}
              transform="translate(102 229) rotate(-7)"
            >
              {equipped.hand === "map" ? (
                <>
                  <path
                    d="M0 0L18 5L39 0L60 5V47L40 42L19 48L0 41Z"
                    fill="#f9e5b9"
                  />
                  <path d="M19 6V45M40 3V40" stroke="#b8a17c" />
                  <path
                    d="M9 30Q22 11 30 28T51 18"
                    fill="none"
                    stroke="#54a39b"
                    strokeWidth="4"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M0 0Q15 -5 28 3Q43 -5 60 0V43Q44 38 28 47Q13 38 0 43Z"
                    fill="#fff3d7"
                  />
                  <path
                    d="M28 3V45M7 12L19 14M7 21L19 23M37 14L51 12M37 23L51 21"
                    fill="none"
                    stroke="#8e82ad"
                  />
                </>
              )}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
