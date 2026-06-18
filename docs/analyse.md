# Analyse du code et des conventions

Ce document liste tous les points à traiter. Chaque item sera supprimé après
validation, correction et commit.

---

## 1. Contradictions internes dans les conventions

---

## 3. Décisions architecturales discutables

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
