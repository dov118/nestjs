import { DataSourceOptions } from 'typeorm';

import { CreateUserTable1781710175911 } from '../src/database/migrations/1781710175911CreateUserTable';
import { User } from '../src/resource/user/entities/user.entity';

export const testDataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as 'sqlite',
  database: process.env.DB_NAME,
  entities: [User],
  migrations: [CreateUserTable1781710175911],
  synchronize: false,
  dropSchema: true,
};
