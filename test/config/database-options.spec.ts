import { ConfigService } from '@nestjs/config';

import { AppConfig, validateEnv } from '../../src/config/env-schema';
import { buildDataSourceOptions } from '../../src/config/database-options';

describe('buildDataSourceOptions', () => {
  const originalEnv = process.env;

  beforeEach((): void => {
    process.env = { ...originalEnv };
    process.env.APP_NAME = 'demo';
    process.env.APP_PORT = '3000';
    delete process.env.DB_TYPE;
    delete process.env.DB_NAME;
    delete process.env.DB_DEBUG;
  });

  afterAll((): void => {
    process.env = originalEnv;
  });

  function buildConfig(): ConfigService<AppConfig, true> {
    return new ConfigService<AppConfig, true>(validateEnv(process.env));
  }

  it('should default to a sqlite data source', (): void => {
    const options = buildDataSourceOptions(buildConfig());
    expect(options.type).toBe('sqlite');
    expect(options).toMatchObject({
      database: 'src/database/development',
      synchronize: false,
    });
  });

  it('should build a mysql data source from host env vars', (): void => {
    process.env.DB_TYPE = 'mysql';
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '3306';
    process.env.DB_USER = 'app';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_NAME = 'app_db';

    const options = buildDataSourceOptions(buildConfig());

    expect(options).toMatchObject({
      type: 'mysql',
      host: 'db.example.com',
      port: 3306,
      username: 'app',
      password: 'secret',
      database: 'app_db',
    });
  });

  it('should enable logging when DB_DEBUG is true', (): void => {
    process.env.DB_DEBUG = 'true';
    expect(buildDataSourceOptions(buildConfig()).logging).toBe(true);
  });
});
