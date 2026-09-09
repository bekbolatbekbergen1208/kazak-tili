# Досшамен чат

Available at `/student/friend` and `/learn/friend`, with a link in the learning navigation. Users can ask free-form Kazakh language, literature, translation, grammar and writing questions; the chat carries the most recent 20 messages (maximum 24,000 characters) as context. Replies use plain text. Users can choose Kazakh, Russian, English, Chinese, Spanish, German or French as the explanation language. The existing small dictionary and browser microphone input remain available.

## Enable live answers

Set server-only `OPENAI_API_KEY` and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`) in `.env.local` on the deployed server, then restart Next.js/PM2 with the updated environment. Never prefix either secret with `NEXT_PUBLIC_`. Real AI requests require a signed-in Supabase account. Guests and deployments without an OpenAI key use an explicitly labelled Kazakh reference mode covering grammar topics and the 15 original study guides. Reference mode cannot translate arbitrary text or answer every question and says so rather than pretending a canned answer is an AI response. A provider failure in live mode is surfaced for retry, not hidden behind a canned success.

Implementation follows the [OpenAI Responses API](https://developers.openai.com/api/reference/responses/create). The request uses `store: false`, a 30-second timeout, bounded conversation context and an output token limit. No browser receives the API key. Model instructions ask for direct explanations, examples, correction of errors, context-aware follow-ups and explicit uncertainty. They cannot guarantee every response is accurate.

## Save conversations

Apply `supabase/migrations/202609090009_friend_chat.sql` using Supabase SQL Editor. RLS isolates each user's `qd_friend_conversations` row. Unlike the reward state, a chat can be saved with the user's own authenticated Supabase client; a service-role key is not necessary for this table. Only the latest 20 messages are retained. Without the migration or an account, the interface states that chat history is only available on the current page. Messages are not mixed into the XP ledger.

This migration and migration 008 for the books friends league are included locally; they have not automatically been applied to the remote database. The local environment currently has no OpenAI key, so only reference mode and mocked provider-contract tests can be verified until a key is supplied.

The API accepts at most 2,000 characters per user message and only user/assistant roles in context. It checks request origin and limits signed-in users to one active generation, 12 messages/minute and 100/hour. The rate-limit map is process-local, appropriate to the current single PM2 process; replace it with shared storage before running multiple instances. Chat data is sent to OpenAI only in authenticated AI mode. Concurrent browser tabs use last-write-wins chat history; this does not affect learning rewards.

Tests: `tests/friend.test.ts` (request validation, bounded context, reference answers, mocked Responses contract and failures), `tests/sql.test.ts` (user isolation), and `tests/browser/friend.spec.ts` (real reference endpoint and mocked live-response/retry UI).
