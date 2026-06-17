# Analyse du code et des conventions

Ce document liste tous les points à traiter. Chaque item sera supprimé après
validation, correction et commit.

---

## 1. Contradictions internes dans les conventions

---

## 2. Code qui viole les conventions

### 2.d `src/config/winston-config.ts`

- Nommage incohérent : `winston-config.ts` vs `typeorm.config.ts` (trait
  d'union vs point). §4 ne liste pas `.config.ts` comme suffixe sémantique → à
  ajouter et trancher.
- Codes ANSI hardcodés (`\x1b[32m`, `\x1b[39m`) inline → illisible. Soit
  `chalk`/`kleur`, soit des constantes nommées.
- `format: 'MM/DD/YYYY, hh:mm:ss A'` (format US, 12h) viole §18 ligne 296
  (« Dates: ISO 8601 / UTC by default »).
- `level: 'info'` hardcodé → devrait être configurable via `LOG_LEVEL` env.
- `String(process.env.APP_NAME)`, `String(process.pid)` répétés → le format
  doit valider le shape au démarrage, pas convertir à chaque log.

### 2.e `src/service/interval/interval.service.ts`

- `@Interval(Number(process.env.INTERVAL_MS ?? '10000'))` : lit `process.env`
  directement (le décorateur ne peut pas attendre l'init de `ConfigService`).
  Forcé, mais §6 ne reconnaît pas cette exception.
- Le service de démonstration n'a aucune valeur fonctionnelle pour un template
  → soit le supprimer, soit documenter qu'il s'agit d'un exemple.

### 2.f `src/database/migrations/1781710175911CreateUserTable.ts`

- `created_at`/`updated_at` ont `default: 'CURRENT_TIMESTAMP'` mais **pas** de
  `ON UPDATE CURRENT_TIMESTAMP` côté SQL. TypeORM gère via `@UpdateDateColumn`,
  mais un `UPDATE` SQL direct ne touchera pas `updated_at`. Divergence
  ORM↔SQL non documentée.

### 2.g Tests

- `test/service/interval/interval.service.spec.ts` : les callbacks
  `beforeEach`/`afterEach` n'ont pas de type de retour explicite → viole §3.
- `FIXED_DATE = new Date('2026-06-17T10:00:00')` → date locale, pas UTC → viole
  §18.
- Test « 3 ticks consécutifs » assertit 3 comportements dans un seul `it()` →
  §8 « one bullet per `it()` » lu strictement, ce devrait être trois cas (ou un
  `it.each`).
- `user.entity.spec.ts` : « should reject » teste seulement `toThrow()` sans
  vérifier le type/message → l'erreur peut venir d'ailleurs sans qu'on le
  sache.

---

## 3. Décisions architecturales discutables

### 3.b `service/` vs `resource/`

La frontière est floue. `WinstonService` et `IntervalService` sont dans
`service/` parce qu'ils n'ont pas d'entity ; demain, un `MailService` qui gère
un template DB est-il une « ressource » ou un « service » ? §5 décrit le
« quoi » mais pas le « quand ». À préciser, ou à fusionner.

### 3.c `seeds: [UserSeeder]` configuré mais aucun script `npm run seed:run`

Le mécanisme est branché à moitié. En l'état, les seeders ne tournent que via
les tests (qui re-créent un schéma à chaque `it`). Pour la prod : silence. À
documenter explicitement OU à ajouter le script.

### 3.d Pas de health endpoint

Service destiné à K3s (rollout, livenessProbe…) sans `@nestjs/terminus`. Pour
un template, c'est une lacune majeure.

### 3.e Pas de DTO + validation

Aucune mention de `class-validator`/`class-transformer` ni de `ValidationPipe`
global. Dès qu'un controller arrive, la question reviendra → §7 (plan) et §6
(Nest) devraient préciser le pattern par défaut.

### 3.f `npm ci --ignore-scripts` + `npm rebuild sqlite3` dans CI

Contourne immédiatement la sécurité que `--ignore-scripts` apporte. Pas faux en
soi (sqlite3 a besoin d'être rebuilt), mais à mentionner dans §16
(« exception assumée pour les drivers natifs »).

---

## 4. Conventions à compléter ou clarifier

| Section | Manque                                                                                                                   | Proposition                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| §4      | `.config.ts`, `.dto.ts`, `.guard.ts`, `.pipe.ts`, `.interceptor.ts`, `.middleware.ts`, `.gateway.ts` absents de la liste | Ajouter, trancher `winston.config.ts` vs `winston-config.ts`                                                              |
| §4      | Nom de classe de migration : `Create<X>Table<timestamp>` ou `<timestamp><X>` ?                                           | Aligner sur le standard TypeORM (suffixe timestamp) et le rendre explicite                                                |
| §5      | Critère « service vs resource »                                                                                          | Règle nette : `resource/` = a une entity/table ; `service/` = cross-cutting sans état persistant                          |
| §6      | Exceptions au DI (logger dans `NestFactory.create`, lecture env dans décorateurs `@Interval`/`@Cron`)                    | Reconnaître explicitement et lister les seules dérogations autorisées                                                     |
| §6      | DTO/validation par défaut                                                                                                | Pattern : `class-validator` + `ValidationPipe` global avec `whitelist: true, forbidNonWhitelisted: true, transform: true` |
| §7      | Aucun template de plan                                                                                                   | Ajouter un squelette : `# Files / # Classes / # Methods / # Types / # Test scenarios / # Env vars`                        |
| §8.1    | Hook pre-commit ne lance pas `lint`                                                                                      | Soit aligner le hook (`lint-staged → build → lint → test`), soit dire que `lint-staged` couvre le besoin                  |
| §11     | sqlite3 / drivers natifs vs `--ignore-scripts`                                                                           | Mentionner l'exception                                                                                                    |
| §12     | Vocabulaire de catégories `[Change]`, `[Entity]`, etc.                                                                   | Soit généraliser, soit marquer « hérité d'eso-status, à adapter par projet »                                              |
| §15     | « Internal-only » dit de skipper toute la section                                                                        | Au minimum garder « versionner les breaking changes via une nouvelle route préfixée », même en interne                    |
| —       | Health check, observabilité, secrets K8s                                                                                 | Ajouter une section dédiée — c'est un template K3s, c'est attendu                                                         |

---

## 5. Synthèse des 5 actions à plus fort impact

1. **Centraliser dotenv** (un seul point de chargement) — élimine 4 fragilités.
2. **Trancher la contradiction `strictNullChecks`** (§3 vs Notes §1) et
   **réécrire les Notes** pour qu'elles décrivent l'état réel.
3. **Réconcilier le hook pre-commit avec §8.1** : soit lint global au commit,
   soit retirer l'exigence.
4. **Préciser §5 (resource vs service)** avec un critère binaire ; sinon la
   frontière dérivera dès la 3ᵉ feature.
5. **Supprimer la duplication mysql/sqlite** dans `typeorm.config.ts` (base
   partagée + override) et **purger `entities: [User]` dans `AppModule`** déjà
   présent dans la base.
