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
  only there.

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
- Under NestJS, `strictNullChecks` stays in the lint config (`tsconfig.eslint.json`)
  only, NOT in the build config. NestJS DI initialises injected properties
  outside the compiler's view; turning the flag on at build time forces
  spurious `!` assertions on every `@Inject`-style field. Reach for `unknown`
  and narrow at boundaries instead.

## 4. Naming

- Files: `kebab-case` + a semantic suffix that states the role. Use exactly:
  `.service.ts`, `.controller.ts`, `.module.ts`, `.entity.ts`, `.seeder.ts`,
  `.data.ts`, `.const.ts`, `.type.ts`, `.interface.ts`, `.pattern.ts`,
  `.formatter.ts`, `.identifier.ts`, `.match.ts`, `.spec.ts`, `.e2e-spec.ts`.
  Migrations: `<unixTimestampMs><PascalCaseName>.ts`.
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

## 6. NestJS

- 100% constructor injection, always `private readonly`. No exceptions.
- Version the API via a global prefix from env (`setGlobalPrefix(APP_PREFIX)`)
  ONLY when the API is consumed by a service outside your control (public API,
  third-party client, separately-deployed front-end). For an internal service
  whose only consumers ship in the same repo, skip the prefix.
- Use Winston as the global logger; `enableShutdownHooks()` on bootstrap.

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

**Quality gates during Refactor** — at the end of every Refactor step, before
considering the cycle complete, run both:

```bash
npm run format   # Prettier — normalises style
npm run lint     # ESLint — catches type-unsafe or style violations
```

Both commands must exit with code 0. Fix every error they report; never silence
a lint error with a disable comment unless it is truly unavoidable (see §2).
Only then re-run the tests to confirm the suite is still green.

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

## 9. Code quality gates

- Husky `pre-commit`: `npx lint-staged` → `npm run build` → `npm run test`. The
  committed state is always green. Accept the slowness.
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
- `Promise.all` for independent parallel operations (seeders, fan-out).
- Prefer designing for idempotency (compare-before-write) over concurrency locks
  when the data model allows it. Add retry/backoff/timeout only where a real
  failure mode justifies it, not by default.

## 14. Data & persistence (TypeORM)

- `synchronize: false` on every entity. Schema is owned by migrations only.
- Every migration has both `up()` and `down()`. Prefix the class name with a
  unix-ms timestamp.
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

1. **`strictNullChecks` in the build** — the audited repos enable it for lint
   only, which lets nullability bugs through compilation. Here it is ON in the
   build config too.
2. **Transactions** — eso-status had no multi-write operations, so it never used
   a transaction. A real CRUD API does: wrap multi-write operations in one.
3. **Descriptive commit body** — the `Related <branch>` subject is kept (it is
   the established convention), but the body must always describe the change, so
   `git log` stays readable without opening the PR.
