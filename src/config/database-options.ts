import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { AppConfig } from './env-schema';
import { CreateUserTable1781710175911 } from '../database/migrations/1781710175911CreateUserTable';
import { userFactory } from '../database/factories/user.factory';
import { User } from '../modules/user/entities/user.entity';

export function buildDataSourceOptions(
  config: ConfigService<AppConfig, true>,
): DataSourceOptions & SeederOptions {
  const common = {
    synchronize: false,
    entities: [User],
    migrations: [CreateUserTable1781710175911],
    factories: [userFactory],
    migrationsRun: false,
    logging: config.getOrThrow('DB_DEBUG', { infer: true }),
    dropSchema: false,
  };

  switch (config.getOrThrow('DB_TYPE', { infer: true })) {
    case 'mysql':
      return {
        type: 'mysql',
        host: config.getOrThrow('DB_HOST', { infer: true }),
        port: config.getOrThrow('DB_PORT', { infer: true }),
        username: config.getOrThrow('DB_USER', { infer: true }),
        password: config.getOrThrow('DB_PASSWORD', { infer: true }),
        database: config.getOrThrow('DB_NAME', { infer: true }),
        ...common,
      };
    case 'sqlite':
      return {
        type: 'sqlite',
        database: config.getOrThrow('DB_NAME', { infer: true }),
        ...common,
      };
  }
}
