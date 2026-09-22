# Doszhan + Ollama

Doszhan and Doszhan Vision run through the Next.js backend. The browser never calls
Ollama directly. Requests require a signed-in QazaqDos account, same-origin
validation, bounded bodies, and server-side rate limits.

## Architecture

- `POST /api/dosha/chat` is the chat route; `/api/ai-friend` stays compatible.
- `POST /api/dosha/vision` is the image route; `/api/vision` stays compatible.
- `lib/dosha/prompt.ts` contains the separate teaching prompt.
- `lib/dosha/knowledge.ts` indexes lessons, regions, history, literature,
  national games, Vision vocabulary, and reviewed robotics terms in memory.
- Retrieval sends at most six matching excerpts. Signed-in learning progress and
  bounded conversation history are added separately.
- Known Vision catalog entries remain authoritative. Malformed model JSON
  becomes an `uncertain` result instead of breaking the page.

## Local setup

```bash
ollama serve
ollama pull gemma3:4b
curl http://127.0.0.1:11434/api/tags
```

Configure `.env.local`:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_VISION_MODEL=gemma3:4b
```

```bash
npm install
npm run dev
```

## Production commands

Keep port `11434` private and bound to loopback. On Linux with systemd:

```bash
sudo systemctl enable --now ollama
ollama pull gemma3:4b
curl http://127.0.0.1:11434/api/tags
cd /var/www/qazaqdos
npm ci
npm run build
pm2 restart qazaqdos --update-env
pm2 logs qazaqdos --lines 100
```

Do not expose Ollama through Nginx or the public firewall. If a configured model
cannot be reached, the API returns a clear temporary-unavailable error.

## Verification

```bash
npm run typecheck
npm test
npm run build
curl http://127.0.0.1:11434/api/tags
```

The API routes require a valid session, so test chat and camera/upload flows from
`/student/friend` and `/learn/vision` after signing in.
