import './dotenv';

import * as winston from 'winston';
import { Logger } from 'winston';

const winstonLogger: Logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'MM/DD/YYYY, hh:mm:ss A',
    }),
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
        `[32m[${String(process.env.APP_NAME)}] ${String(process.pid)}  - [39m${timestamp}[32m     ${level.toUpperCase()} [${context}] : ${message}[39m`,
    ),
  ),
  silent: false,
  transports: [new winston.transports.Console()],
});

export { winstonLogger };
