/** Official MSO/Kazakhstan rules. Ring indices 0..8 = South, 9..17 = North. */
export type Board = {
  pits: number[];
  kazan: number[];
  tuz: number[];
  turn: number;
  winner: number | null;
  trail: number[];
  seen: Record<string, number>;
};
export const newBoard = (): Board => {
  const b: Board = {
    pits: Array(18).fill(9),
    kazan: [0, 0],
    tuz: [-1, -1],
    turn: 0,
    winner: null,
    trail: [],
    seen: {},
  };
  b.seen[JSON.stringify([b.pits, b.kazan, b.tuz, b.turn])] = 1;
  return b;
};
export const legalMoves = (b: Board) =>
  b.pits.flatMap((v, i) =>
    Math.floor(i / 9) === b.turn && v > 0 && !b.tuz.includes(i) ? [i] : [],
  );
export function boardMove(input: Board, pit: number): Board {
  if (input.winner !== null || !legalMoves(input).includes(pit))
    throw Error("Жарамсыз жүріс");
  const b = structuredClone(input),
    p = b.turn,
    other = 1 - p;
  let count = b.pits[pit],
    cursor = count === 1 ? (pit + 1) % 18 : pit;
  b.pits[pit] = 0;
  b.trail = [];
  while (count-- > 0) {
    b.trail.push(cursor);
    const owner = b.tuz.indexOf(cursor);
    if (owner >= 0) b.kazan[owner]++;
    else b.pits[cursor]++;
    if (count > 0) cursor = (cursor + 1) % 18;
  }
  if (Math.floor(cursor / 9) === other && !b.tuz.includes(cursor)) {
    if (b.pits[cursor] % 2 === 0) {
      b.kazan[p] += b.pits[cursor];
      b.pits[cursor] = 0;
    } else if (
      b.pits[cursor] === 3 &&
      cursor % 9 !== 8 &&
      b.tuz[p] === -1 &&
      (b.tuz[other] === -1 || b.tuz[other] % 9 !== cursor % 9)
    ) {
      b.tuz[p] = cursor;
      b.kazan[p] += 3;
      b.pits[cursor] = 0;
    }
  }
  b.turn = other;
  if (b.kazan.some((v) => v > 81)) b.winner = b.kazan[0] > 81 ? 0 : 1;
  else if (!legalMoves(b).length) {
    b.pits.forEach((n, i) => {
      b.kazan[Math.floor(i / 9)] += n;
      b.pits[i] = 0;
    });
    b.winner = b.kazan[0] === b.kazan[1] ? -1 : b.kazan[0] > b.kazan[1] ? 0 : 1;
  } else if (b.kazan[0] === 81 && b.kazan[1] === 81) b.winner = -1;
  const key = JSON.stringify([b.pits, b.kazan, b.tuz, b.turn]);
  b.seen[key] = (b.seen[key] ?? 0) + 1;
  return b;
}
export function computerMove(b: Board) {
  return legalMoves(b).sort(
    (a, c) =>
      boardMove(b, c).kazan[b.turn] - boardMove(b, a).kazan[b.turn] || a - c,
  )[0];
}
