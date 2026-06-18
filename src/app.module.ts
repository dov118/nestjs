import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from './config/typeorm.config';
import { IntervalService } from './common/scheduler/interval.service';
import { WinstonService } from './common/logger/winston.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [WinstonService, IntervalService],
  exports: [WinstonService],
})
export class AppModule {}
