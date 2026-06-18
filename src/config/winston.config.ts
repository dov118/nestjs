import './dotenv';

import * as winston from 'winston';
import { Logger } from 'winston';

import { getEnv } from './env';

const ANSI_GREEN = '\x1b[32m';
const ANSI_RESET = '\x1b[39m';

const appName = getEnv('APP_NAME');
const pid = String(process.pid);

const winstonLogger: Logger = winston.createLogger({
  level: getEnv('LOG_LEVEL', 'info'),
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
        `${ANSI_GREEN}[${appName}] ${pid}  - ${ANSI_RESET}${timestamp}${ANSI_GREEN}     ${level.toUpperCase()} [${context}] : ${message}${ANSI_RESET}`,
    ),
  ),
  silent: false,
  transports: [new winston.transports.Console()],
});

export { winstonLogger };
