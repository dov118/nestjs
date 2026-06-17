# CLAUDE.md

Entry point for Claude Code on this repository. Keep this file light — it is
loaded into context on every interaction. Detailed rules live in `docs/` and are
read on demand.

## Project

NestJS 11 service template (TypeScript, Node 24) shipping infrastructure only:
TypeORM (MySQL in prod, SQLite in CI/local), Winston logger, Socket.IO gateway,
`@nestjs/schedule`. Containerised via Dockerfile; CD pushes to a Harbor registry
and rolls out on K3s. No business module yet — features land as NestJS modules
under `src/`.

## Tech stack

| Layer               | Choice                                   |
| ------------------- | ---------------------------------------- |
| Language            | TypeScript 5, Node 24                    |
| Framework           | NestJS 11                                |
| Database (prod)     | MySQL 8 via TypeORM                      |
| Database (CI/local) | SQLite via TypeORM                       |
| Migrations          | TypeORM CLI (`migration:run`)            |
| Tests               | Jest (unit + e2e), `--runInBand`         |
| Logging             | Winston + Morgan (HTTP)                  |
| Events / realtime   | Socket.IO gateway (`@nestjs/websockets`) |
| Scheduling          | `@nestjs/schedule` (cron decorators)     |
| Linting / format    | ESLint + Prettier                        |
| Container           | Docker (multi-stage)                     |
| Registry / deploy   | Harbor → K3s                             |

## Commands

```bash
npm run start:dev                            # Dev server, watch
npm run build                                # Compile to dist/
npm run lint                                 # ESLint (use lint:fix to auto-fix)
npm run test                                 # Unit + e2e, --runInBand
npm run test:cov                             # Same, with coverage → lcov.info
npx jest path/to/file.spec.ts --runInBand    # Single test
npm run migration:run                        # Run migrations (needs prior build)
```

Tests always run `--runInBand` (shared SQLite/sockets). Migrations are
imported statically in `src/config/typeorm.config.ts`; `migration:run` still
needs a prior `build` because the CLI loads `./dist/config/typeorm.config.js`.
No seed script yet.

## Structure

```
src/main.ts            Bootstrap: NestFactory + WinstonService + Morgan
src/app.module.ts      Root module: TypeORM + ScheduleModule + Winston
src/config/            typeorm.config.ts (mysql|sqlite switch), winston-config.ts
src/service/           Cross-cutting providers (currently WinstonService)
src/database/          SQLite dev file, migrations/, data/, seeds/ (to come)
test/                  Jest e2e config + fixtures
docs/                  Conventions — read on demand
```

## How to work here

Before writing or changing code, read the relevant `docs/` file below. Do not
infer conventions from a single file — the documented rules win over local
patterns, and when they conflict, flag it rather than guessing.

## Non-negotiables

The hard rules, in brief. Full detail in `docs/coding-conventions.md`.

- Develop test-first: Red-Green-Refactor. A commit only ever captures a
  completed, green cycle (the `pre-commit` hook runs the full suite).
- Quality gate after every code touch AND before every commit:
  `npm run format && npm run lint && npm run build && npm run test` on the
  **full codebase**, not just the diff. Don't hand back until all four are
  green.
- Read env vars via `getEnv(name, defaultValue?)` / `getEnvNumber(name, defaultValue?)`
  (`src/config/env.ts`), never via `process.env.X` directly. Defaults OK on
  local-safe vars; secrets and host keys stay defaultless so missing-key
  still throws at boot.
- Every root-composed NestJS module ships a smoke spec that
  `compile()` + `init()` + `close()` without throwing, with no overridden
  providers — catches import-time regressions.
- Zero `any`. Explicit return types everywhere, including inline callbacks.
- ESLint and Prettier are law: everything is `error`, never `warn`. Never
  disable a rule globally.
- One class = one file = one responsibility. No barrel files. Data is separated
  from logic.
- English everywhere (code, comments, commits, README). Commit subject
  `Related <branch>`, body = one line describing the change.

## Documentation index

Read the file that matches the task. Each is self-contained.

| File                         | Read it when…                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/coding-conventions.md` | Writing or reviewing any code — style, typing, naming, architecture, tests, git, persistence, errors, async, security. The default reference. |
