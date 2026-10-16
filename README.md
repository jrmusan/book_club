# Book Club

A production-ready web app for organizing book clubs — vote on books, plan meetings, rate reads, and stack-rank favorites.

## Tech stack

- **Next.js 15** (App Router, React Server Components)
- **React 19** + TypeScript 5
- **Auth.js v5** (Credentials: email/username/password)
- **Prisma 5** + PostgreSQL
- **Zod** validation
- **Turbopack** for local dev
- **Vercel** for production hosting (Neon Postgres recommended)

## Local development

### Prerequisites

- Node.js 22+
- Docker (for local Postgres)

### Setup

```bash
# Clone and install
npm install

# Start Postgres
docker compose up -d

# Environment
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma migrate dev

# Optional: seed demo data
npm run db:seed

# Start dev server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Club owner |
| bob@example.com | password123 | Member |

## Deploy to Vercel

1. Create a free [Neon](https://neon.tech) Postgres project (already done for this repo via `neon init` / `neon deploy`).
2. Locally, env vars are pulled into `.env` by the Neon CLI:
   - `DATABASE_URL` — pooled (`-pooler`) for the app
   - `DATABASE_URL_UNPOOLED` — direct, for `prisma migrate`
3. Push this repo to GitHub and [import the project in Vercel](https://vercel.com/new).
4. In Vercel → **Settings → Environment Variables**, set the same Neon keys (copy from `.env` or run `neon env pull`), plus:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** URL |
| `DATABASE_URL_UNPOOLED` | Neon **direct** URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_URL` | `https://your-app.vercel.app` (or your custom domain) |
| `NEXTAUTH_URL` | same as `AUTH_URL` |
| `GOOGLE_BOOKS_API_KEY` | optional |

5. Deploy. The build script runs `prisma migrate deploy` then `next build`.
6. Optionally seed: `npm run db:seed`

### Notes

- Prefer Neon’s **pooled** URL for app traffic. Migrations use `DATABASE_URL_UNPOOLED`.
- Keep Auth.js (do not replace with Neon Auth unless you ask to migrate login).
- `Dockerfile` / `render.yaml` remain for optional Docker/Render; Vercel ignores them.

## Features

- **Multi-club support** — create clubs, invite members by email (share a link or open your mail app)
- **Book polls** — search Google Books / Open Library, add covers & descriptions, vote
- **Meeting polls** — vote on when/where to meet, confirm the winner
- **In-app notifications** — members notified when polls open or meetings are scheduled
- **Ratings & reviews** — rate books 1–5 with optional review text
- **Stack rankings** — drag-and-drop your favorite reads; club-wide aggregate view

## Project structure

```
src/
  app/           # Next.js App Router pages
  actions/       # Server Actions
  auth.ts        # Auth.js (Credentials + Prisma)
  auth.config.ts # Edge-safe middleware config
  components/    # UI components
  lib/           # DB, books API, validations, access control
prisma/          # Schema, migrations, seed
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Migrate + production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## License

MIT
