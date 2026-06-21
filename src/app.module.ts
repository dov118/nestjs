import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

import { AppConfig, validateEnv } from './config/env-schema';
import { buildDataSourceOptions } from './config/database-options';
import { HealthModule } from './modules/health/health.module';
import { LogTimeService } from './common/scheduler/log-time.service';
import { WinstonService } from './common/logger/winston.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<AppConfig, true>,
      ): DataSourceOptions & SeederOptions => buildDataSourceOptions(config),
    }),
    ScheduleModule.forRoot(),
    HealthModule,
  ],
  controllers: [],
  providers: [WinstonService, LogTimeService],
  exports: [WinstonService],
})
export class AppModule {}
