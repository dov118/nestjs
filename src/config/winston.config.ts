import './dotenv';

import * as winston from 'winston';
import { Logger } from 'winston';

import { getEnv } from './env';

const ANSI_GREEN = '\x1b[32m';
const ANSI_RESET = '\x1b[39m';

const appName = getEnv('APP_NAME');
const pid = String(process.pid);

const podName = getEnv('POD_NAME', '');
const podNamespace = getEnv('POD_NAMESPACE', '');
const podUid = getEnv('POD_UID', '');
const podIp = getEnv('POD_IP', '');

const appLabel = podName === '' ? appName : `${appName}@${podName}`;

const winstonLogger: Logger = winston.createLogger({
  level: getEnv('LOG_LEVEL', 'info'),
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

export { winstonLogger };
