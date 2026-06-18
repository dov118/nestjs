# Analyse du code et des conventions

Ce document liste tous les points à traiter. Chaque item sera supprimé après
validation, correction et commit.

Légende de priorité : 🔴 bug / risque prod · 🟠 violation de convention
· 🟡 incohérence / poids mort · 🔵 critique de la convention elle-même.

---

## 1. Bugs réels / risques en production

### 1.a 🔴 `start.sh` ne résout pas tous les placeholders

`start.sh` ne fait des `sed` que sur `NODE_ENV, APP_NAME, APP_PORT, DB_*`. Il
oublie `__LOG_LEVEL__`, `__INTERVAL_MS__`, `__POD_*__` et n'a pas le catch-all
`sed 's/__[A-Z_]*__//g'`. Au runtime du conteneur :

- `LOG_LEVEL=__LOG_LEVEL__` → `getEnv('LOG_LEVEL','info')` ne renvoie pas `info`
  (la var est définie, juste invalide) → Winston reçoit un niveau bidon →
  logger silencieux. C'est exactement le scénario que §16 décrit comme à éviter.
- `INTERVAL_MS=__INTERVAL_MS__` → `Number('__INTERVAL_MS__')` = `NaN`, et
  `?? '10000'` ne rattrape pas `NaN` (seulement `null`/`undefined`) →
  `@Interval(NaN)`.

`CI.yaml` fait déjà les choses correctement (catch-all `s/__[A-Z_]*__//g`
présent). → Aligner `start.sh` sur `CI.yaml` : résoudre toutes les vars
porteuses de sens puis blanchir le reste avec le catch-all.

### 1.b 🔴 `Dockerfile` : `WORKDIR /eso-status`

Résidu copié du repo eso-status d'origine. Incohérent sur un template
« NestJS ». De plus `EXPOSE 3000` est figé alors que `APP_PORT` est configurable
via l'env. → Renommer le WORKDIR (générique) et aligner / documenter le port.

---

## 2. Violations de conventions (code vs docs)

### 2.a 🟠 §11 « pin exact, no `^` » — un caret traîne

`"@nestjs/terminus": "^11.1.1"` est la seule dépendance avec un `^`. Toutes les
autres sont épinglées. → `11.1.1`.

### 2.b 🟠 §11 « test-only = devDependency » — `supertest` mal classé

`supertest` n'est utilisé que dans `health.e2e-spec.ts` mais est en
`dependencies` (embarqué dans l'image prod). → `devDependencies`. Idem
`socket.io-client` (client de test uniquement) si la gateway n'arrive pas
(voir 3.c).

### 2.c 🟠 §4 « nommer par intention, pas par mécanisme » — `IntervalService`

§4 dit textuellement : « un provider planifié … est `market-price.service.ts`,
pas `interval.service.ts` ; le `@Interval` est le comment, pas le quoi ». Or le
repo livre `common/scheduler/interval.service.ts` / `IntervalService`. Le code
viole l'exemple même que la convention donne. De plus, ce `tick()` qui logue la
date est du code de démo mort (§17). → Soit le supprimer, soit le transformer en
vraie capacité nommée par son intention.

### 2.d 🟠 §18 « dates ISO 8601 / UTC » — `tick()` logue en heure locale

`interval.service.ts:12` : `new Date().toLocaleString()` est dépendant de la
locale et du fuseau, l'opposé d'ISO/UTC. (Disparaît si 2.c retire le service.)

### 2.e 🟠 §16 mirror — `.env.example` et `start.sh` désynchronisés

Conséquence de 1.a : `LOG_LEVEL`/`INTERVAL_MS`/`POD_*` sont dans `.env.example`
mais absents de `start.sh`. La règle « tout consommateur de l'env reflète
exactement `.env.example` » est cassée.

### 2.f 🟠 §2 — ordre ESLint réel ≠ ordre documenté

§2 décrit : `js` → tseslint(strict+stylistic+recommendedTypeChecked) → sonarjs
→ unused-imports → jest → prettier. Le fichier réel met sonarjs en
avant-dernier (après unused-imports et jest), ajoute
`...tseslint.configs.recommended` (non documenté) et des règles
`no-useless-constructor`/`no-empty-function` (non documentées).
`no-explicit-any: error` y est redondant (déjà fourni par `strictTypeChecked`).
→ Aligner soit le doc, soit `eslint.config.mjs`.

---

## 3. Décisions architecturales discutables / incohérences

### 3.a 🟡 `@nestjs/config` importé mais jamais utilisé

`AppModule` importe `ConfigModule.forRoot({ isGlobal: true,
ignoreEnvFile: true })`, mais `ConfigService` n'est injecté nulle part
(`grep` = 0). Tout passe par `getEnv`/`getEnvNumber` + le loader `dotenv.ts`. Le
`ConfigModule` est vestigial et tire la dépendance `@nestjs/config`. §5 « pas de
structure pour la symétrie ». → Trancher : supprimer `@nestjs/config`
(recommandé, cohérent avec la philosophie `getEnv` + fatal-fast) OU adopter
réellement `ConfigService`. **Décision à confirmer.**

### 3.b 🟡 `moment` déclaré pour rien

`moment` (2.30.1) : aucun usage dans `src`/`test`. Lib en mode maintenance que
ses auteurs déconseillent pour du neuf, et qui contredit §18 (UTC). → Supprimer.

### 3.c 🟡 Socket.IO annoncé dans la stack mais absent du code

Aucune gateway dans le code, pourtant `CLAUDE.md` annonce « Socket.IO gateway ».
→ Trancher : livrer une gateway de référence OU retirer l'annonce de `CLAUDE.md`

- les paquets `socket.io`, `socket.io-client`, `@nestjs/websockets`,
  `@nestjs/platform-socket.io`. **Décision à confirmer.**

### 3.d 🟡 `DB_NAME` : défaut incohérent dans la branche MySQL

`typeorm.config.ts:31` (branche `mysql`) fait
`getEnv('DB_NAME', 'src/database/development')`. Un nom de base MySQL par défaut
valant un chemin de fichier SQLite n'a aucun sens ; §3 veut les clés liées à
l'hôte defaultless. → Le défaut ne doit exister que dans la branche `sqlite`.

### 3.e Pas de DTO + validation — STANDBY (pas encore de controller)

Aucune mention de `class-validator`/`class-transformer` ni de `ValidationPipe`
global. Dès qu'un controller arrive, la question reviendra → §7 (plan) et §6
(Nest) devraient préciser le pattern par défaut.

**À NE PAS OUBLIER** quand le premier controller arrivera : livrer un **template
de controller de référence** avec validation, à savoir :

- un DTO `create` et un DTO `update` (ex. `update` = `PartialType(create)`),
  validés par `class-validator` (+ `class-transformer`) ;
- un `ValidationPipe` global (`whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true`) ;
- graver le pattern par défaut dans `coding-conventions.md` (§6 + §7) et retirer
  ce point.

### 3.f 🟡 Commentaires `.env` faux

`.env`/`.env.test` disent « SQLite in-memory », mais `DB_NAME=src/database/test`
est un fichier sur disque (in-memory serait `:memory:`). §17 : pas de
commentaire trompeur. → Corriger le commentaire (ou passer réellement en
`:memory:` si c'est l'intention).

### 3.g 🟡 Git Flow documenté ≠ workflows réels

§10 + `CLAUDE.md` disent « release → `main` ». Or `RELEASE.yaml` se déclenche sur
une PR fermée vers `preprod`, et `CD.yaml` sur push `release/*` avec
`base_ref != main`. La branche `preprod` n'apparaît nulle part dans la doc.
→ Réconcilier doc et workflows.

### 3.h 🟡 Pas de `README.md`

Absent à la racine alors que `package.json` pointe vers `#readme`. §17 tolère
« minimal pour un service interne », mais un template gagnerait à en avoir un.

### 3.i 🟡 Détails mineurs

- `winston.config.ts:41` : `silent: false` explicite = bruit (c'est le défaut).
- `tsconfig.eslint.json` re-déclare `strictNullChecks: true` (déjà hérité) —
  documenté comme volontaire, donc OK mais redondant.
- `src/.DS_Store` / `test/.DS_Store` traînent sur le disque (ignorés par git
  mais sales).

---

## 4. Contradictions internes des conventions

### 4.a 🔵 §4 vs §5 — `interval.service.ts` à la fois mauvais et bon exemple

§4 utilise `interval.service.ts` comme **mauvais** exemple de nommage ; §5
l'utilise comme **bon** exemple de layout `common/scheduler/`. Le même nom
illustre une fois la règle et une fois son contraire. → Harmoniser (renommer
l'exemple dans §5, ex. `common/scheduler/heartbeat.service.ts`).

### 4.b 🔵 §3 « zéro `!`, nullabilité à la compilation » repose sur un flag off

`strict: true` n'est pas activé (choix assumé, flags un par un), donc
`strictPropertyInitialization` est désactivé. C'est uniquement pour ça que
`User { id: number; firstName: string; … }` compile sans `!` ni initialiseur.
La §3 vante « zéro `!` » alors que, sur les entités, le filet est juste retiré.
→ Expliciter dans §3 : « les colonnes d'entité reposent sur
`strictPropertyInitialization: false`, assumé », sinon un passage à
`strict: true` casse toutes les entités sans explication.

---

## 5. Critiques de la philosophie (à arbitrer, pas forcément à corriger)

### 5.a 🔵 Quality gate « full codebase après chaque touche de `.ts` » sur-coûteuse

Lancer `format + lint + build + test` complets après chaque édition, puis les
relancer en `pre-commit`, est redondant et devient punitif au-delà d'un petit
template. Piste portable : pendant l'itération, gate léger (typecheck + tests
affectés) ; garder le gate complet pour `pre-commit` + CI. On garde la garantie
« commit toujours vert » sans payer le full-suite à chaque sauvegarde.
**À arbitrer.**

### 5.b 🔵 `docs/analyse.md` mélange backlog et doc de référence

Ce fichier est un backlog (« supprimé après commit »), pas une convention
pérenne, mais il vit dans `docs/` à côté de la doc de référence. Quand 3.e sera
traité, son contenu migre dans `coding-conventions.md`. Garder la distinction
claire entre les deux fichiers.
