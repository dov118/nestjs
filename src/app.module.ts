import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from './config/typeorm.config';
import { IntervalService } from './service/interval/interval.service';
import { WinstonService } from './service/winston/winston.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [WinstonService, IntervalService],
  exports: [WinstonService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
