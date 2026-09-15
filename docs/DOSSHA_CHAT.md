# Досшамен чат

Available at `/student/friend` and `/learn/friend`, with a link in the learning navigation. Paid AI providers are not used. If `QAZAQDOS_AI_BASE_URL` and `QAZAQDOS_CHAT_MODEL` are set, the chat uses that server-side AI endpoint. Otherwise it uses the local Kazakh reference catalog and carries the most recent 20 messages (maximum 24,000 characters) as context for local follow-ups. Replies use plain text. Users can choose Kazakh, Russian, English, Chinese, Spanish, German or French in the UI. The existing small dictionary and browser microphone input remain available.

The reference catalog now includes participles, converbs, infinitives, voice, moods, negation, interjections, sentence members, compound sentences, direct address, parenthetical words and spelling topics. Retrieval ranks specific phrases first and includes multiple matching topics for comparison requests. No web search tool is enabled: current news/prices/weather must not be presented as verified.

## Server AI

Set `QAZAQDOS_AI_BASE_URL` to a server-side `/v1` compatible endpoint such as `http://127.0.0.1:11434/v1`, and set `QAZAQDOS_CHAT_MODEL` to the local chat model name. `QAZAQDOS_AI_KEY` is optional for private internal endpoints that require a bearer token. Do not use paid provider endpoints. Reference mode cannot translate arbitrary text or answer every question and says so rather than pretending a canned answer is an AI response.

## Save conversations

Apply `supabase/migrations/202609090009_friend_chat.sql` using Supabase SQL Editor. RLS isolates each user's `qd_friend_conversations` row. Unlike the reward state, a chat can be saved with the user's own authenticated Supabase client; a service-role key is not necessary for this table. Only the latest 20 messages are retained. Without the migration or an account, the interface states that chat history is only available on the current page. Messages are not mixed into the XP ledger.

This migration and migration 008 for the books friends league are included locally; they have not automatically been applied to the remote database.

The API accepts at most 2,000 characters per user message and only user/assistant roles in context. It checks request origin and limits signed-in users to one active response, 12 messages/minute and 100/hour. The rate-limit map is process-local, appropriate to the current single PM2 process; replace it with shared storage before running multiple instances. Chat data is sent only to the configured server AI endpoint when AI mode is enabled. Concurrent browser tabs use last-write-wins chat history; this does not affect learning rewards.

Tests: `tests/friend.test.ts` (request validation, bounded context, reference answers and local AI adapter), `tests/sql.test.ts` (user isolation), and `tests/browser/friend.spec.ts` (reference endpoint UI).

## Personal learning context

Apply `supabase/migrations/202609150011_friend_learning_memory.sql` after migration 009. Each successful chat saves the latest 12 distinct user requests (up to 300 characters each) in the user's own conversation row. These are unverified user text, supplied as user context, never as system instructions or shared grammatical facts. Existing owner-only RLS and account deletion apply. This is bounded personal context, not model training, and it cannot guarantee correct answers. Older requests are discarded. An empty client history recovers the saved conversation. Without the migration, ordinary conversation saving still works; `memorySaved` in the POST response reports whether memory was persisted.

The model still needs evaluation on real incorrect answers before a server upgrade or fine-tuning decision. No server model weights were changed by these code changes. Do not automatically train on raw chat replies: incorrect answers would become training targets. Use reviewed corrections and a separate evaluation set for any future training.

## Reviewed improvement loop

Apply `supabase/migrations/202609150012_dossha_feedback_learning.sql`. Signed-in learners can rate a newly generated answer. An unhelpful rating and optional note enter the teacher queue at `/teacher/dossha`. Only a user with `app_metadata.role` set to `teacher` or `admin`, or an email listed in the server-only `QAZAQDOS_TEACHER_EMAILS`, can read that queue and approve a correction.

Approved corrections are stored in `qd_dossha_knowledge`. Before generating a reply, the server ranks active corrections by overlap with the current question and supplies at most three matching answers as teacher-verified context. Raw learner messages and AI replies never become verified knowledge automatically. Teacher access and knowledge writes use `SUPABASE_SECRET_KEY` only on the server.
