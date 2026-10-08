# Writee

AI-first document editor. Prompt the agent to create and transform documents; edit the result like a normal doc.

## Stack

- **Web:** Next.js + Tiptap + Yjs — deploy on Vercel
- **API:** NestJS + Hocuspocus — deploy on Azure Container Apps
- **Data:** Supabase Postgres + Storage
- **AI:** Vercel AI SDK + OpenRouter

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/health
- Collab websocket: `ws://localhost:4000/collab`

Without `DATABASE_URL` the API uses an in-memory store. Without `OPENROUTER_API_KEY` AI runs apply a local demo operation so the editor loop still works.

## Database (Supabase)

Use the **session pooler** connection string on Azure (IPv4). Run [`packages/database/drizzle/0000_init.sql`](packages/database/drizzle/0000_init.sql) in the SQL editor, then:

```bash
pnpm db:seed
```

## Tests

```bash
pnpm --filter @docai/document test
pnpm --filter @docai/web test:e2e
```

## Deploy

**Vercel (web):** set the project root to `apps/web`. Env:

- `NEXT_PUBLIC_API_URL` — `https://api.your-domain`
- `NEXT_PUBLIC_COLLAB_URL` — `wss://api.your-domain/collab`

**Azure (API):** build [`apps/api/Dockerfile`](apps/api/Dockerfile) and run one replica of the Container App (WebSockets on, no scale-to-zero). See [`.github/workflows/deploy-api.yml`](.github/workflows/deploy-api.yml). Env:

- `DATABASE_URL` — Supabase session pooler
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`
- `WEB_ORIGINS` — Vercel production and preview URLs
- `OPENAI_API_KEY` or `GROQ_API_KEY` for voice
