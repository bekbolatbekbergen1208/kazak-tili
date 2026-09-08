"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { regions, regionById } from "@/lib/travel/catalog";
import type { Point, Region } from "@/lib/travel/types";
import { useLearning } from "@/components/learning/provider";
import { selectedCharacter, equipmentFor } from "@/lib/characters/state";
import { CharacterArt } from "@/components/characters/character-art";
import { travelOf } from "@/lib/travel/state";
import { TravelIcon } from "./art";
import { useTravelMotion } from "./motion";
type Boundary = { id: string; d: string; name: string };
export function KazakhstanMap() {
  const { state, dispatch, busy } = useLearning();
  const travel = travelOf(state);
  const router = useRouter();
  const [boundaries, setBoundaries] = useState<Boundary[]>([]),
    [failed, setFailed] = useState(false),
    [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Region>(() =>
    regionById(travel.lastRegion ?? "mangystau")!,
  );
  const [position, setPosition] = useState<Point>(selected.coordinates),
    [start, setStart] = useState<Point>(selected.coordinates),
    [moving, setMoving] = useState(false);
  const [zoom, setZoom] = useState(travel.camera?.zoom ?? 1),
    [center, setCenter] = useState(
      travel.camera?.center ?? { x: 500, y: 274.5 },
    );
  const [focusedObject, setFocusedObject] = useState<
    Region["mapObjects"][number] | null
  >(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    center: Point;
    scale: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const { ref, mode, paused } = useTravelMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actor = useRef<SVGGElement>(null);
  const latest = useRef({ dispatch, busy, travel });
  latest.current = { dispatch, busy, travel };
  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof setTimeout>;
    const save = async () => {
      if (cancelled) return;
      const current = latest.current;
      if (current.busy) {
        task = setTimeout(save, 200);
        return;
      }
      const old = current.travel.camera;
      if (
        old &&
        old.zoom === zoom &&
        old.center.x === center.x &&
        old.center.y === center.y
      )
        return;
      await current.dispatch({ type: "travel-camera", center, zoom });
    };
    task = setTimeout(save, 500);
    return () => {
      cancelled = true;
      clearTimeout(task);
    };
  }, [center.x, center.y, zoom]);
  const char = selectedCharacter(state);
  const cleanTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/travel/boundaries.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data: Boundary[]) => {
        if (data.length !== 20 || !data.every((x) => typeof x.d === "string"))
          throw Error();
        setBoundaries(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => {
      controller.abort();
      cleanTimer();
    };
  }, []);
  useEffect(() => {
    if (mode === "off") {
      cleanTimer();
      setMoving(false);
    }
  }, [mode]);
  function pick(r: Region) {
    setFocusedObject(null);
    cleanTimer();
    let origin = position;
    if (actor.current) {
      const m = new DOMMatrix(getComputedStyle(actor.current).transform);
      if (Number.isFinite(m.e) && Number.isFinite(m.f))
        origin = { x: m.e, y: m.f };
    }
    setStart(origin);
    setPosition(r.coordinates);
    setSelected(r);
    setMoving(mode !== "off");
    if (travel.settings.follow && zoom > 1) setCenter(r.coordinates);
    if (mode !== "off")
      timer.current = setTimeout(() => {
        setMoving(false);
        timer.current = null;
      }, 1800);
  }
  function pan(x: number, y: number) {
    setCenter((c) => ({
      x: Math.max(0, Math.min(1000, c.x + x / zoom)),
      y: Math.max(0, Math.min(549, c.y + y / zoom)),
    }));
  }
  function focusObject(o: Region["mapObjects"][number]) {
    cleanTimer();
    setMoving(false);
    setFocusedObject(o);
    setCenter(o.coordinates);
    setZoom(4);
    setPosition(o.coordinates);
  }
  async function enter() {
    cleanTimer();
    setMoving(false);
    const saved = await dispatch({ type: "travel-camera", center, zoom });
    if (saved) router.push(`/kazakhstan/${selected.slug}`);
  }
  const list = regions.filter((r) =>
    `${r.nameKk} ${r.nameRu} ${r.nameEn} ${r.capital ?? ""}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  return (
    <div
      ref={ref}
      className={`travel-map-block motion-${mode} ${paused ? "motion-paused" : ""}`}
    >
      <div className="travel-map-tools">
        <label>
          <span className="sr-only">Өңір іздеу</span>
          <input
            placeholder="Өңірді ізде…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div>
          <button
            aria-label="Кішірейту"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 1))}
          >
            −
          </button>
          <span>{zoom}×</span>
          <button
            aria-label="Үлкейту"
            disabled={zoom >= 4}
            onClick={() => {
              setCenter(selected.coordinates);
              setZoom((z) => Math.min(4, z + 1));
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              setFocusedObject(null);
              setZoom(1);
              setCenter({ x: 500, y: 274.5 });
            }}
          >
            Толық карта
          </button>
        </div>
      </div>
      {zoom > 1 && (
        <div className="travel-pan-tools" aria-label="Картаны жылжыту">
          <span>Картаны сүйре немесе бағытты таңда</span>
          <button
            aria-label="Картаны батысқа жылжыту"
            onClick={() => pan(-100, 0)}
          >
            ←
          </button>
          <button
            aria-label="Картаны солтүстікке жылжыту"
            onClick={() => pan(0, -100)}
          >
            ↑
          </button>
          <button
            aria-label="Картаны оңтүстікке жылжыту"
            onClick={() => pan(0, 100)}
          >
            ↓
          </button>
          <button
            aria-label="Картаны шығысқа жылжыту"
            onClick={() => pan(100, 0)}
          >
            →
          </button>
        </div>
      )}
      <div className="travel-map-stage">
        {failed ? (
          <p role="status">
            Карта жүктелмеді. Төмендегі тізімнен кез келген өңірді аша аласыз.
          </p>
        ) : !boundaries.length ? (
          <p role="status">Қазақстан картасы жүктелуде…</p>
        ) : (
          <svg
            viewBox="0 0 1000 549"
            aria-label="Қазақстан: 17 облыс және республикалық маңызы бар 3 қала"
            className="travel-map-svg"
            style={{
              touchAction: zoom > 1 ? "none" : "pan-y",
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : undefined,
            }}
            onPointerDown={(e) => {
              if (zoom <= 1 || e.button !== 0 || !e.isPrimary) return;
              suppressClick.current = false;
              drag.current = {
                id: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                center,
                scale:
                  1000 / e.currentTarget.getBoundingClientRect().width / zoom,
                moved: false,
              };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== e.pointerId) return;
              const dx = e.clientX - d.x,
                dy = e.clientY - d.y;
              if (!d.moved && Math.hypot(dx, dy) < 5) return;
              d.moved = true;
              suppressClick.current = true;
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              setCenter({
                x: Math.max(0, Math.min(1000, d.center.x - dx * d.scale)),
                y: Math.max(0, Math.min(549, d.center.y - dy * d.scale)),
              });
            }}
            onPointerUp={() => {
              drag.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setDragging(false);
              suppressClick.current = false;
            }}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.stopPropagation();
                suppressClick.current = false;
              }
            }}
          >
            <defs>
              <linearGradient id="travel-ground" x2="0" y2="1">
                <stop stopColor="#d9e5af" />
                <stop offset="1" stopColor="#e9d7a8" />
              </linearGradient>
              <pattern
                id="travel-dots"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="#a6c6c2" opacity=".2" />
              </pattern>
            </defs>
            <rect width="1000" height="549" fill="#e1f0ec" />
            <rect width="1000" height="549" fill="url(#travel-dots)" />
            <g
              className="travel-camera"
              style={{
                transform: `translate(${500 - center.x * zoom}px, ${274.5 - center.y * zoom}px) scale(${zoom})`,
                transition: dragging ? "none" : undefined,
              }}
            >
              <text
                x="61"
                y="441"
                fill="#6c9fba"
                fontSize="12"
                transform="rotate(-75 61 441)"
              >
                КАСПИЙ ТЕҢІЗІ
              </text>
              <g transform="translate(0 6)" opacity=".5" aria-hidden="true">
                {boundaries.map((b) => (
                  <path key={b.id} d={b.d} fill="#a3b69b" />
                ))}
              </g>
              {boundaries.map((b) => {
                const r = regions.find((r) => r.mapFeatureId === b.id)!;
                const status = travel.regions[r.id];
                return (
                  <path
                    key={b.id}
                    d={b.d}
                    tabIndex={0}
                    role="button"
                    aria-label={`${r.nameKk}: ${status?.stampUnlocked ? "аяқталды" : status?.visited ? "басталды" : "зерттелмеген"}`}
                    onClick={() => pick(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pick(r);
                      }
                    }}
                    className={`travel-boundary ${selected.id === r.id ? "selected" : ""}`}
                    fill={
                      status?.stampUnlocked
                        ? "#b2d9b9"
                        : r.theme === "mountain"
                          ? "#bfd4b4"
                          : r.theme === "sea"
                            ? "#eadbb8"
                            : "url(#travel-ground)"
                    }
                  >
                    <title>{r.nameKk}</title>
                  </path>
                );
              })}
              <g aria-hidden="true" pointerEvents="none">
                {regions
                  .filter((r) => r.type === "region")
                  .map((r) => (
                    <g
                      key={r.id}
                      transform={`translate(${r.coordinates.x - 13} ${r.coordinates.y - 35})`}
                      className={`ambient ambient-${r.ambientAnimations[0]}`}
                    >
                      <TravelIcon
                        kind={
                          r.theme === "sea"
                            ? "ship"
                            : r.theme === "mountain"
                              ? "mountain"
                              : r.id === "kostanay"
                                ? "wheat"
                                : "tree"
                        }
                        style={{ width: 26, height: 26 }}
                      />
                    </g>
                  ))}
              </g>
              {regions.map((r) => (
                <g
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.nameKk} таңдау`}
                  onClick={() => pick(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(r);
                    }
                  }}
                  className="travel-marker"
                  transform={`translate(${r.coordinates.x} ${r.coordinates.y})`}
                >
                  <circle
                    r={r.type === "city" ? 7 : 4}
                    fill={r.type === "city" ? "#df9d5b" : "#577f69"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    textAnchor="middle"
                    y={r.type === "city" ? 19 : 14}
                    fontSize={r.type === "city" ? 10 : 9}
                  >
                    {r.nameKk.replace(" облысы", "").replace(" қаласы", "")}
                    {travel.regions[r.id]?.stampUnlocked ? " ✓" : ""}
                  </text>
                </g>
              ))}
              {zoom >= 2 &&
                selected.mapObjects
                  .filter((o) => zoom >= o.minZoom)
                  .map((o) => (
                    <g
                      key={o.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${o.title} картада зерттеу`}
                      className="travel-map-object"
                      onClick={() => focusObject(o)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          focusObject(o);
                        }
                      }}
                      transform={`translate(${o.coordinates.x} ${o.coordinates.y})`}
                    >
                      <circle
                        r="10"
                        fill={
                          focusedObject?.id === o.id ? "#f5c778" : "#fff9e9"
                        }
                        stroke="#a66b37"
                      />
                      <g transform="translate(-7 -7)" pointerEvents="none">
                        <TravelIcon
                          kind={o.icon}
                          style={{ width: 14, height: 14 }}
                        />
                      </g>
                      <title>{o.title}</title>
                    </g>
                  ))}
              {moving && (
                <path
                  d={`M${start.x} ${start.y}L${position.x} ${position.y}`}
                  fill="none"
                  stroke="#ba8855"
                  strokeWidth="3"
                  strokeDasharray="6 5"
                  pointerEvents="none"
                />
              )}
              <g
                ref={actor}
                className="travel-actor"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                }}
                pointerEvents="none"
              >
                <foreignObject x="-24" y="-59" width="48" height="55">
                  <div
                    style={{
                      transform:
                        start.x > position.x ? "scaleX(-1)" : undefined,
                    }}
                  >
                    <CharacterArt
                      characterId={char.id}
                      mood={moving ? "running" : "joy"}
                      equipped={equipmentFor(state, char.id)}
                      decorative
                    />
                  </div>
                </foreignObject>
              </g>
            </g>
            <g
              className="ambient ambient-cloud"
              opacity=".6"
              pointerEvents="none"
            >
              <path
                d="M55 60q0-20 20-20 8-26 30-5 29-7 28 25Z M800 74q0-20 20-20 8-26 30-5 29-7 28 25Z"
                fill="white"
              />
            </g>
          </svg>
        )}
        <div className="travel-map-caption">
          <span>Ойын әлемі · маршрут жол нұсқаулығы емес</span>
          <a
            href="https://simplemaps.com/svg/country/kz"
            target="_blank"
            rel="noreferrer"
          >
            Карта: Simplemaps
          </a>
        </div>
      </div>
      {focusedObject && (
        <section className="travel-object-detail" aria-live="polite">
          <TravelIcon kind={focusedObject.icon} />
          <div>
            <h2>{focusedObject.title}</h2>
            <p>{focusedObject.text}</p>
            <small>Нысанның картадағы орны шартты.</small>
            {focusedObject.source && (
              <p>
                <a href={focusedObject.source} target="_blank" rel="noreferrer">
                  Дереккөз ↗
                </a>
              </p>
            )}
            <button
              className="btn ghost"
              disabled={busy}
              onClick={() => void enter()}
            >
              Өңірде тапсырма орындау →
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setFocusedObject(null);
                setCenter(selected.coordinates);
                setZoom(2);
              }}
            >
              Өңір көрінісіне қайту
            </button>
          </div>
        </section>
      )}
      <div className="travel-destination" aria-live="polite">
        <div>
          <small>{moving ? "Саяхаттап барамыз…" : "Келесі аялдама"}</small>
          <h2>{selected.nameKk}</h2>
          <p>{selected.shortDescription}</p>
        </div>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void enter()}
        >
          {moving ? "Бірден өту" : "Зерттеуді бастау"} →
        </button>
      </div>
      <div className="travel-region-list" aria-label="Барлық өңірлер">
        {list.map((r) => (
          <Link key={r.id} href={`/kazakhstan/${r.slug}`}>
            <span>{r.nameKk}</span>
            <small>
              {travel.regions[r.id]?.stampUnlocked
                ? "✓ Аяқталды"
                : travel.regions[r.id]?.visited
                  ? "◐ Басталды"
                  : "○ Зерттелмеген"}
            </small>
          </Link>
        ))}
        {!list.length && <p>Өңір табылмады. Басқа атауды көріңіз.</p>}
      </div>
    </div>
  );
}
