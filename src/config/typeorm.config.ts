import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { UserSeeder } from '../database/seeds/user.seeder';
import { User } from '../resource/user/entities/user.entity';

config({ quiet: true });

const customDataSourceOptions: {
  mysql: DataSourceOptions & SeederOptions;
  sqlite: DataSourceOptions & SeederOptions;
} = { mysql: null, sqlite: null };

customDataSourceOptions.mysql = {
  type: process.env.DB_TYPE as 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: [User],
  migrations: ['dist/database/migrations/*.js'],
  seeds: [UserSeeder],
  factories: [],
  migrationsRun: false,
  logging: process.env.DB_DEBUG === 'true',
  dropSchema: false,
};

customDataSourceOptions.sqlite = {
  type: process.env.DB_TYPE as 'sqlite',
  database: process.env.DB_NAME,
  synchronize: false,
  entities: [User],
  migrations: ['dist/database/migrations/*.js'],
  seeds: [UserSeeder],
  factories: [],
  migrationsRun: false,
  logging: process.env.DB_DEBUG === 'true',
  dropSchema: false,
};

export const dataSourceOptions: DataSourceOptions & SeederOptions =
  customDataSourceOptions[
    process.env.DB_TYPE as keyof typeof customDataSourceOptions
  ];

export const dataSource: DataSource = new DataSource(dataSourceOptions);
