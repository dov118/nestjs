import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as morgan from 'morgan';

import { AppConfig } from './config/env-schema';
import { AppModule } from './app.module';
import { WinstonService } from './common/logger/winston.service';

export async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WinstonService));

  app.use(morgan('combined'));

  app.enableShutdownHooks();

  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  await app.listen(config.getOrThrow('APP_PORT', { infer: true }));
}

void bootstrap();
