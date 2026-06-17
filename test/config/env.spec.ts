import { getEnv, getEnvNumber } from '../../src/config/env';

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

describe('getEnvNumber', () => {
  const originalEnv = process.env;

  beforeEach((): void => {
    process.env = { ...originalEnv };
  });

  afterAll((): void => {
    process.env = originalEnv;
  });

  it('should parse and return the number when the env var is numeric', (): void => {
    process.env.SOME_NUMBER = '3000';
    expect(getEnvNumber('SOME_NUMBER')).toBe(3000);
  });

  it('should throw when the env var is undefined', (): void => {
    delete process.env.MISSING_NUMBER;
    expect((): number => getEnvNumber('MISSING_NUMBER')).toThrow(
      'Missing required environment variable: MISSING_NUMBER',
    );
  });

  it('should throw when the env var is not a valid number', (): void => {
    process.env.BAD_NUMBER = 'not-a-number';
    expect((): number => getEnvNumber('BAD_NUMBER')).toThrow(
      'Environment variable BAD_NUMBER is not a valid number: not-a-number',
    );
  });
});
