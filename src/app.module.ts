import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from './config/typeorm.config';
import { WinstonService } from './service/winston/winston.service';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), ScheduleModule.forRoot()],
  controllers: [],
  providers: [WinstonService],
  exports: [WinstonService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
