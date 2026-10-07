# QazaqDos visual refresh — 2026-10-07

The existing Next.js 15 / React 19 application uses Supabase authentication and server-validated learning actions, with browser-local demo progress. This change preserves those actions, database migrations, saved-state formats, rewards and audio permissions. No dependencies or generated raster assets were added.

## Design implementation

`app/design-tokens.css` centralizes the original `#5C67E8` brand (from the committed `globals.css`), dark violet, lavender, glass, spacing, radius, shadow and motion tokens. `app/journey-design.css` applies this system across routes. Green is reserved for semantic feedback; illustrated scenery retains its natural colours. Glass has an opaque fallback, mobile blur is reduced, hover reflections run once, and reduced motion is respected. Existing feature styles remain in place for their specialised game scenes and interactions.

- Landing: clear learning CTA, demo entry, existing Doszhan asset in an SVG mountain scene, real travel/song/game/chat destinations; removed illustrative streak and XP cards.
- Learning shell: collapsible mobile navigation, current-page semantics, skip link, keyboard focus and Escape handling.
- Dashboard: dominant continuation action; existing XP, coins, streak and lesson counts; unresolved-exercise review, available game, latest earned achievement from saved state.
- Lessons and route: answer/feedback styling, warm retry state, completed/current/locked path styling, progress labels and reduced motion.
- Games: existing illustrated village and 18 destinations retained, game count derived from catalog, shared surfaces and typography. Existing controls, pause/resume and result logic retained.
- Songs: shared music hero/card surfaces, compact mode links, two-column missing-word answers and high-contrast karaoke lyrics. Recording and playback continue to follow real media state.
- Characters: dismissible inline advice without removing the character or blocking the lesson.
- Shared loading and recoverable route error views.

Existing map, vocabulary, settings, ranking, books, history, literature and legacy student/teacher routes inherit the shared shell, tokens and controls. Their feature-specific layouts and illustrations remain intact; this is not a rewrite of every screen's structure.

## Verification (violet/glass pass)

- `npm run build` and `npm run lint` passed.
- Initial browser run: 10/10 passed. Final run: 9/10 passed, including all four viewport matrices (360, 390, 768, 1440), onboarding, lesson completion and persisted XP, wrong-answer retry, locked lessons, registration/legacy routes and two song-mode flows. The synthetic microphone test failed again in isolation: MediaRecorder returned an empty blob and the UI correctly displayed the short-recording error. Real microphone capture is unverified; recording code was not changed.
- Reviewed screenshot contact sheets for all four sizes: landing, dashboard, route, active lesson, national village, songs, Kazakhstan, vocabulary, ranking, settings, Q-Level and friend. No horizontal overflow in the matrix.
- Token contrast on lavender: main text 14.24:1, muted text 5.38:1, dark violet 7.57:1; white on the base brand colour 4.60:1.
- Screenshots are emitted to `test-results/journey-*.png`.

## Limits

Live authenticated Supabase sessions, paid/external AI services and physical microphone devices were not exercised. Recording tests use a simulated audio stream. No production deployment was performed. Screenshot checks cover the listed surfaces, not every question, game round, modal and error combination. Existing game catalog entries without a duration or CEFR level were not given invented metadata.
