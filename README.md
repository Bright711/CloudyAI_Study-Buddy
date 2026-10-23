# CloudyAI Study Buddy

CloudyAI is an AZ-900 study assistant prototype. The active app is a Next.js/React frontend connected to the existing Supabase-backed API for account status, approved question retrieval, quiz session creation, and answer submission.

## Architecture today

```text
backend/src/app/ (active Next.js App Router + React UI)
  ├─ /                 account-aware overview and approved-question count
  ├─ /practice         authenticated quiz flow using existing API routes
  └─ /auth             Supabase sign-in/sign-up
       └─ same-origin API requests → Next.js handlers → Supabase

backend/ (Next.js App Router + TypeScript + Tailwind CSS 4)
  ├─ src/app/api/             existing API route handlers
  ├─ src/lib/supabase/        browser, cookie-authenticated server, and admin clients
  ├─ src/lib/misconceptions/  repeated-pattern detection logic
  └─ supabase/schema.sql      initial PostgreSQL schema; no migration history yet

prompts/tutor-prompt.ts       prompt text, not connected to a model provider
```

The active Next.js project is in `backend/`. The unconnected static HTML demo and root mock tutor handler have been removed; their hardcoded data was not part of the active backend or persisted learner experience.

## Local development

Requirements: Node.js compatible with the Next.js version in `backend/package.json`, npm, and a Supabase project for authenticated/database-backed routes.

1. Install the locked dependencies:

   ```powershell
   cd backend
   npm ci
   ```

2. Copy `backend/.env.example` to `backend/.env.local` and replace the placeholders with credentials for a **development** Supabase project.
3. Reconcile the development database with `backend/supabase/schema.sql` before using database-backed routes. The file is an initial schema, not a versioned or drift-safe migration. Do not apply it blindly to a shared or production database.
4. Start the app:

   ```powershell
   npm run dev
   ```

## Environment variables

| Variable | Used by | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser and cookie-authenticated server client | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser and cookie-authenticated server client | Public/publishable key |
| `SUPABASE_URL` | privileged server client and question importer | Server only |
| `SUPABASE_SECRET_KEY` | privileged server client and question importer | **Server-only secret; never use a `NEXT_PUBLIC_` prefix** |

Keep real values in ignored local environment files or the deployment platform's secret store. A historical `api/.env.local` file was tracked in Git; untracking it does not remove it from earlier commits. Check whether it contained live credentials, rotate any exposed credentials, and review repository history before publishing or deploying.

## Database and question data

- The database is Supabase PostgreSQL.
- `backend/supabase/schema.sql` defines questions, options, quiz sessions, answer attempts, misconception evidence, indexes, and enables RLS.
- No versioned migrations or migration history are present in this repository. The remote schema and migration state have not been inspected.
- RLS policies are not defined in the checked-in schema. The application currently uses a server-side Supabase secret for database routes, which bypasses RLS; do not expose that client or key.
- `backend/supabase/import-questions.mjs` upserts the local question bank and requires server-only Supabase credentials. Use only against a disposable/development project until migration and seed safety have been reviewed.
- The repository also contains question-bank JSON under `backend/` and `data/`; confirm which copy is authoritative before editing either.

Do not seed or run schema changes against production without an authorized review, a known migration baseline, and a verified backup/recovery plan.

## Current functionality and limitations

- `GET /api/questions` returns approved question content from Supabase. It is currently unauthenticated and has no pagination/limit.
- `GET /api/auth/me` checks the Supabase cookie-authenticated user.
- `POST /api/quiz/session` creates a session for the authenticated user.
- `POST /api/quiz/submit` checks session ownership, calculates correctness server-side, and records an answer attempt and selected-distractor evidence.
- `/practice` fetches approved questions, starts an authenticated session, submits selected answers, and summarizes only server-confirmed responses in the current browser session.
- `/` checks account status and shows the real approved-question count when the question service is available.
- `/auth` preserves Supabase sign-in/sign-up, with a responsive React UI.
- Quiz completion/history retrieval and persisted frontend progress are not implemented.
- The repeated-pattern engine exists but is not called from the submission route.
- No AI tutoring route or model SDK/provider integration is configured. The prompt file is not connected to a model.
- Learning history, Radar retrieval, and AI Tutor are not presented as working features because no retrieval/tutor API exists.
- There are no automated tests or CI workflows checked in.

These endpoints and limitations are a point-in-time description; see [AUDIT.md](./AUDIT.md) for evidence, prioritized follow-up, and verification criteria.

## Quality checks

Run from `backend/`:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

There is no test script or automated test suite yet. Database tests require an isolated Supabase project; do not use production data for test cases.

## Deployment and operations

No deployment configuration or CI/CD workflow is checked in. Before deployment, configure the four environment variables in the hosting provider, verify the target database schema/RLS policies and migration history, and test authentication and ownership checks against an isolated staging project. The project has not been deployed or verified against development, staging, or production databases as part of this audit.

## Team handover

Prioritize secret rotation/history review, a reconciled versioned migration baseline and least-privilege RLS policies, transaction-safe quiz/evidence writes, idempotent submissions, and tests for authorization and data integrity. Then add backend-supported history/Radar/AI contracts before exposing those features in the UI. Do not represent sample content or browser-only state as saved learning progress.
