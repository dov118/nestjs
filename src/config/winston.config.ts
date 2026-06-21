import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { Logger } from 'winston';

import { AppConfig } from './env-schema';

const ANSI_GREEN = '\x1b[32m';
const ANSI_RESET = '\x1b[39m';

export function createWinstonLogger(
  config: ConfigService<AppConfig, true>,
): Logger {
  const appName = config.getOrThrow('APP_NAME', { infer: true });
  const pid = String(process.pid);

  const podName = config.getOrThrow('POD_NAME', { infer: true });
  const podNamespace = config.getOrThrow('POD_NAMESPACE', { infer: true });
  const podUid = config.getOrThrow('POD_UID', { infer: true });
  const podIp = config.getOrThrow('POD_IP', { infer: true });

  const appLabel = podName === '' ? appName : `${appName}@${podName}`;

  return winston.createLogger({
    level: config.getOrThrow('LOG_LEVEL', { infer: true }),
    defaultMeta: { podName, podNamespace, podUid, podIp },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        ({
          level,
          message,
          timestamp,
          context,
        }: {
          level: string;
          message: string;
          timestamp: string;
          context: string;
        }): string =>
          `${ANSI_GREEN}[${appLabel}] ${pid}  - ${ANSI_RESET}${timestamp}${ANSI_GREEN}     ${level.toUpperCase()} [${context}] : ${message}${ANSI_RESET}`,
      ),
    ),
    silent: false,
    transports: [new winston.transports.Console()],
  });
}
