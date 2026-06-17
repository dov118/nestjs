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

## RUN DATABASE MIGRATION
npm run migration:run

## START APPLICATION
npm run start:prod
