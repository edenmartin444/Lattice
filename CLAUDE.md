# Lattice — Knowledge Graph

## Project Overview
Lattice is a personal knowledge graph augmented by AI. Users capture concepts from any discipline and AI reveals cross-disciplinary connections between them. Inspired by Charlie Munger's mental models lattice.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL + pgvector (hosted on Supabase)
- **ORM**: Prisma 7 (with driver adapter @prisma/adapter-pg)
- **Auth**: Auth.js v5 (next-auth@beta) with JWT strategy
- **Styling**: Tailwind CSS v4 + shadcn/ui (manually installed components)
- **Visualization**: react-force-graph (planned Phase 2)
- **AI**: Claude API + OpenAI API (switchable, planned Phase 3)

## Architecture
- `src/app/(auth)/` — Login/register pages
- `src/app/(dashboard)/` — Main app layout with sidebar
- `src/app/api/` — API routes (concepts CRUD, auth)
- `src/components/` — React components (ui/, concepts/, layout/)
- `src/lib/` — Shared logic (db, auth, api-utils)
- `src/types/` — Shared TypeScript types + Zod schemas
- `prisma/schema.prisma` — Database schema (8 models)

## Key Decisions
- Prisma v7 requires driver adapter (`@prisma/adapter-pg`) — PrismaClient no longer reads DATABASE_URL directly
- Prisma client generated to `src/generated/prisma/` (gitignored, regenerate with `npx prisma generate`)
- Middleware uses cookie check (not auth() import) due to Edge Runtime incompatibility with Prisma v7
- shadcn/ui components were installed manually (CLI fails on this Windows/nvm4w environment)
- Dark mode by default (class strategy on html tag)

## Commands
- `node node_modules/next/dist/bin/next dev` — Start dev server (npx has PATH issues on this Windows setup)
- `node node_modules/next/dist/bin/next build` — Build for production
- `node node_modules/prisma/build/index.js db push` — Sync schema to DB
- `node node_modules/prisma/build/index.js generate` — Regenerate Prisma client
- `node node_modules/prisma/build/index.js studio` — Open Prisma Studio

## Rules for Agents (Worktree Work)
- **DO NOT** modify `prisma/schema.prisma`, `src/types/index.ts`, or shared config files unless explicitly instructed
- **DO NOT** modify files outside your assigned scope (see branch-specific instructions)
- **DO** run `node node_modules/next/dist/bin/next build` before finishing to verify no TypeScript errors
- **DO** use existing shadcn/ui components from `src/components/ui/` — do not reinstall them
- **DO** follow existing code patterns (API route structure, component patterns, etc.)

## Domain Color Palette
```typescript
const DOMAIN_COLORS: Record<string, string> = {
  science: "#3B82F6", philosophy: "#8B5CF6", history: "#F59E0B",
  economics: "#10B981", psychology: "#EC4899", technology: "#06B6D4",
  politics: "#EF4444", art: "#F97316", mathematics: "#6366F1", other: "#6B7280",
};
```
