import { getEnv } from '../../src/config/env';

describe('getEnv', () => {
  const originalEnv = process.env;

  beforeEach((): void => {
    process.env = { ...originalEnv };
  });

  afterAll((): void => {
    process.env = originalEnv;
  });

  it('should return the value when the env var is defined', (): void => {
    process.env.SOME_VAR = 'hello';
    expect(getEnv('SOME_VAR')).toBe('hello');
  });

  it('should throw when the env var is undefined', (): void => {
    delete process.env.MISSING_VAR;
    expect((): string => getEnv('MISSING_VAR')).toThrow(
      'Missing required environment variable: MISSING_VAR',
    );
  });
});
