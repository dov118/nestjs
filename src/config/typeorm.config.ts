import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { UserSeeder } from '../database/seeds/user.seeder';
import { User } from '../resource/user/entities/user.entity';
import { getEnv } from './env';

config({ quiet: true });

function buildMysqlOptions(): DataSourceOptions & SeederOptions {
  return {
    type: 'mysql',
    host: getEnv('DB_HOST'),
    port: Number(getEnv('DB_PORT')),
    username: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
    database: getEnv('DB_NAME'),
    synchronize: false,
    entities: [User],
    migrations: ['dist/database/migrations/*.js'],
    seeds: [UserSeeder],
    factories: [],
    migrationsRun: false,
    logging: getEnv('DB_DEBUG') === 'true',
    dropSchema: false,
  };
}

function buildSqliteOptions(): DataSourceOptions & SeederOptions {
  return {
    type: 'sqlite',
    database: getEnv('DB_NAME'),
    synchronize: false,
    entities: [User],
    migrations: ['dist/database/migrations/*.js'],
    seeds: [UserSeeder],
    factories: [],
    migrationsRun: false,
    logging: getEnv('DB_DEBUG') === 'true',
    dropSchema: false,
  };
}

function buildDataSourceOptions(): DataSourceOptions & SeederOptions {
  const dbType = getEnv('DB_TYPE');
  switch (dbType) {
    case 'mysql':
      return buildMysqlOptions();
    case 'sqlite':
      return buildSqliteOptions();
    default:
      throw new Error(`Unsupported DB_TYPE: ${dbType}`);
  }
}

export const dataSourceOptions: DataSourceOptions & SeederOptions =
  buildDataSourceOptions();

export const dataSource: DataSource = new DataSource(dataSourceOptions);
