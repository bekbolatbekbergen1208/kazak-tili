import { initialBones, simulate } from "./physics";
import { boardMove, computerMove, newBoard, type Board } from "./board";
import {
  flyingWords,
  teamQuestions,
  worldGame,
  type WorldKind,
} from "./world-catalog";
import type { Bone } from "./types";
export type WorldInput = { t: number; key: string; value?: number };
export type WorldSession = {
  id: string;
  kind: WorldKind;
  seed: number;
  startedAt: string;
  events: WorldInput[];
  turn: number;
  score: number;
  energy: number;
  distance: number;
  rival: number;
  x: number;
  y: number;
  carrying: boolean;
  mistakes: number;
  phase: number;
  lastAt: number;
  finished: boolean;
  won: boolean;
  feedback: string;
  good: boolean;
  bones: Bone[];
  board: Board;
  claimed?: boolean;
};
export const randomAt = (seed: number, n: number) => {
  let x = (seed + Math.imul(n + 1, 0x9e3779b9)) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
};
export function createWorld(
  kind: WorldKind,
  id: string,
  seed: number,
  startedAt: string,
): WorldSession {
  if (!worldGame(kind)) throw Error("Ойын табылмады");
  return {
    id,
    kind,
    seed,
    startedAt,
    events: [],
    turn: 0,
    score: 0,
    energy: 100,
    distance: 0,
    rival: kind === "qyzquu" ? 12 : 0,
    x: 0,
    y: 2,
    carrying: false,
    mistakes: 0,
    phase: 0,
    lastAt: 0,
    finished: false,
    won: false,
    feedback: "Дайынсың ба?",
    good: true,
    bones: initialBones(),
    board: newBoard(),
  };
}
export const phaseAt = (s: WorldSession, time: number) =>
  ((time - s.lastAt) % 2400) / 2400;
export const hiddenTarget = (s: WorldSession) => ({
  x: 2 + Math.floor(randomAt(s.seed, 0) * 5),
  y: Math.floor(randomAt(s.seed, 1) * 5),
});
export const handAt = (s: WorldSession) =>
  Math.floor(randomAt(s.seed, s.turn + 10) * 5);
export const dropAt = (s: WorldSession) =>
  1200 + Math.floor(randomAt(s.seed, s.turn + 30) * 1800);
export const defenderAt = (turn: number, i: number) => ({
  x: 3 + i * 2,
  y: (turn + i * 2) % 5,
});
export function advanceWorld(
  input: WorldSession,
  event: WorldInput,
): WorldSession {
  if (
    input.finished ||
    (input.events.length >= 2048 && event.key !== "retire") ||
    !Number.isFinite(event.t) ||
    event.t < input.lastAt + (event.key === "retire" ? 0 : 80) ||
    (event.t > 7_200_000 && event.key !== "retire") ||
    typeof event.key !== "string" ||
    (event.value !== undefined && !Number.isFinite(event.value))
  )
    throw Error("Жарамсыз әрекет");
  const s = structuredClone(input),
    dt = event.t - s.lastAt,
    p = phaseAt(s, event.t),
    key = event.key;
  let good = false,
    message = "Тағы байқап көр!";
  const allowed = (keys: string[]) => {
    if (!keys.includes(key)) throw Error("Бұл басқару ойынға сәйкес емес");
  };
  const end = (won: boolean) => {
    s.finished = true;
    s.won = won;
  };
  const point = (ok: boolean) => {
    good = ok;
    if (ok) s.score += 10;
    else s.mistakes++;
  };
  if (key === "retire") {
    end(false);
    message = "Жаттығу аяқталды. Қайта байқап көр!";
  } else
    switch (s.kind) {
      case "asyk": {
        allowed(["shoot"]);
        const angle = event.value ?? 0;
        if (angle < -65 || angle > 65) throw Error("Бағыт жарамсыз");
        const force = 35 + p * 85,
          rad = (angle * Math.PI) / 180;
        const next = simulate(
          s.bones,
          Math.sin(rad) * force,
          -Math.cos(rad) * force,
        );
        const count =
          next.filter((b) => b.out).length -
          s.bones.filter((b) => b.out).length;
        s.bones = next;
        s.score += count * 10;
        good = count > 0;
        s.turn++;
        message = `${count} асық шеңберден шықты.`;
        if (s.turn >= 5 || s.bones.every((b) => b.out)) end(s.score >= 40);
        break;
      }
      case "arqan":
      case "altybaqan": {
        allowed(s.kind === "arqan" ? ["pull"] : ["left", "right"]);
        good =
          p >= 0.4 &&
          p <= 0.66 &&
          (s.kind === "arqan" || key === (s.turn % 2 ? "right" : "left"));
        point(good);
        s.distance += good ? 18 : -12;
        s.turn++;
        message = good ? "Ырғақты ұстадың!" : "Алтын аймақта басып көр.";
        if (s.turn >= 12) end(s.score >= (s.kind === "arqan" ? 60 : 80));
        break;
      }
      case "tenge":
        allowed(["collect"]);
        point(p >= 0.42 && p <= 0.64);
        s.turn++;
        message = good
          ? "Теңге жиналды!"
          : "Теңге аттың астына келгенде еңкей.";
        if (s.turn >= 10) end(s.score >= 60);
        break;
      case "baige":
      case "qyzquu": {
        allowed(["boost", "rest"]);
        const boost = key === "boost" && s.energy >= 18;
        s.distance += boost ? 12 : 5;
        s.energy = Math.min(100, s.energy + (boost ? -18 : 12));
        s.rival += 7 + randomAt(s.seed, s.turn) * 1.2;
        s.score = Math.round(s.distance);
        good = boost || key === "rest";
        s.turn++;
        message = boost ? "Атың үдеді!" : "Төзімділік қалпына келді.";
        if (s.turn >= 20) end(s.distance > s.rival);
        break;
      }
      case "aqsuiek":
      case "soqyrteke":
      case "kokpar": {
        allowed(["left", "right", "up", "down", "take"]);
        if (key === "left") s.x = Math.max(0, s.x - 1);
        if (key === "right") s.x = Math.min(7, s.x + 1);
        if (key === "up") s.y = Math.max(0, s.y - 1);
        if (key === "down") s.y = Math.min(4, s.y + 1);
        s.turn++;
        const target = s.kind === "kokpar" ? { x: 2, y: 2 } : hiddenTarget(s);
        const distance = Math.abs(target.x - s.x) + Math.abs(target.y - s.y);
        if (s.kind === "kokpar") {
          if (s.x === 2 && s.y === 2 && key === "take") {
            s.carrying = true;
            good = true;
          }
          if (
            [0, 1].some((i) => {
              const d = defenderAt(s.turn, i);
              return d.x === s.x && d.y === s.y;
            })
          ) {
            s.mistakes++;
            s.x = 0;
            s.y = 2;
            s.carrying = false;
            message = "Қорғаушы допты қайтарды. Басқа жол таңда!";
          } else
            message = s.carrying
              ? "Доп сенде! Оң жақ қақпаға жеткіз."
              : "Допқа жақындап, Ал батырмасын бас.";
          if (s.carrying && s.x === 7) {
            s.score = 1;
            end(true);
          } else if (s.turn >= 40 || s.mistakes >= 3) end(false);
        } else {
          message =
            distance === 0
              ? "Осында! Ал батырмасын бас."
              : `Қашықтық: ${distance} қадам. ${target.x > s.x ? "Оңға" : target.x < s.x ? "Солға" : ""} ${target.y > s.y ? "Төмен" : target.y < s.y ? "Жоғары" : ""}`;
          if (distance === 0 && key === "take") {
            s.score = 1;
            good = true;
            end(true);
          } else if (s.turn >= (s.kind === "soqyrteke" ? 25 : 30)) end(false);
        }
        break;
      }
      case "saqina":
        allowed(["choose"]);
        if (dt < 2200) throw Error("Алдымен бақыла");
        point(event.value === handAt(s));
        message = good
          ? "Сақинаны таптың!"
          : `Сақина ${handAt(s) + 1}-алақанда еді.`;
        s.turn++;
        if (s.turn >= 5) end(s.score >= 30);
        break;
      case "togyz": {
        allowed(["pit", "draw"]);
        if (key === "draw") {
          if (!Object.values(s.board.seen).some((n) => n >= 3))
            throw Error("Үш рет қайталанған орын жоқ");
          s.board.winner = -1;
        } else {
          s.board = boardMove(s.board, event.value ?? -1);
          if (s.board.winner === null)
            s.board = boardMove(s.board, computerMove(s.board));
        }
        s.score = s.board.kazan[0];
        good = s.score > input.score;
        s.turn++;
        message = `Сенің қазаның: ${s.score}. Компьютер: ${s.board.kazan[1]}.`;
        if (s.board.winner !== null) end(s.board.winner === 0);
        break;
      }
      case "audaryspaq": {
        allowed(["left", "right", "rest"]);
        const opposite = randomAt(s.seed, s.turn + 20) > 0.5 ? "left" : "right";
        good = key === opposite && s.energy >= 20;
        if (key === "rest") {
          s.energy = Math.min(100, s.energy + 35);
          s.score -= 5;
        } else {
          s.score += good ? 15 : -15;
          s.energy = Math.max(0, s.energy - 20);
        }
        s.turn++;
        message = good
          ? "Тепе-теңдікті сақтадың!"
          : "Демалып, қарсы бағытты таңда.";
        if (s.turn >= 10) end(s.score > 0);
        break;
      }
      case "jamby": {
        allowed(["shoot"]);
        const aim = event.value ?? 0;
        if (aim < -65 || aim > 65) throw Error("Бағыт жарамсыз");
        point(Math.abs(aim - Math.sin(p * Math.PI * 2) * 45) < 12);
        s.turn++;
        message = good ? "Дәл тиді!" : "Тербелген нысанаға бағытта.";
        if (s.turn >= 5) end(s.score >= 30);
        break;
      }
      case "oramal":
        allowed(["run"]);
        point(dt >= dropAt(s) && dt <= dropAt(s) + 1100);
        message = good
          ? "Бос орынға жеттің!"
          : dt < dropAt(s)
            ? "Орамал әлі түспеді."
            : "Келесіде ертерек жүгір.";
        s.turn++;
        if (s.turn >= 5) end(s.score >= 30);
        break;
      case "hantalapai":
        allowed(["choose"]);
        point(event.value === s.turn);
        if (good) s.turn++;
        message = good ? "Дұрыс рет!" : "Алдымен хан, кейін сан ретімен жина.";
        if (s.turn >= 9 || s.mistakes >= 3) end(s.turn >= 9);
        break;
      case "bestas": {
        allowed(
          s.phase === 0 ? ["throw"] : s.phase === 1 ? ["collect"] : ["catch"],
        );
        if (s.phase === 0) {
          s.phase = 1;
          good = true;
          message = "Тас көтерілгенде жина!";
        } else if (s.phase === 1 && dt >= 400 && dt <= 1300) {
          s.phase = 2;
          good = true;
          message = "Төмендегенде қағып ал!";
        } else {
          point(s.phase === 2 && dt >= 300 && dt <= 1100);
          s.phase = 0;
          s.turn++;
          message = good ? "Тастар жиналды!" : "Уақытын тағы байқап көр.";
          if (s.turn >= 4) end(s.score >= 30);
        }
        break;
      }
      case "aigolek":
        allowed(["choose"]);
        point(event.value === teamQuestions[s.turn][2]);
        message = good
          ? "Команда алға жылжыды!"
          : `Дұрыс жауап: ${teamQuestions[s.turn][1][teamQuestions[s.turn][2]]}`;
        s.turn++;
        if (s.turn >= 8) end(s.score >= 60);
        break;
      case "ushty": {
        allowed(["fly", "stay"]);
        const item = flyingWords[(s.turn + (s.seed % 10)) % 10];
        point((key === "fly") === item[1]);
        message = item[2];
        s.turn++;
        if (s.turn >= 10) end(s.score >= 70);
        break;
      }
    }
  s.feedback = message;
  s.good = good;
  s.lastAt = event.t;
  s.events.push(event);
  return s;
}
export function replayWorld(start: WorldSession, events: WorldInput[]) {
  if (!Array.isArray(events) || events.length > 2049)
    throw Error("Әрекеттер саны жарамсыз");
  return events.reduce(
    advanceWorld,
    createWorld(start.kind, start.id, start.seed, start.startedAt),
  );
}
