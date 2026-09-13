import type { Bone } from "@/lib/national/types";
import { BONE_SHAPE } from "./world-art";

let shape: Path2D | undefined;

export function paintAsykGround(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#6f925f";
  ctx.fillRect(0, 0, 600, 500);
  const soil = ctx.createRadialGradient(200, 100, 20, 300, 260, 360);
  soil.addColorStop(0, "#f2dfb0");
  soil.addColorStop(0.7, "#d7c18e");
  soil.addColorStop(1, "#b2ae7e");
  ctx.fillStyle = soil;
  ctx.beginPath();
  ctx.ellipse(300, 255, 274, 295, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 420; i++) {
    const x = (i * 137.37) % 600,
      y = (i * 71.53) % 500;
    ctx.fillStyle = i % 3 ? "#8e81552b" : "#fff4cf7a";
    ctx.fillRect(x, y, (i % 4) + 1, 1);
  }
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#9a885a66";
  ctx.beginPath();
  ctx.arc(300, 222, 155, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#fff8df";
  ctx.beginPath();
  ctx.arc(300, 220, 155, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.setLineDash([21, 4, 8, 3]);
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(263, 445);
  ctx.lineTo(337, 445);
  ctx.stroke();
  for (let i = 0; i < 18; i++) {
    const x = i % 2 ? 570 + (i % 9) : 10 + (i % 17),
      y = (i * 83) % 500;
    ctx.strokeStyle = i % 3 ? "#426f4d" : "#b6be79";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 14);
    ctx.quadraticCurveTo(x - 11, y, x - 7, y - 12);
    ctx.moveTo(x, y + 14);
    ctx.quadraticCurveTo(x + 6, y, x + 12, y - 8);
    ctx.stroke();
  }
  [
    [85, 70],
    [490, 134],
    [110, 395],
    [480, 400],
    [65, 270],
  ].forEach(([x, y]) => {
    ctx.fillStyle = "#6974533b";
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 5, 12, 4, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#b4b394";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 3, y - 6);
    ctx.lineTo(x + 7, y - 4);
    ctx.lineTo(x + 11, y + 4);
    ctx.lineTo(x - 5, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e2dabc";
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 3, y - 6);
    ctx.lineTo(x + 7, y - 4);
    ctx.lineTo(x, y + 1);
    ctx.closePath();
    ctx.fill();
  });
}

export function paintBone(
  ctx: CanvasRenderingContext2D,
  b: Bone,
  angle: number,
) {
  shape ??= new Path2D(BONE_SHAPE);
  const saka = b.id === -1;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(b.radius / 15, b.radius / 15);
  ctx.fillStyle = "#584d3638";
  ctx.beginPath();
  ctx.ellipse(5, 15, 18, 7, 0, 0, 7);
  ctx.fill();
  ctx.rotate((angle * Math.PI) / 180);
  ctx.save();
  ctx.translate(1, 3);
  ctx.fillStyle = saka ? "#42356e" : "#97886b";
  ctx.fill(shape);
  ctx.restore();
  const color = ctx.createLinearGradient(-12, -15, 12, 17);
  color.addColorStop(0, saka ? "#d4d7ff" : b.special ? "#fff3b3" : "#fffef0");
  color.addColorStop(
    0.42,
    saka ? "#9587df" : b.special ? "#f4cb55" : "#ede0c3",
  );
  color.addColorStop(1, saka ? "#584899" : b.special ? "#b98331" : "#b6a782");
  ctx.fillStyle = color;
  ctx.fill(shape);
  ctx.strokeStyle = saka ? "#5e528d" : "#9b8962";
  ctx.lineWidth = 1.1;
  ctx.stroke(shape);
  ctx.strokeStyle = saka ? "#e4e8ff" : "#fff9dc";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M-10-10q5-6 10 2M6-7q7-4 8 1M-11 7q-1 6 6 3"));
  ctx.strokeStyle = saka ? "#584391" : "#a58a57";
  ctx.lineWidth = 1.8;
  ctx.stroke(new Path2D("M-4-6Q-8 0-1 4T5 12"));
  ctx.restore();
}
