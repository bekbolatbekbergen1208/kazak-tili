import type { Bone } from "./types";
export const ARENA = {
  width: 600,
  height: 500,
  cx: 300,
  cy: 220,
  radius: 155,
  sx: 300,
  sy: 440,
};
export function initialBones(): Bone[] {
  return [
    [255, 205],
    [300, 195],
    [345, 205],
    [275, 247],
    [325, 247],
    [300, 155],
  ].map(([x, y], id) => ({
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 15,
    out: false,
    special: id === 5,
  }));
}
export function launch(
  bones: Bone[],
  dx: number,
  dy: number,
  bonus = false,
): Bone[] {
  const length = Math.hypot(dx, dy),
    scale = Math.min(length, 120) / Math.max(1, length);
  return [
    ...bones.filter((b) => b.id !== -1).map((b) => ({ ...b, vx: 0, vy: 0 })),
    {
      id: -1,
      x: ARENA.sx,
      y: ARENA.sy,
      vx: dx * scale * 0.19 * (bonus ? 1.12 : 1),
      vy: dy * scale * 0.19 * (bonus ? 1.12 : 1),
      radius: 18,
      out: false,
      special: false,
    },
  ];
}
/** Fixed 60 Hz steps, used identically in the browser and server. */
export function step(bones: Bone[]): boolean {
  for (const b of bones) {
    if (b.out) continue;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= 0.982;
    b.vy *= 0.982;
    if (Math.hypot(b.vx, b.vy) < 0.07) {
      b.vx = 0;
      b.vy = 0;
    }
  }
  for (let i = 0; i < bones.length; i++)
    for (let j = i + 1; j < bones.length; j++) {
      const a = bones[i],
        b = bones[j];
      if (a.out || b.out) continue;
      const dx = b.x - a.x,
        dy = b.y - a.y,
        d = Math.hypot(dx, dy),
        min = a.radius + b.radius;
      if (d >= min) continue;
      const nx = d ? dx / d : 1,
        ny = d ? dy / d : 0,
        overlap = (min - d) / 2;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
      const relative = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (relative > 0) {
        const impulse = relative * 0.92;
        a.vx -= impulse * nx;
        a.vy -= impulse * ny;
        b.vx += impulse * nx;
        b.vy += impulse * ny;
      }
    }
  for (const b of bones) {
    if (
      b.id !== -1 &&
      !b.out &&
      Math.hypot(b.x - ARENA.cx, b.y - ARENA.cy) > ARENA.radius + b.radius
    ) {
      b.out = true;
      b.vx = 0;
      b.vy = 0;
    }
    if (b.id === -1 && (b.x < -30 || b.x > 630 || b.y < -30 || b.y > 530)) {
      b.vx = 0;
      b.vy = 0;
    }
  }
  return bones.some((b) => !b.out && Math.hypot(b.vx, b.vy) > 0.07);
}
export function simulate(bones: Bone[], dx: number, dy: number, bonus = false) {
  const next = launch(bones, dx, dy, bonus);
  for (let i = 0; i < 720; i++) if (!step(next)) break;
  return next.filter((b) => b.id !== -1);
}
