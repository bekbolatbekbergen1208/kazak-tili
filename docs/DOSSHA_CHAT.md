# Досшамен чат

Available at `/student/friend` and `/learn/friend`, with a link in the learning navigation. Paid live AI is disabled. The chat uses the local Kazakh reference catalog and carries the most recent 20 messages (maximum 24,000 characters) as context for local follow-ups. Replies use plain text. Users can choose Kazakh, Russian, English, Chinese, Spanish, German or French in the UI, but the finite reference answers are primarily Kazakh. The existing small dictionary and browser microphone input remain available.

The reference catalog now includes participles, converbs, infinitives, voice, moods, negation, interjections, sentence members, compound sentences, direct address, parenthetical words and spelling topics. Retrieval ranks specific phrases first and includes multiple matching topics for comparison requests. This is a finite, Kazakh-only local mode, not an all-knowing model. No web search tool is enabled: current news/prices/weather must not be presented as verified.

## Paid AI Status

Do not set up a paid provider for this chat. `requestDossha` is disabled and throws `AI_DISABLED`, and `/api/ai-friend` always returns `mode: "reference"`. Reference mode cannot translate arbitrary text or answer every question and says so rather than pretending a canned answer is an AI response.

## Save conversations

Apply `supabase/migrations/202609090009_friend_chat.sql` using Supabase SQL Editor. RLS isolates each user's `qd_friend_conversations` row. Unlike the reward state, a chat can be saved with the user's own authenticated Supabase client; a service-role key is not necessary for this table. Only the latest 20 messages are retained. Without the migration or an account, the interface states that chat history is only available on the current page. Messages are not mixed into the XP ledger.

This migration and migration 008 for the books friends league are included locally; they have not automatically been applied to the remote database.

The API accepts at most 2,000 characters per user message and only user/assistant roles in context. It checks request origin and limits signed-in users to one active response, 12 messages/minute and 100/hour. The rate-limit map is process-local, appropriate to the current single PM2 process; replace it with shared storage before running multiple instances. Chat data is not sent to a paid AI provider. Concurrent browser tabs use last-write-wins chat history; this does not affect learning rewards.

Tests: `tests/friend.test.ts` (request validation, bounded context, reference answers and disabled paid provider), `tests/sql.test.ts` (user isolation), and `tests/browser/friend.spec.ts` (reference endpoint UI).
