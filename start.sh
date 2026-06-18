#!/bin/sh

# SETUP ENV FILE
cat ./.env.example > ./.env
sed -i -e "s/__NODE_ENV__/$NODE_ENV/g" ./.env
sed -i -e "s/__APP_NAME__/$APP_NAME/g" ./.env
sed -i -e "s/__APP_PORT__/$APP_PORT/g" ./.env
sed -i -e "s/__DB_TYPE__/$DB_TYPE/g" ./.env
sed -i -e "s/__DB_HOST__/$DB_HOST/g" ./.env
sed -i -e "s/__DB_PORT__/$DB_PORT/g" ./.env
sed -i -e "s/__DB_NAME__/$DB_NAME/g" ./.env
sed -i -e "s/__DB_USER__/$DB_USER/g" ./.env
sed -i -e "s/__DB_PASSWORD__/$DB_PASSWORD/g" ./.env
sed -i -e "s/__DB_DEBUG__/$DB_DEBUG/g" ./.env
sed -i -e "s/__LOG_LEVEL__/$LOG_LEVEL/g" ./.env
sed -i -e "s/__INTERVAL_MS__/$INTERVAL_MS/g" ./.env
# Blank every remaining placeholder (POD_* are injected at runtime by the K8s
# downward API, so they stay empty here and process.env wins). Without this
# catch-all, an unresolved __VAR__ leaks as a literal value (e.g. an invalid
# LOG_LEVEL silences the logger, INTERVAL_MS becomes NaN).
sed -i -e "s/__[A-Z_]*__//g" ./.env

## RUN DATABASE MIGRATION
npm run migration:run

## START APPLICATION
npm run start:prod
