# Architecture

This document explains the infrastructure wiring of the template — the parts
that span multiple files and would otherwise need to be reconstructed by
reading.

## Bootstrap (`src/main.ts`)

`bootstrap()` creates the Nest app with `WinstonService` passed as the
app-level logger (replacing the default NestJS logger globally), mounts Morgan
for HTTP access logs in `combined` format, enables shutdown hooks, and listens
on `APP_PORT`. `dotenv` is loaded at module top so `process.env.APP_PORT` is
available before `NestFactory.create` runs.

No `setGlobalPrefix` is set — intentional, since this template targets internal
services. Add one (and an `APP_PREFIX` env var) only if a fork is exposed to a
consumer outside your control. See `docs/coding-conventions.md` §6 and §14.

## Logger (`src/service/winston/`, `src/config/winston-config.ts`)

`winston-config.ts` builds a Winston logger instance with a custom
`printf` format (ANSI-coloured, NestJS-style: timestamp, PID, level, context,
message). `WinstonService` is a thin `LoggerService` adapter exposing
`log`/`error`/`warn`/`debug`/`verbose`/`fatal` — it is declared as a provider in
`AppModule` AND passed to `NestFactory.create({ logger })` so every Nest
internal log goes through Winston.

## Database (`src/config/typeorm.config.ts`)

The config exposes the same `DataSourceOptions` for two scenarios:

- **MySQL** (production / staging) — driven by `DB_HOST`/`DB_PORT`/credentials.
- **SQLite** (CI and local dev) — file path in `DB_NAME`
  (e.g. `src/database/dev`).

`DB_TYPE` selects between the two at runtime. `synchronize: false` is locked
on — schema is owned by migrations only. The exported `dataSource` instance is
what TypeORM CLI consumes for `migration:run`, which is why the build must run
first: migrations are read from `dist/database/migrations/*.js`, not from
sources.

## Scheduled tasks & WebSockets

`ScheduleModule.forRoot()` is registered in `AppModule`; add `@Cron`,
`@Interval`, or `@Timeout` decorators on services as needed. `@nestjs/websockets`
and `socket.io` are installed but no gateway is wired yet.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | Environment name (`production`, `testing`, …) |
| `APP_NAME` | Used in the Winston log prefix |
| `APP_PORT` | HTTP listen port |
| `DB_TYPE` | `mysql` or `sqlite` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | MySQL connection (empty for SQLite) |
| `DB_NAME` | DB name (MySQL) or file path (SQLite) |
| `DB_DEBUG` | `true` to enable TypeORM query logging |

`.env` is gitignored; `.env.example` holds `__VAR__` placeholders. In
containers, `start.sh` substitutes them from the container env at startup,
runs `migration:run`, then `start:prod`.

## CI/CD

- **CI** (`.github/workflows/CI.yaml`) — runs on every branch. Sequence:
  `npm ci --ignore-scripts` (with `npm rebuild sqlite3`) → write `.env` with
  SQLite values → `build` → `lint` → `migration:run` → `test:cov` → SonarCloud
  scan. SonarCloud excludes `test/**` and `src/database/**`.
- **CD** (`.github/workflows/CD.yaml`) — triggers on `release/*` branches
  (excluding merges from `main`). Reads the version from `package.json`, skips
  if the tag already exists, otherwise builds a Docker image, pushes it to a
  Harbor registry, and tags the commit with the version.
- **RELEASE** (`.github/workflows/RELEASE.yaml`) — triggers when a `release/*`
  PR is merged into `preprod`. Uses `kubectl set image` + `rollout restart` on
  a K3s deployment, then notifies Discord on success or failure.

## Docker

`Dockerfile` is a single-stage Node 24 Alpine image, timezone `Europe/Paris`,
running as the unprotected `node` user with `cap_net_bind_service` granted so
the process can bind low ports if needed. The entrypoint is `start.sh`, which
resolves env vars into `.env`, runs migrations, then starts the compiled app.
