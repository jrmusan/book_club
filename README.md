# Book Club

A production-ready web app for organizing book clubs — vote on books, plan meetings, rate reads, and stack-rank favorites.

## Tech stack

- **Next.js 15** (App Router, React Server Components)
- **React 19** + TypeScript 5
- **Auth.js v5** (Credentials: email/username/password)
- **Prisma 5** + PostgreSQL
- **Zod 3** validation
- **Node.js 22** (Docker)
- **Turbopack** for local dev

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

## Deploy to Render

1. Push this repo to GitHub.
2. In Render, create a **Blueprint** from `render.yaml`, or:
   - Create a **PostgreSQL** database
   - Create a **Web Service** using the Docker runtime pointing at this repo
3. Environment variables (most are set automatically by `render.yaml`):
   - `DATABASE_URL` — from Render Postgres (append `?connection_limit=5` if needed)
   - `AUTH_SECRET` — auto-generated
   - `AUTH_TRUST_HOST` — `true` (required behind Render's proxy)
   - `AUTH_URL` / `NEXTAUTH_URL` — auto-set from `RENDER_EXTERNAL_URL`
   - `GOOGLE_BOOKS_API_KEY` — optional, for higher Google Books API limits
4. Deploy. Database migrations run automatically on container startup (Render free tier does not support pre-deploy commands).

### Docker (manual)

```bash
docker build -t book-club .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="..." \
  -e AUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  book-club
```

## Features

- **Multi-club support** — create clubs, invite members by email
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
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## License

MIT
