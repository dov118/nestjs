import './dotenv';

import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AppConfig, validateEnv } from './env-schema';
import { buildDataSourceOptions } from './database-options';

const config = new ConfigService<AppConfig, true>(validateEnv(process.env));

export const dataSource: DataSource = new DataSource(
  buildDataSourceOptions(config),
);
