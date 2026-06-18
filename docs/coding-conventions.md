# Coding Conventions

These are the conventions for this codebase. Follow them strictly. They are not
suggestions — match this rigor on every change, every file, every commit.

When the project provides no signal for a decision, follow the rules below. When
a rule below conflicts with an existing, consistent pattern in the repo, follow
the repo and flag the divergence.

---

## 1. Formatting

- 2-space indentation, spaces only (never tabs), LF line endings, UTF-8.
- Final newline at end of file. No trailing whitespace (except inside `.md`).
- Max line length: 80 columns.
- Prettier config: `singleQuote: true`, `arrowParens: 'avoid'`,
  `trailingComma: 'all'`. Keep semicolons.
- Never hand-format what Prettier formats — let it run.

## 2. Linting

- ESLint flat config (`eslint.config.mjs`), composing in this order:
  `@eslint/js` recommended → `typescript-eslint` `strictTypeChecked` +
  `stylisticTypeChecked` + `recommendedTypeCheckedOnly` → `sonarjs` →
  `eslint-plugin-unused-imports` → `eslint-plugin-jest` (test files only) →
  `eslint-config-prettier` LAST.
- Everything is `error`, never `warn`. If a rule is worth having, it blocks.
- `@typescript-eslint/no-explicit-any`: error. `unused-imports/no-unused-imports`
  and `no-unused-vars`: error.
- Never disable a rule globally. When a disable is truly unavoidable, use an
  inline `// eslint-disable-next-line <exact-rule-name>` on the single line, and
  only there. Exception: if the same disable would be needed on every file of
  a structural pattern (e.g. NestJS modules trigger `no-extraneous-class`
  by design), add a targeted `files`-scoped override in `eslint.config.mjs`
  instead of repeating the inline disable per file.

## 3. TypeScript & typing

- Explicit return types EVERYWHERE, including inline arrow callbacks:
  `(data: EsoStatus): void => { ... }`, `(slug: Slug): Promise<InsertResult> => ...`.
- Drop the type annotation only on a `let`/`const` whose literal makes the type
  obvious (`let firstConnect = false`). NEVER drop it on a parameter.
- Zero `any`. Use `unknown` at untyped boundaries and narrow from there.
- Prefer string-literal union types over bare `string` and over `enum` for known
  sets: `type Connector = 'ForumMessage' | 'LiveServices' | 'ServiceAlerts'`.
  Enumerate the full domain when it is knowable.
- Reach for the type system properly when it pays off: function overloads to
  discriminate inputs, declaration merging for typed event signatures, etc.
- Enable strict type-checking flags explicitly in `tsconfig.json`, one by one
  (`noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`,
  `forceConsistentCasingInFileNames`), rather than a blanket `strict: true`.
- `strictNullChecks` is ON in both the build (`tsconfig.json`) and the lint
  config (`tsconfig.eslint.json`). Nullability bugs are caught at compile time,
  not deferred to runtime. When NestJS DI initialises a field outside the
  compiler's view, prefer constructor assignment or an explicit type-safe
  factory over a `!` assertion.
- Read environment variables via the helpers in `src/config/env.ts`, never via
  `process.env.X` directly:
  - `getEnv(name: string, defaultValue?: string): string` — returns the env
    value; falls back to `defaultValue` when the variable is unset and a
    default is provided; otherwise throws.
  - `getEnvNumber(name: string, defaultValue?: number): number` — same
    contract; also throws when the variable is defined but not numeric
    (the default never masks a defined-but-invalid value).

  The consumer gets a properly typed value (not `string | undefined` /
  `NaN`) and a fatal-fast at boot rather than a silent bad value propagating
  through the app. A `defaultValue` is only acceptable when the variable has a
  sensible local/dev fallback (`DB_TYPE='sqlite'`, etc.). Secrets and
  host-specific keys (`DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_USER`, …) stay
  defaultless so the fatal-fast contract holds at boot. The only allowed
  bypass of the helpers themselves is at decorator evaluation time
  (e.g. `@Interval(Number(process.env.INTERVAL_MS ?? '10000'))`), since the
  decorator runs before any module init and cannot throw cleanly — even
  there, prefer a fallback value.

- Env vars are loaded from a **single** point — `src/config/dotenv.ts` — via a
  side-effect import (`import './config/dotenv';`) at the top of every entry
  module that may run standalone: `main.ts`, `src/config/typeorm.config.ts`
  (loaded directly by the TypeORM CLI for `migration:run`), and
  `src/config/winston.config.ts`. Never call `dotenv.config()` elsewhere in
  `src/`. The loader reads `.env.${NODE_ENV ?? 'development'}` first, then
  `.env` as a fallback (no override). For tests, `test/setup-env.ts` is
  registered as a Jest `setupFile` and reads `.env.${NODE_ENV ?? 'test'}`
  with `override: true` so that test-specific values win over any
  ambient env. CI exports `NODE_ENV=test` at the job level so the same loader
  finds `.env.test` for both `migration:run` and Jest.

## 4. Naming

- Files: `kebab-case` + a semantic suffix that states the role. Use exactly:
  `.service.ts`, `.controller.ts`, `.module.ts`, `.entity.ts`, `.seeder.ts`,
  `.config.ts`, `.data.ts`, `.const.ts`, `.type.ts`, `.interface.ts`,
  `.pattern.ts`, `.formatter.ts`, `.identifier.ts`, `.match.ts`, `.spec.ts`,
  `.e2e-spec.ts`. Migrations: `<unixTimestampMs><PascalCaseName>.ts`.
- Classes: `PascalCase` + technical suffix (`ArchiveService`, `DateFormatter`,
  `CreateArchiveTable1721839547958`).
- Interfaces: `PascalCase`, NO `I` prefix.
- Variables, functions, methods, socket events: `camelCase`.
- Use a consistent verb vocabulary for methods: `get*` for accessors,
  `clean*`/`sanitize`/`filter` for transforms, `identify` for detection,
  `generate*` for construction, `fetch`/`fetchEach` for iteration.
- Keep a stable domain prefix on domain types/classes:
  `<Domain><Variant>` (e.g. `EsoStatusMaintenance`, not `MaintenanceEsoStatus`).
- Long, descriptive, self-documenting names. Never `data1`, `tmp`, `x`.
- When importing an external type that collides with a local one, alias it:
  `import { Status as EsoStatusStatus } from '@org/types';`.
- DB: table names singular lowercase; foreign keys `FK_<Table><Reference>`;
  REST resources singular (`/service`, `/service/:slug`).

## 5. Architecture & file organisation

- One class = one file = one responsibility.
- Separate data from logic: constants, regex/pattern tables, and seed data live
  in their own files/folders (`const/`, `pattern/`, `database/data/`), never
  inline in logic classes.
- NO barrel files. No `index.ts` re-export hubs. Imports are always explicit and
  point at the real file.
- Name folders by role (`identifier/`, `formatter/`, `pattern/`, `type/`,
  `interface/`, `const/`), not by generic structure (`classes/`, `utils/`).
- Don't over-modularize. Create a NestJS module only when there is a controller
  to isolate; otherwise declare providers directly. Don't add structure for
  symmetry's sake.
- Cloister config by scope (`tsconfig.build.json`, `tsconfig.eslint.json`,
  `.gitignore`, `.npmignore`, `.prettierignore`) rather than one catch-all file.
- Feature code lives under `src/resource/<name>/` mirroring the NestJS CLI
  resource layout: `entities/<name>.entity.ts`, `dto/`, `<name>.controller.ts`,
  `<name>.service.ts`, `<name>.module.ts`. Migrations and seeders always stay in
  `src/database/`.
- Cross-cutting providers that span multiple resources (logging, scheduling,
  utilities) live in `src/service/<name>/<name>.service.ts`. Register them
  directly in `AppModule`; do not create a dedicated NestJS module unless a
  controller is also present.

## 6. NestJS

- 100% constructor injection, always `private readonly`. No exceptions —
  including the application logger (see bootstrap rule below).
- **Env / DI exception.** Some code is evaluated before the Nest DI container
  (and therefore `ConfigService`) exists: config files loaded by the TypeORM CLI
  (`typeorm.config.ts`), the Winston logger config (`winston.config.ts`),
  `main.ts` bootstrap, and scheduler decorators (`@Interval`/`@Cron`) whose
  arguments are read at class load. In those contexts only, reading the env
  directly — `process.env` or the `getEnv`/`getEnvNumber` helpers — is the
  accepted exception to constructor injection. Example:
  `@Interval(Number(process.env.INTERVAL_MS ?? '10000'))`.
- Version the API via a global prefix from env (`setGlobalPrefix(APP_PREFIX)`)
  ONLY when the API is consumed by a service outside your control (public API,
  third-party client, separately-deployed front-end). For an internal service
  whose only consumers ship in the same repo, skip the prefix.
- Use Winston as the global logger; `enableShutdownHooks()` on bootstrap.
- Bootstrap pattern (`src/main.ts`): create the app with
  `NestFactory.create(AppModule, { bufferLogs: true })`, then immediately
  attach the logger via `app.useLogger(app.get(WinstonService))`. Never pass
  `logger: new WinstonService()` to `NestFactory.create` — instantiating a
  provider by hand defeats DI, and the buffered-logs mode replays boot logs
  through the real logger once it is attached. The bootstrap entry point is
  `void bootstrap()` (not a `// eslint-disable-next-line
no-floating-promises` workaround).

## 7. Feature planning

Before writing any code (including tests), produce a written plan and get
explicit approval. The plan must cover:

- **Files** — exhaustive list of every file to create or modify, with its exact
  path and NestJS role suffix (`.service.ts`, `.module.ts`, etc.).
- **Classes & interfaces** — `PascalCase` name, role, injected dependencies.
- **Public methods** — name, parameters with types, return type.
- **Key variables & constants** — name, type, and where they live (inline,
  `.const.ts`, `.env`).
- **Types & interfaces** — any new `type` or `interface` to introduce.
- **Test scenarios** — one bullet per `it()` that will be written in the Red
  step; state the observable behaviour being asserted, not the implementation
  detail.
- **Environment variables** — any new key added to `.env.example` and
  `.env.test`.

Do not start the Red step of TDD until the plan is approved. If the plan
changes mid-cycle, update and re-approve before continuing.

## 8. Testing

### 8.1 TDD — mandatory, no exceptions

We practise strict Test Driven Development. Tests are always written **before**
the implementation. The sequence is non-negotiable:

1. **Red** — write a test that describes the desired behaviour and run it.
   It MUST fail. A test that passes before any implementation is a false
   positive: throw it away and start over.
2. **Green** — write the _minimum_ production code that makes the test pass.
   Do not anticipate future requirements; do not over-engineer. One failing
   test → one passing test.
3. **Refactor** — clean the code (rename, extract, simplify) while keeping all
   tests green. Do not change behaviour; only improve the design.

Repeat the cycle for every new behaviour. The `pre-commit` hook runs the full
suite, so a commit can only ever capture a completed, green cycle. The red step
stays local.

**Quality gate** — after EVERY code change (creation, edit, deletion of any
`.ts` file) AND before every commit, run the full gate on the **entire
codebase**, not just the touched files:

```bash
npm run format   # Prettier — normalises style on every file
npm run lint     # ESLint global — catches cross-file type/style regressions
npm run build    # tsc — detects cross-file typing breakage
npm run test     # Jest — full suite, --runInBand
```

All four must exit with code 0. Fix every error they report; never silence a
lint error with a disable comment unless it is truly unavoidable (see §2). A
modification in one file can break typing or tests in another file that you
haven't touched — only a full-codebase run catches those regressions.

### 8.2 Tools & constraints

- Jest + ts-jest. `--runInBand` always (tests share real resources: SQLite,
  sockets).
- Naming: `*.spec.ts` for unit, `*.e2e-spec.ts` for e2e, with a separate
  `jest-e2e.json`. Keep tests in `test/`, data fixtures in `test/data/`.
- Favor high-level, scenario/fixture-driven tests through the public entry point
  over isolated unit tests. Capture real snapshots + expected output, drive them
  with `it.each`.
- Mock at the external SDK boundary with `jest.spyOn` (`axios.get`, a
  connector's static method) — do NOT stub the whole module. When feasible, run
  the real thing (a real Socket.IO server, a real SQLite) rather than mocking it.
- Freeze time for date-dependent tests (`jest.useFakeTimers().setSystemTime(...)`).
- Set an explicit `timeout` on e2e tests.
- Coverage via `test:cov` → `lcov.info` → SonarCloud. Exclude `test/**` from
  Sonar analysis.
- `test/setup-env.ts` loads `.env.${process.env.NODE_ENV ?? 'test'}` via
  `dotenv` (with `override: true`) before any test runs; register it once in
  Jest `setupFiles`. Never call `dotenv.config()` inside individual spec files.
- TypeORM integration tests: put DataSource options in `test/typeorm.config.ts`
  (entities and migrations as direct class references — never a glob — with
  `dropSchema: true`, `synchronize: false`). `test/setup-typeorm.ts` exports
  `setupDatabase()`, which registers `beforeEach`/`afterEach` hooks that drop the
  schema, reinitialise the DataSource, and run all migrations, giving each `it()` a
  clean database; and `getDataSource()` to access the live connection. Spec files
  call `setupDatabase()` at the top of their `describe` block.
- Seeders have no dedicated spec. They are exercised implicitly: `setupDatabase()`
  resets the database before each test via migrations; a broken seeder surfaces as
  a failure in the consumer test.
- NestJS provider tests: build a minimal `TestingModule` with
  `Test.createTestingModule`, importing only the modules actually needed (e.g.
  `ScheduleModule.forRoot()`) and substituting DI providers inline:
  `{ provide: X, useValue: { method: jest.fn() } }`. Always call
  `appModule.init()` after `compile()`, and `appModule.close()` in `afterEach`
  to stop schedulers and release resources.
- Scheduler/interval tests: call `jest.useFakeTimers()` and
  `jest.setSystemTime(fixedDate)` in `beforeEach`; advance time with
  `jest.advanceTimersByTime(intervalMs)` to trigger `@Interval()` handlers
  without real waiting; reset with `jest.useRealTimers()` in `afterEach`.
- Smoke spec on every root-composed NestJS module. A single `it` that does
  `Test.createTestingModule({ imports: [AppModule] }).compile()` → `init()`
  → `close()` without throwing. Use the real runtime (no overridden
  providers): the spec's job is to surface import-time regressions — failing
  `getEnv` calls, broken DI, side effects in `config/`. Apply to `AppModule`
  today; extend to any future composed root module.

## 9. Code quality gates

- Husky `pre-commit`: `npx lint-staged` → `npm run build` → `npm run lint` →
  `npm run test`. The committed state is always green on the **full
  codebase**, not only on the staged diff. Accept the slowness.
- `lint-staged`: `*.ts` → `eslint --fix` + `prettier --write`;
  `*.{json,md,yml,yaml}` → `prettier --write`.
- CI (GitHub Actions) on all branches: checkout → setup-node (pinned) →
  `npm ci --ignore-scripts` → build → lint → `test:cov` → SonarCloud.
- Pin actions by version; SHA-pin security-sensitive ones (Sonar).
- CD on a `release/*` branch PR merge.

## 10. Git & commits

- Branch-driven Git Flow: `feature/<topic>`, `bugfix/<topic>`, `hotfix/<topic>`
  branches merge into a `release/<version>` branch. The release branch merges
  into `main` only when it is released on a final tag — one carrying neither a
  `-dev` nor an `-rc` suffix.
- Commit subject: `Related <branch-name>`. Commit body: ONE concise line stating
  the actual change (e.g. "Remove outdated test data and constants"). The branch
  carries the category; the body carries the intent. Never leave the body empty.
- English only. Atomic commits. A commit captures a completed Red-Green-Refactor
  cycle: the feature and its tests together, green. Never commit code and its
  tests separately.
- Merge via merge commits. Never squash.

## 11. Dependencies

- npm. Commit `package-lock.json`.
- Pin every dependency to an exact version — no `^`, no `~`.
- `.npmrc`: `engine-strict=true`. Pin the `engines.node` field.
- `npm ci --ignore-scripts` in CI. Keep Dependabot active.
- Classify deps correctly: anything used only by tests/build is a `devDependency`
  (don't ship test-only packages to consumers). Exception: under NestJS, some
  packages (`@nestjs/cli`, `@nestjs/testing`, `@types/*` used at compile time,
  the active DB driver) must stay in `dependencies` or TS resolution breaks at
  build time. Accept the NestJS CLI's layout rather than fighting it.

## 12. Error handling & logging

- Fail loud, fail once. `throw` on genuine anomalies; write no defensive code for
  cases that "shouldn't happen". An exception means a real bug, not a branch.
- Use built-in NestJS exceptions (`BadRequestException`, etc.). No custom error
  hierarchy and no `Result`/`Either` unless a concrete need appears.
- Libraries stay silent — never impose a logger on consumers.
- Services log verbosely and structurally with fixed category tags:
  `[<Domain>] [<id>] [<Category>] action: detail` (categories like `[Change]`,
  `[Entity]`, `[Event]`, `[Status]`). Trace every DB write and every emitted
  event.

## 13. Async

- `async`/`await` only. Never chain `.then().catch()` in application code.
- `Promise.all` for **independent** parallel operations (fan-out HTTP, IO on
  disjoint resources). For seeders specifically, « independent » means **the
  seeders target distinct tables AND share no overlapping unique keys**. As
  soon as two seeders could both touch the same row (same table, or two
  tables linked by a FK that one of them needs to resolve), run them
  sequentially (`for...of await`). The compare-before-write pattern (§14) is
  not thread-safe under concurrent access to the same row.
- Prefer designing for idempotency (compare-before-write) over concurrency locks
  when the data model allows it. Add retry/backoff/timeout only where a real
  failure mode justifies it, not by default.

## 14. Data & persistence (TypeORM)

- `synchronize: false` on every entity. Schema is owned by migrations only.
- Every migration has both `up()` and `down()`. Prefix the class name with a
  unix-ms timestamp.
- Migrations are listed as direct class imports in both
  `src/config/typeorm.config.ts` and `test/typeorm.config.ts` — never a glob
  like `dist/database/migrations/*.js`. Adding a migration means importing
  the class and appending it to the array. Gain: compile-time check, single
  source of truth, symmetric prod/test config. Note that `migration:run`
  still needs a prior `npm run build` because the CLI is invoked with
  `-d ./dist/config/typeorm.config.js`; that constraint is independent of
  the listing format.
- The module-level `export const dataSource = new DataSource(dataSourceOptions)`
  in `src/config/typeorm.config.ts` is required by
  `typeorm migration:run -d ./dist/config/typeorm.config.js`. It is the ONLY
  intentional import-time side effect tolerated in `src/config/` beyond the
  dotenv loader.
- Repository pattern (`find`, `findOne`, `create`+`save`, `update`, `delete`).
  No custom repository abstraction, no `BaseEntity` active-record style.
- Calibrate `varchar` lengths to the real data; change a length via a migration
  rather than over-allocating `text`.
- Declare relations explicitly; set `onDelete`/`onUpdate` intentionally.
- Separate seeder logic (`database/seeds/`) from declarative seed data
  (`database/data/`).
- Seeders must be idempotent: check for existence before inserting
  (`findOneBy` → insert only when `null`). Never call `insert` or `upsert`
  blindly.
- **Single source of truth per seed row.** Each datum has exactly one
  responsible seeder. If two seeders would both insert the same row (same
  unique key), it is a design smell — refactor: extract the shared row into a
  dedicated « foundational » seeder that runs first, then make the dependent
  seeders rely on the existing row via `findOneBy` (read-only). This rule
  makes the `Promise.all` constraint in §13 (« distinct tables, no
  overlapping unique keys ») easy to honour: by construction, no two seeders
  ever race on the same row.
- Wrap multi-write operations in an explicit transaction (extends the audited
  repos, which never needed one — see Notes).

## 15. API contracts

Apply this section ONLY when the API is consumed by a service outside your
control. For an internal-only service, skip it.

- Version in the URL prefix (`/v2`, `/v3`). Version the whole API, not individual
  routes; a breaking change is a new version.
- Keep a single source of truth for the contract: a shared `types` package
  consumed by both server and client. Bump it when the contract changes.

## 16. Security & supply chain

- Secrets only in CI secrets — never in code, never committed.
- `.env` is gitignored; commit `.env.example` with `__VAR__` placeholders
  resolved at runtime/CI.
- `npm ci --ignore-scripts`; SHA-pin sensitive actions; run Docker as a non-root
  user.

## 17. Documentation

- JSDoc as a contract on the PUBLIC API of a published library: every exported
  class, method, and parameter, in English. Set `removeComments: false` so it
  survives compilation for consumers.
- Inline comments narrate the WHY of non-trivial pipelines, not the what. No
  noise comments on self-evident code.
- Zero `TODO`/`FIXME`/`HACK`/`XXX`. Remove dead code and deferred decisions —
  don't mark them.
- README: a polished "shop window" (badges, install, usage, return-value example)
  for a package others consume; minimal for an internal service.

## 18. Language & locale

- Code, comments, JSDoc, commit messages, README: English.
- GitHub Actions workflow step names: English too.
- Dates: ISO 8601 / UTC by default.

---

## Notes — deliberate deviations from the audited repos

A few rules above intentionally go beyond or correct what the eso-status repos
show, because they are libraries/single-controller services and a richer
application needs more:

1. **Transactions** — eso-status had no multi-write operations, so it never used
   a transaction. A real CRUD API does: wrap multi-write operations in one.
2. **Descriptive commit body** — the `Related <branch>` subject is kept (it is
   the established convention), but the body must always describe the change, so
   `git log` stays readable without opening the PR.
