# Qazaq Literary Intelligence Layer

The existing Dosha and Vision endpoints are extended; the application, learning state, authentication and Q-Level are preserved. No external books have been scraped, downloaded, or silently licensed. The shipped corpus contains 10 original QazaqDos educational texts, six literature-based lessons and 28 detailed lexical/phrase entries, plus the existing Vision catalog. They are labelled original educational examples, not quotations by literary authors.

## Setup

1. Apply existing learning/Q-Level migrations, then `202610050014_literary_intelligence.sql`.
2. Apply `202610050015_kazakh_vectors.sql` in Supabase with pgvector available. It uses 768-dimensional vectors and an HNSW cosine index. The metadata/progress migration is separate so the approved lexical fallback remains usable without a vector deployment.
3. Configure the existing server-only Supabase key and local Ollama settings. For semantic retrieval, set `QAZAQDOS_EMBEDDING_MODEL` to an installed embedding model that supports 768-dimensional output (for example, `embeddinggemma`). No synthetic/random vectors are stored.
4. Authorize curators through `app_metadata.role = admin` or `corpus_editor`, or the server-only `QAZAQDOS_CORPUS_ADMIN_EMAILS` allowlist. Client-editable `user_metadata` never grants corpus administration.
5. Open `/admin/kazakh-corpus`, add the shipped texts or upload UTF-8 TXT material, review rights evidence and language/age quality, approve, then rebuild embeddings for each source. Existing sources are not overwritten by seeding.
6. Open `/learn/literature`, `/learn/vocabulary` and `/learn/writing-coach`. Account-free demo mode is available through `?demo=1` after the existing onboarding flow.

## Retrieval and generation

Dosha reads the authenticated user's Q-Level; XP is not used as language proficiency. Missing diagnostics default conservatively to A1. Style selection is level-aware and supports simple, daily, academic, literary, formal, friendly and storytelling modes. Verified age metadata may request adult material; otherwise retrieval is school-safe.

A query is embedded through Ollama's `/api/embed` and matched through `match_kazakh_chunks`, which filters approved sources, rights metadata, source revision, embedding model, level, age and quality. At most six fragments enter a response (SQL also caps at eight). If embeddings are unavailable, retrieval uses approved lexical matches. Unrelated questions produce no fake literary quote. Shipped patterns are immutable in memory; database sources and retirement tombstones are rechecked every request so approval revocation is not cached. Database read failures fail closed for corpus retrieval.

Editing/rejecting a source deletes old chunks and embeddings atomically; rebuilding uses a revision guard. Retiring shipped sources retains a tombstone to prevent the local fallback from resurrecting them. Approval and editing are audited. Ordinary users cannot read drafts, adult-only corpus records, raw embeddings or audit records, or write corpus data.

Existing `/api/dosha/chat` and `/api/dosha/vision` aliases still work. Dosha generation receives rights-labelled excerpts and explicit instructions to treat corpus/user text as data, not commands, and never invent attribution. The quality gate performs one bounded retry when its checks find issues. Existing grammar/dictionary/reference features remain available if live AI is not configured.

Vision preserves object identity and confidence while enriching explanations by Q-Level. Dombyra/baursak examples use curated cultural language; known words provide original examples and manually authored inflections. Unknown word morphology is not fabricated. Images are handled through the original image-validation and rate-limit paths, not stored in the corpus or personal vocabulary.

## Learning and coaching

Literature lessons include word highlighting, short/complete/example explanations, main idea, grammar, expression/style analysis, character speech, comprehension questions and an original writing task. The server awards 20 XP once, after both comprehension answers and a saved response of at least three words. Writing completion is not a proficiency assessment.

Personal vocabulary supports new/learning/mastered states. Recall is checked against the canonical word, rather than a self-reported "mastered" checkbox. Correct recalls schedule 1, 3, 7, 14 and 30 days; incorrect recalls reset the streak and become due after ten minutes. Four successful spaced recalls mark a word mastered. Saving/random clicking earns no XP. Progress badges depend on learning milestones.

Words can be saved from Dosha messages, Vision and literature. Shared word cards provide curated base form, meaning, examples, synonyms/related words, antonyms where appropriate, reviewed inflections and a pronunciation action. Three-example and speaking-practice actions are available from Dosha word cards. The dashboard includes a daily expression, and Qazaq Passport includes real saved/mastered word, phrase, literary-text and writing-naturalness history counts; sample totals are never presented as user progress.

The writing/speaking/style coach shows original and suggested text side by side with explicit change explanations. Live mode uses the existing local model, approved retrieval and a bounded retry; reference mode only applies known corrections and a small explicit style example. Unknown text is preserved with a clear notice that no complete grammar assessment occurred. Browser speech-to-text is optional, user-triggered and depends on browser support; its provider may process audio. The app analyzes the transcript, not pronunciation.

## Accuracy and limitations

Language-quality scores are transparent heuristic signals for sentence length, known calques, repetition, register and basic text patterns. They are not a full Kazakh morphological parser, factuality guarantee, human literary review or validated proficiency score. They do not change Q-Level. Source quality scores are curator inputs; rights evidence must be checked by the administrator rather than inferred from file length. This initial implementation improves prompts, retrieval and feedback without claiming a measured improvement in a deployed model.

The 768-dimensional vector migration and real Ollama inference need verification in the configured remote environment; no production database migration, model installation, embedding rebuild or deployment was performed here. Metadata/RLS, optimistic revisions and atomic rewards are tested in local PostgreSQL-compatible PGlite; live-model/embedding boundaries have mocked transport tests. Desktop/mobile browser tests cover vocabulary/lessons/coaching/admin denial and preserve Q-Level/Vision flows.

The previously blank friendships migration was restored from the repository version so fresh databases create `qd_friend_profiles` and the related friendship tables. If a deployed database already recorded the blank migration as applied, run the restored SQL once in the Supabase SQL Editor to create the missing tables; do not reset production data.

Implementation references: [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector), [Ollama embedding API](https://github.com/ollama/ollama/blob/main/docs/capabilities/embeddings.mdx).
