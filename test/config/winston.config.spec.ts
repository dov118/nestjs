import { ConfigService } from '@nestjs/config';
import { Writable } from 'stream';
import * as winston from 'winston';
import type { Logger } from 'winston';

import { AppConfig, validateEnv } from '../../src/config/env-schema';
import { createWinstonLogger } from '../../src/config/winston.config';

describe('createWinstonLogger', () => {
  const originalEnv = process.env;
  const APP_NAME = 'demo';
  const POD_NAME = 'demo-pod-abc123';

  beforeEach((): void => {
    process.env = { ...originalEnv };
    process.env.APP_NAME = APP_NAME;
    process.env.APP_PORT = '3000';
  });

  afterAll((): void => {
    process.env = originalEnv;
  });

  function buildConfig(): ConfigService<AppConfig, true> {
    return new ConfigService<AppConfig, true>(validateEnv(process.env));
  }

  function capture(logger: Logger): { read: () => string } {
    let output = '';
    const stream = new Writable({
      write(chunk: Buffer, _encoding: string, callback: () => void): void {
        output += chunk.toString();
        callback();
      },
    });
    logger.add(new winston.transports.Stream({ stream }));
    return { read: (): string => output };
  }

  it('should use LOG_LEVEL when it is defined', (): void => {
    process.env.LOG_LEVEL = 'debug';
    expect(createWinstonLogger(buildConfig()).level).toBe('debug');
  });

  it('should default to info when LOG_LEVEL is undefined', (): void => {
    delete process.env.LOG_LEVEL;
    expect(createWinstonLogger(buildConfig()).level).toBe('info');
  });

  it('should render an ISO 8601 timestamp, the app name and the pid', async (): Promise<void> => {
    const logger = createWinstonLogger(buildConfig());
    const captured = capture(logger);

    logger.info('hello', { context: 'Test' });
    await new Promise<void>((resolve): void => {
      setImmediate(resolve);
    });

    expect(captured.read()).toContain(`[${APP_NAME}]`);
    expect(captured.read()).toContain(String(process.pid));
    expect(captured.read()).toMatch(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
    );
  });

  it('should append the pod name to the label when POD_NAME is defined', async (): Promise<void> => {
    process.env.POD_NAME = POD_NAME;
    const logger = createWinstonLogger(buildConfig());
    const captured = capture(logger);

    logger.info('hello', { context: 'Test' });
    await new Promise<void>((resolve): void => {
      setImmediate(resolve);
    });

    expect(captured.read()).toContain(`[${APP_NAME}@${POD_NAME}]`);
  });
});
