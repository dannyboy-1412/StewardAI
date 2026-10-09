# PenPal AI

AI-first document editor. Prompt the agent to create and transform documents; edit the result like a normal doc.

## Stack

- **Web:** Next.js + Tiptap + Yjs — deploy on Vercel
- **API:** NestJS + Hocuspocus — deploy on Azure Container Apps
- **Data:** Supabase Postgres + Storage
- **Auth:** Supabase Auth (email/password + Google)
- **AI:** Vercel AI SDK + OpenRouter

## Local development

```bash
corepack enable
pnpm install
cp .env.example .env
# Copy web vars into apps/web/.env.local and API vars into apps/api/.env
pnpm db:migrate
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/health
- Collab websocket: `ws://localhost:4000/collab`

Without `DATABASE_URL` the API uses an in-memory store. Without `OPENROUTER_API_KEY` AI runs apply a local demo operation so the editor loop still works.

Users are created in `public.users` on first authenticated API request. `pnpm db:seed` is a no-op.

## Auth (Supabase)

1. In the Supabase dashboard, enable the **Email** and **Google** providers.
2. For Google, create an OAuth client in the [Google Auth Platform](https://console.cloud.google.com/auth/clients) and set the callback to `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Google's consent screen shows `<project-ref>.supabase.co` until branding is set. In [Branding](https://console.cloud.google.com/auth/branding), set the app name to **PenPal AI** (logo and home page optional). Google may keep showing the Supabase host until the brand is verified, which can take a few business days. A [custom domain](https://supabase.com/docs/guides/platform/custom-domains) on the Auth endpoint (`auth.your-domain`) is the other way to replace `.supabase.co`.
4. Auth URL config:
   - Site URL: `http://localhost:3000`
   - Redirect allow-list: `http://localhost:3000/auth/callback` plus your production origin (`https://your-domain/auth/callback`)
5. Confirm the project uses **asymmetric JWT signing keys** (default for new projects) so the API can verify access tokens via JWKS. If the project still uses a shared secret, switch it under JWT Signing Keys.
6. Set `NEXT_PUBLIC_SUPABASE_URL` to `https://<project-ref>.supabase.co` (no `/rest/v1` suffix) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the publishable key. The API uses the same project URL as `SUPABASE_URL`.

## Database (Supabase)

Use the **session pooler** connection string on Azure (IPv4). Run [`packages/database/drizzle/0000_init.sql`](packages/database/drizzle/0000_init.sql) in the SQL editor for a new database, then:

```bash
pnpm db:migrate
```

Public tables have RLS enabled with no policies. The Nest API connects as the database role (which bypasses RLS). The publishable key cannot read rows through the Data API.

## Tests

```bash
pnpm --filter @docai/document test
pnpm --filter @docai/web test:e2e
```

Authenticated Playwright tests need `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in `apps/web/.env.local`.

## Deploy

**Vercel (web):** set the project root to `apps/web`. Env:

- `NEXT_PUBLIC_API_URL` — `https://api.your-domain`
- `NEXT_PUBLIC_COLLAB_URL` — `wss://api.your-domain/collab`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Azure (API):** build [`apps/api/Dockerfile`](apps/api/Dockerfile) and run one replica of the Container App (WebSockets on, no scale-to-zero). See [`.github/workflows/deploy-api.yml`](.github/workflows/deploy-api.yml). Env:

- `DATABASE_URL` — Supabase session pooler
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`
- `WEB_ORIGINS` — Vercel production and preview URLs
- `OPENAI_API_KEY` or `GROQ_API_KEY` for voice
