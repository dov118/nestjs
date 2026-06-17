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

Tests always run `--runInBand` (shared SQLite/sockets). Migrations are loaded
from `dist/database/migrations/*.js`, so build first. No seed script yet.

## Structure

```
src/main.ts            Bootstrap: NestFactory + WinstonService + Morgan
src/app.module.ts      Root module: TypeORM + ScheduleModule + Winston
src/config/            typeorm.config.ts (mysql|sqlite switch), winston-config.ts
src/service/           Cross-cutting providers (currently WinstonService)
src/database/          SQLite dev file, migrations/, data/, seeds/ (to come)
test/                  Jest e2e config + fixtures
docs/                  Conventions, architecture — read on demand
```

## How to work here

Before writing or changing code, read the relevant `docs/` file below. Do not
infer conventions from a single file — the documented rules win over local
patterns, and when they conflict, flag it rather than guessing.

## Non-negotiables

The hard rules, in brief. Full detail in `docs/coding-conventions.md`.

- Develop test-first: Red-Green-Refactor. A commit only ever captures a
  completed, green cycle (the `pre-commit` hook runs the full suite).
- Zero `any`. Explicit return types everywhere, including inline callbacks.
- ESLint and Prettier are law: everything is `error`, never `warn`. Never
  disable a rule globally.
- One class = one file = one responsibility. No barrel files. Data is separated
  from logic.
- English everywhere (code, comments, commits, README). Commit subject
  `Related <branch>`, body = one line describing the change.

## Documentation index

Read the file that matches the task. Each is self-contained.

| File | Read it when… |
|------|---------------|
| `docs/coding-conventions.md` | Writing or reviewing any code — style, typing, naming, architecture, tests, git, persistence, errors, async, security. The default reference. |
| `docs/architecture.md` | Touching bootstrap, the TypeORM config, the logger wiring, env vars, the Docker entrypoint, or the CI/CD pipeline. The "why" behind the infrastructure. |
