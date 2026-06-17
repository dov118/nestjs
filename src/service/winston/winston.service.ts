import { Injectable, LoggerService } from '@nestjs/common';

import { winstonLogger } from '../../config/winston-config';

@Injectable()
export class WinstonService implements LoggerService {
  log(message: string, context?: string): void {
    winstonLogger.info(message, { context });
  }

  fatal(message: string, trace: string, context?: string): void {
    winstonLogger.error(message, { trace, context });
  }

  error(message: string, trace: string, context?: string): void {
    winstonLogger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    winstonLogger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    winstonLogger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    winstonLogger.verbose(message, { context });
  }
}
