import test from "node:test";
import assert from "node:assert/strict";
import {
  boardMove,
  newBoard,
  computerMove,
  legalMoves,
} from "../lib/national/board";
import {
  advanceWorld,
  createWorld,
  hiddenTarget,
  handAt,
  dropAt,
  randomAt,
  replayWorld,
  type WorldSession,
  type WorldInput,
} from "../lib/national/world-engine";
import {
  worldGames,
  flyingWords,
  teamQuestions,
} from "../lib/national/world-catalog";
import { applyAction, initialState } from "../lib/learning/state";
import { national } from "../lib/national/state";
const date = "2026-09-11T10:00:00Z";
function play(s: WorldSession, key: string, value?: number, dt = 1200) {
  return advanceWorld(s, {
    t: s.lastAt + dt,
    key,
    ...(value === undefined ? {} : { value }),
  });
}
test("all 18 unique games have rules, four words and terminating distinct mechanics", () => {
  assert.equal(worldGames.length, 18);
  assert.equal(new Set(worldGames.map((g) => g.id)).size, 18);
  for (const g of worldGames) {
    assert.ok(g.rules.length > 40 && g.tradition && g.words.length >= 3);
    let s = createWorld(g.id, "test", 22, date);
    for (let guard = 0; guard < 800 && !s.finished; guard++) {
      switch (g.id) {
        case "asyk":
          s = play(s, "shoot", [-10, 10, 0, -5, 5][s.turn], 2000);
          break;
        case "arqan":
          s = play(s, "pull");
          break;
        case "tenge":
          s = play(s, "collect");
          break;
        case "baige":
        case "qyzquu":
          s = play(s, s.energy >= 18 ? "boost" : "rest");
          break;
        case "saqina":
          s = play(s, "choose", handAt(s), 2600);
          break;
        case "togyz":
          s = play(s, "pit", computerMove(s.board));
          break;
        case "audaryspaq":
          s = play(
            s,
            s.energy < 20
              ? "rest"
              : randomAt(s.seed, s.turn + 20) > 0.5
                ? "left"
                : "right",
          );
          break;
        case "jamby":
          s = play(s, "shoot", 0);
          break;
        case "altybaqan":
          s = play(s, s.turn % 2 ? "right" : "left");
          break;
        case "oramal":
          s = play(s, "run", undefined, dropAt(s) + 400);
          break;
        case "hantalapai":
          s = play(s, "choose", s.turn);
          break;
        case "bestas":
          s = play(
            s,
            s.phase === 0 ? "throw" : s.phase === 1 ? "collect" : "catch",
            undefined,
            s.phase === 2 ? 600 : 800,
          );
          break;
        case "aigolek":
          s = play(s, "choose", teamQuestions[s.turn][2]);
          break;
        case "ushty":
          s = play(
            s,
            flyingWords[(s.turn + (s.seed % 10)) % 10][1] ? "fly" : "stay",
          );
          break;
        case "aqsuiek":
        case "soqyrteke": {
          const t = hiddenTarget(s);
          s = play(
            s,
            s.x < t.x
              ? "right"
              : s.x > t.x
                ? "left"
                : s.y < t.y
                  ? "down"
                  : s.y > t.y
                    ? "up"
                    : "take",
          );
          break;
        }
        case "kokpar":
          s = play(
            s,
            s.turn < 2
              ? "right"
              : s.turn === 2
                ? "take"
                : s.turn === 3
                  ? "up"
                  : "right",
          );
          break;
      }
    }
    assert.ok(s.finished, `${g.id} should finish`);
    assert.deepEqual(
      replayWorld(createWorld(g.id, "test", 22, date), s.events),
      s,
    );
    assert.throws(() => play(s, "retire"));
    if (!["asyk", "togyz"].includes(g.id))
      assert.ok(s.won, `${g.id} winning strategy`);
  }
});
test("wrong timing, false starts, sequence errors and invalid inputs cannot earn wins", () => {
  for (const [kind, key] of [
    ["arqan", "pull"],
    ["tenge", "collect"],
    ["oramal", "run"],
  ] as const) {
    let s = createWorld(kind, "x", 1, date);
    while (!s.finished) s = play(s, key, undefined, 100);
    assert.equal(s.score, 0);
    assert.equal(s.won, false);
  }
  let s = createWorld("hantalapai", "x", 1, date);
  for (let i = 0; i < 3; i++) s = play(s, "choose", 8);
  assert.equal(s.finished, true);
  assert.equal(s.won, false);
  assert.throws(() => play(createWorld("baige", "x", 1, date), "fly"));
  assert.throws(() =>
    advanceWorld(createWorld("baige", "x", 1, date), { key: "boost", t: NaN }),
  );
  assert.throws(() =>
    play(createWorld("saqina", "x", 1, date), "choose", 1, 100),
  );
});
test("Togyz sowing, single stone, even capture and all 162 stones are conserved", () => {
  let b = boardMove(newBoard(), 0);
  assert.equal(b.pits[0], 1);
  assert.equal(b.pits[8], 10);
  assert.equal(b.turn, 1);
  assert.equal(b.trail.length, 9);
  b = newBoard();
  b.pits[0] = 1;
  b.pits[1] = 17;
  b = boardMove(b, 0);
  assert.equal(b.pits[0], 0);
  assert.equal(b.pits[1], 18);
  b = boardMove(newBoard(), 8);
  assert.equal(b.kazan[0], 10);
  assert.equal(b.pits[16], 0);
  for (let i = 0; i < 800 && b.winner === null; i++) {
    b = boardMove(b, computerMove(b));
    assert.equal(
      b.pits.reduce((a, v) => a + v, 0) + b.kazan[0] + b.kazan[1],
      162,
    );
  }
  assert.notEqual(b.winner, null);
});
test("Togyz tuzdyk captures subsequently, disallows ninth, duplicate and matching index", () => {
  let b = newBoard();
  b.pits[8] = 1;
  b.pits[9] = 2;
  b.pits[0] += 15;
  b = boardMove(b, 8);
  assert.equal(b.tuz[0], 9);
  assert.equal(b.kazan[0], 3);
  assert.equal(b.pits[9], 0);
  b.turn = 0;
  b.pits[8] = 1;
  b.pits[0]--;
  b = boardMove(b, 8);
  assert.equal(b.kazan[0], 4);
  const fixture = (target: number) => {
    const q = newBoard();
    q.pits[8] = target - 8 + 1;
    q.pits[target] = 2;
    return q;
  };
  b = boardMove(fixture(17), 8);
  assert.equal(b.tuz[0], -1);
  assert.equal(b.pits[17], 3);
  b = fixture(10);
  b.tuz[1] = 1;
  b = boardMove(b, 8);
  assert.equal(b.tuz[0], -1);
  b = fixture(10);
  b.tuz[0] = 12;
  b = boardMove(b, 8);
  assert.equal(b.tuz[0], 12);
});
test("Togyz atsyrau, draw, illegal side and finished board are handled", () => {
  const b = newBoard();
  b.pits.fill(0);
  b.pits[0] = 1;
  b.kazan = [80, 81];
  const next = boardMove(b, 0);
  assert.equal(next.winner, -1);
  assert.deepEqual(next.kazan, [81, 81]);
  assert.throws(() => boardMove(newBoard(), 9));
  assert.throws(() => boardMove(next, 0));
  assert.equal(legalMoves(next).length, 0);
});
test("server replay saves progress, rejects altered history/future time and pays once", () => {
  let s = initialState();
  s.profile.onboarded = true;
  s = applyAction(s, { type: "village-start", kind: "ushty" }, new Date(date));
  let round = s.progress.village!.session!;
  const id = round.id;
  while (!round.finished)
    round = play(
      round,
      flyingWords[(round.turn + (round.seed % 10)) % 10][1] ? "fly" : "stay",
    );
  assert.throws(() =>
    applyAction(
      s,
      { type: "village-save", sessionId: id, events: round.events },
      new Date(date),
    ),
  );
  const now = new Date(Date.parse(date) + 100000);
  s = applyAction(
    s,
    { type: "village-save", sessionId: id, events: round.events.slice(0, 3) },
    now,
  );
  const tampered: WorldInput[] = [...round.events];
  tampered[0] = {
    ...tampered[0],
    key: tampered[0].key === "fly" ? "stay" : "fly",
  };
  assert.throws(() =>
    applyAction(
      s,
      { type: "village-save", sessionId: id, events: tampered },
      now,
    ),
  );
  s = applyAction(
    s,
    { type: "village-save", sessionId: id, events: round.events },
    now,
  );
  assert.equal(s.progress.xp, 30);
  assert.equal(national(s).crystals, 1);
  assert.equal(s.progress.village!.records.ushty!.wins, 1);
  const again = applyAction(
    s,
    { type: "village-save", sessionId: id, events: round.events },
    now,
  );
  assert.equal(again.progress.xp, 30);
  assert.deepEqual(
    JSON.parse(JSON.stringify(again)).progress.village,
    again.progress.village,
  );
});
