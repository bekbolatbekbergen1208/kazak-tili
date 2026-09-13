# In-game artwork

The existing React/SVG and Canvas renderers now share a layered landscape, warm
upper-left light, contact shadows, felt yurts with textile ornament, textured
ground and restrained jade, red and gold accents. No engine or runtime dependency
was added. The game engines, economy reducers and saved-state formats are unchanged.

## Scenes

- Asyk: a grounded sand court, chalk circle, shaded ankle-bone geometry, selected
  saka and collision accents. The village replay uses the existing fixed 60 Hz
  physics steps, with a time accumulator instead of three steps per display frame.
  There is one saka during a shot. A second shot waits for the current visual
  replay; pausing freezes it, and reloading shows the saved authoritative result.
- Arqan: four existing characters hold a braided rope; poses and the centre marker
  follow the actual advantage. Ground markings and contact shadows stay fixed.
- Horse games: shaded horses, patterned saddlecloths, mounted selected characters,
  reins, hoof shadows, short dust and movement-dependent gait. Riders and their
  equipment use the same scene coordinates as the mount.
- Grid games use the selected character on a ground plane. Aigolek has a visible
  team; Togyz pits show shaded seeds. All village scenes share the environment.
- History: masonry, tiled domes, a city wall, market and parallax scenery in the
  three existing playable cities. The traveler walks only while changing position.
- Travel exercises: coast, mountain, steppe and Turkistan architecture variants.

The HUD uses compact currency icons and an objective strip. Reward animation is
enabled only when a real reward record belongs to the current round. Reduced
motion, pause and low-quality settings suppress optional motion. The main page no
longer updates React state on every animation frame; timing controls update through
a ref. Canvas resolution is capped at devicePixelRatio 2 and its ground is cached.

## Comparison

These screenshots use the same initial game state and Playwright viewport per pair.
Mobile captures emulate iPhone 13 in Chrome, including its pixel density.

| Scene | Before | After |
| --- | --- | --- |
| Asyk, desktop | [Before](art-before-asyk-desktop.png) | [After](art-after-asyk-desktop.png) |
| Asyk, mobile | [Before](art-before-asyk-mobile.png) | [After](art-after-asyk-mobile.png) |
| Arqan, desktop | [Before](art-before-arqan-desktop.png) | [After](art-after-arqan-desktop.png) |
| Baige, desktop | [Before](art-before-baige-desktop.png) | [After](art-after-baige-desktop.png) |

## Validation

- Production build and TypeScript passed.
- 35 focused unit tests passed: physics, all 18 game engines, rewards, character
  equipment, history and travel progression.
- 66 national-game browser tests passed on desktop and emulated mobile, covering
  all 18 games, classic modes, actual mouse/touch dragging, Canvas pixel checks and
  pixel density, replay, exit, pause/save/reload, reduced motion and reward idempotency.
- 14 history/travel browser tests passed on desktop and emulated mobile, including
  all three cities, movement, equipment, notebooks, three travel exercises and
  one-time region completion rewards.

Tests use isolated demo or mocked account state. Real hosted accounts and physical
phones were not exercised. The in-app FPS readout measures animation callbacks;
no sustained 60 FPS or physical-device performance claim is made here.

To run another development instance without sharing an existing dev cache:

```sh
QD_DEV_DIST_DIR=.next/graphics npm run dev -- --hostname 127.0.0.1 --port 3021
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3021 npx playwright test tests/browser/game-art.spec.ts
```
