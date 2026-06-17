import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { WinstonService } from './service/winston/winston.service';

config({ quiet: true });

export async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    logger: new WinstonService(),
  });

  app.use(morgan('combined'));

  app.enableShutdownHooks();

  await app.listen(process.env.APP_PORT);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
