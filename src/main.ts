import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { getEnvNumber } from './config/env';
import { WinstonService } from './service/winston/winston.service';

config({ quiet: true });

export async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WinstonService));

  app.use(morgan('combined'));

  app.enableShutdownHooks();

  await app.listen(getEnvNumber('APP_PORT'));
}

void bootstrap();
