# Ұлттық ойындар әлемі

## Routes and preservation

`/learn/national` opens the illustrated village and an equivalent accessible list. All 18 destinations are playable, with instructions, controls, a terminating round, results, retry and return. Previous shop, character equipment, crystal balance, upgrades and rewards remain available. Old in-progress games can be resumed at `classic-asyk` and `classic-arqan`.

| Route suffix | Mechanic                                                                        | End condition                                      |
| ------------ | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| asyk         | Angle and cyclic strength, existing deterministic collision/friction simulation | Five shots or all bones out; four bones wins       |
| arqan        | Tap inside the rhythm window                                                    | Twelve pulls, six accurate pulls wins              |
| tenge        | Bend as the coin passes under the horse                                         | Ten attempts, six coins wins                       |
| baige        | Alternate acceleration and stamina recovery                                     | Twenty segments, beat computer distance            |
| qyzquu       | Friendly pursuit, rival starts ahead                                            | Twenty segments, catch the rival                   |
| aqsuiek      | Navigate a grid with distance/direction hints                                   | Find and take the item within thirty moves         |
| saqina       | Observe the ring, then choose a hand                                            | Five rounds, three correct guesses wins            |
| togyz        | Full 18-pit, 162-stone board against a greedy computer                          | 82 stones, atsyrau, draw or resignation            |
| audaryspaq   | Read the opponent's direction, counter and recover stamina                      | Ten exchanges, positive balance wins               |
| jamby        | Aim at a swinging target                                                        | Five shots, three hits wins                        |
| altybaqan    | Alternating direction at the rhythm window                                      | Twelve beats, eight accurate beats wins            |
| oramal       | Wait for the scarf, react inside the window                                     | Five rounds, three correct reactions wins          |
| hantalapai   | Pick the golden khan, then numbered bones                                       | Nine collected bones or three mistakes             |
| bestas       | Throw, collect and catch in separate timing windows                             | Four stages, three complete stages wins            |
| kokpar       | Carry a soft ball around moving computer defenders                              | Reach the goal, forty moves or three interceptions |
| aigolek      | Choose language answers to advance the team                                     | Eight questions, six correct answers wins          |
| soqyrteke    | Navigate using visible direction and distance cues                              | Find the character within twenty-five moves        |
| ushty        | Classify flying/nonflying objects with explanations                             | Ten questions, seven correct answers wins          |

## State and rewards

The existing `qd_learning_states.state.progress.village` JSON stores the server-created session, action history, best scores, completed rounds, wins, vocabulary and badges. No new SQL table or migration is required. Pause saves the current round; tab hiding also pauses and requests a checkpoint. Completed rounds save automatically. Uncheckpointed actions can be lost if a tab is abruptly closed before a save finishes.

The server reconstructs scores with `replayWorld`, checks monotonically increasing action times against elapsed server time, prevents modification of checkpointed moves, and applies the existing revision check. Each game's first victory pays exactly 30 XP, 20 coins and one crystal via `awardNational`. Replays do not pay again; retiring pays nothing. The existing equipment and character selection are visual only in these games.

This verifies legal inputs and deterministic scores, not human reaction authenticity. As with any browser arcade game, a modified client can synthesize legal input times. There is no real-time authoritative multiplayer server. Local-only progress uses the existing visible browser/demo banner. No secret is bundled into the client.

## Rules and assets

The board implements starting-pit sowing, the single-stone exception, even capture, one tuzdyk per player, the ninth-pit restriction, matching-number restriction, automatic tuzdyk capture, atsyrau settlement, 81–81 draw and claimable threefold repetition. The tutorial is a separate no-reward sandbox. The computer uses immediate capture value; it is labelled as a computer.

Rules reference: [Kazakhstan Ministry of Tourism and Sports rules hosted by Mind Sports Olympiad](https://mindsportsolympiad.com/wp-content/uploads/2021/07/Rules-toguz-en-official.pdf). General cultural context: [UNESCO listing](https://ich.unesco.org/en/RL/traditional-intelligence-and-strategy-game-togyzqumalaq-toguz-korgool-mangala-gocurme-01597). The other games contain deliberately brief traditional descriptions and separately labelled digital rules. No invented historical dates or quotations are used.

Village, yurts, mountains, flags, horses, bones, targets and hands are authored SVG; companions reuse the existing layered SVG renderer and owned equipment. Animation includes clouds, birds, grass, smoke, flag motion, horse legs/tail, companion limbs/ears/tail, simulated bone collisions, swing motion, particles, result transitions and reward entry. The atlas/pooling approach is unnecessary for the small SVG scene; particles are fixed at eight nodes. Music and effects reuse the original synthesized audio system, with separate toggles. There are no recorded voices or commissioned sprite sheets.

Graphics settings and reduced-motion preference persist locally. The village stops CSS animation when offscreen/hidden. Active game clocks pause when hidden; animation frames/listeners clean up on exit. Browser reduced-motion settings are honored. Essential aiming/timing indicators remain visible. A live FPS indicator measures delivered animation callbacks, not GPU frame time. Device-dependent performance must not be described as universally guaranteed 60 FPS.

## Validation and scope

Validation on 2026-09-12: production build and TypeScript succeeded; all 59 unit/SQL tests passed; all 50 desktop/mobile browser tests (40 world scenarios and 10 existing economy/game regressions) passed. After the final art, audio and pause changes, all 14 affected browser scenarios passed again. Active animation-callback rate measured 60–61 FPS in headless Chrome on this Mac, including emulated mobile; no physical phone performance claim is made.

`tests/world.test.ts` checks all eighteen terminating mechanics, valid winning strategies, failed timing, forged moves, board rules/conservation and server reward idempotency. `tests/browser/world.spec.ts` covers village destinations, control input, result, replay, return, pause persistence, reduced motion and FPS on desktop and emulated mobile. The browser board scenario tests a legal move, tutorial and resignation; full board games are exercised by the engine tests. Browser tests use isolated local progress, not real production accounts.

These are compact digital mini-games with one challenge per game; they do not include a multi-level campaign, real online multiplayer, recorded positional voices or a separate hand-drawn sprite animation set. Search games provide complete visual navigation. Existing global character unlocks and shop provide skin progression.
