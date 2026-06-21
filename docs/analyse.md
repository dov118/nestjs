# Analyse du code et des conventions

Ce document liste tous les points à traiter. Chaque item sera supprimé après
validation, correction et commit.

Légende de priorité : 🔴 bug / risque prod · 🟠 violation de convention
· 🟡 incohérence / poids mort · 🔵 critique de la convention elle-même.

---

## 3. Décisions architecturales discutables / incohérences

### 3.a 🟡 Socket.IO annoncé dans la stack mais absent du code

Aucune gateway dans le code, pourtant `CLAUDE.md` annonce « Socket.IO gateway ».
→ Trancher : livrer une gateway de référence OU retirer l'annonce de `CLAUDE.md`

- les paquets `socket.io`, `socket.io-client`, `@nestjs/websockets`,
  `@nestjs/platform-socket.io`. **Décision à confirmer.**

### 3.b 🟡 `DB_NAME` : défaut incohérent dans la branche MySQL

`typeorm.config.ts:31` (branche `mysql`) fait
`getEnv('DB_NAME', 'src/database/development')`. Un nom de base MySQL par défaut
valant un chemin de fichier SQLite n'a aucun sens ; §3 veut les clés liées à
l'hôte defaultless. → Le défaut ne doit exister que dans la branche `sqlite`.

### 3.c Pas de DTO + validation — STANDBY (pas encore de controller)

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

### 3.d 🟡 Commentaires `.env` faux

`.env`/`.env.test` disent « SQLite in-memory », mais `DB_NAME=src/database/test`
est un fichier sur disque (in-memory serait `:memory:`). §17 : pas de
commentaire trompeur. → Corriger le commentaire (ou passer réellement en
`:memory:` si c'est l'intention).

### 3.e 🟡 Git Flow documenté ≠ workflows réels

§10 + `CLAUDE.md` disent « release → `main` ». Or `RELEASE.yaml` se déclenche sur
une PR fermée vers `preprod`, et `CD.yaml` sur push `release/*` avec
`base_ref != main`. La branche `preprod` n'apparaît nulle part dans la doc.
→ Réconcilier doc et workflows.

### 3.f 🟡 Pas de `README.md`

Absent à la racine alors que `package.json` pointe vers `#readme`. §17 tolère
« minimal pour un service interne », mais un template gagnerait à en avoir un.

### 3.g 🟡 Détails mineurs

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
pérenne, mais il vit dans `docs/` à côté de la doc de référence. Quand 3.d sera
traité, son contenu migre dans `coding-conventions.md`. Garder la distinction
claire entre les deux fichiers.
