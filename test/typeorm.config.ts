import { DataSourceOptions } from 'typeorm';

import { getEnv } from '../src/config/env';
import { CreateUserTable1781710175911 } from '../src/database/migrations/1781710175911CreateUserTable';
import { User } from '../src/modules/user/entities/user.entity';

export const testDataSourceOptions: DataSourceOptions = {
  type: getEnv('DB_TYPE') as 'sqlite',
  database: getEnv('DB_NAME'),
  entities: [User],
  migrations: [CreateUserTable1781710175911],
  synchronize: false,
  dropSchema: true,
};
