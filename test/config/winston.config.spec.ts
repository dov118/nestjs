import { Writable } from 'stream';
import * as winston from 'winston';
import type { Logger } from 'winston';

async function importLogger(): Promise<Logger> {
  const module = await import('../../src/config/winston.config');
  return module.winstonLogger;
}

describe('winstonLogger', () => {
  const originalEnv = process.env;

  beforeEach((): void => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll((): void => {
    process.env = originalEnv;
  });

  it('should use LOG_LEVEL when it is defined', async (): Promise<void> => {
    process.env.LOG_LEVEL = 'debug';
    const winstonLogger = await importLogger();
    expect(winstonLogger.level).toBe('debug');
  });

  it('should default to info when LOG_LEVEL is undefined', async (): Promise<void> => {
    delete process.env.LOG_LEVEL;
    const winstonLogger = await importLogger();
    expect(winstonLogger.level).toBe('info');
  });

  it('should render an ISO 8601 timestamp, the app name and the pid', async (): Promise<void> => {
    process.env.APP_NAME = 'demo';
    const winstonLogger = await importLogger();

    let output = '';
    const stream = new Writable({
      write(chunk: Buffer, _encoding: string, callback: () => void): void {
        output += chunk.toString();
        callback();
      },
    });
    winstonLogger.add(new winston.transports.Stream({ stream }));
    winstonLogger.info('hello', { context: 'Test' });
    await new Promise<void>((resolve): void => {
      setImmediate(resolve);
    });

    expect(output).toContain('[demo]');
    expect(output).toContain(String(process.pid));
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });
});
