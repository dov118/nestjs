import { validateEnv } from '../../src/config/env-schema';

describe('validateEnv', () => {
  const base = {
    APP_NAME: 'demo',
    APP_PORT: '3000',
  };

  it('should coerce APP_PORT to a number', (): void => {
    expect(validateEnv({ ...base }).APP_PORT).toBe(3000);
  });

  it('should default DB_TYPE to sqlite and DB_NAME to the dev file', (): void => {
    const config = validateEnv({ ...base });
    expect(config.DB_TYPE).toBe('sqlite');
    expect(config.DB_NAME).toBe('src/database/development');
  });

  it('should coerce DB_DEBUG to a boolean and default it to false', (): void => {
    expect(validateEnv({ ...base }).DB_DEBUG).toBe(false);
    expect(validateEnv({ ...base, DB_DEBUG: 'true' }).DB_DEBUG).toBe(true);
  });

  it('should throw when APP_NAME is missing', (): void => {
    expect((): unknown => validateEnv({ APP_PORT: '3000' })).toThrow(
      /APP_NAME/,
    );
  });

  it('should reject an unsupported DB_TYPE', (): void => {
    expect((): unknown =>
      validateEnv({ ...base, DB_TYPE: 'postgres' }),
    ).toThrow(/DB_TYPE/);
  });

  it('should require host keys when DB_TYPE is mysql', (): void => {
    expect((): unknown => validateEnv({ ...base, DB_TYPE: 'mysql' })).toThrow(
      /DB_HOST/,
    );
  });

  it('should accept a complete mysql configuration', (): void => {
    const config = validateEnv({
      ...base,
      DB_TYPE: 'mysql',
      DB_HOST: 'db',
      DB_PORT: '3306',
      DB_USER: 'app',
      DB_PASSWORD: 'secret',
    });
    expect(config.DB_TYPE).toBe('mysql');
    expect(config.DB_PORT).toBe(3306);
  });
});
