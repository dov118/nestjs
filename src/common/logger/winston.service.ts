import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';

import { AppConfig } from '../../config/env-schema';
import { createWinstonLogger } from '../../config/winston.config';

@Injectable()
export class WinstonService implements LoggerService {
  private readonly logger: Logger;

  constructor(config: ConfigService<AppConfig, true>) {
    this.logger = createWinstonLogger(config);
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  fatal(message: string, trace: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  error(message: string, trace: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
