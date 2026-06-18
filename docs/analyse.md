# Analyse du code et des conventions

Ce document liste tous les points à traiter. Chaque item sera supprimé après
validation, correction et commit.

---

## 1. Contradictions internes dans les conventions

---

## 3. Décisions architecturales discutables

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
