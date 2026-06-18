import './dotenv';

import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { CreateUserTable1781710175911 } from '../database/migrations/1781710175911CreateUserTable';
import { userFactory } from '../database/factories/user.factory';
import { User } from '../modules/user/entities/user.entity';
import { getEnv, getEnvNumber } from './env';

function buildDataSourceOptions(): DataSourceOptions & SeederOptions {
  const common = {
    synchronize: false,
    entities: [User],
    migrations: [CreateUserTable1781710175911],
    factories: [userFactory],
    migrationsRun: false,
    logging: getEnv('DB_DEBUG', 'false') === 'true',
    dropSchema: false,
  };

  const dbType = getEnv('DB_TYPE', 'sqlite');
  switch (dbType) {
    case 'mysql':
      return {
        type: 'mysql',
        host: getEnv('DB_HOST'),
        port: getEnvNumber('DB_PORT'),
        username: getEnv('DB_USER'),
        password: getEnv('DB_PASSWORD'),
        database: getEnv('DB_NAME', 'src/database/development'),
        ...common,
      };
    case 'sqlite':
      return {
        type: 'sqlite',
        database: getEnv('DB_NAME', 'src/database/development'),
        ...common,
      };
    default:
      throw new Error(`Unsupported DB_TYPE: ${dbType}`);
  }
}

export const dataSourceOptions: DataSourceOptions & SeederOptions =
  buildDataSourceOptions();

export const dataSource: DataSource = new DataSource(dataSourceOptions);
