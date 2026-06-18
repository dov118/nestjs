import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { WinstonService } from '../logger/winston.service';

@Injectable()
export class LogTimeService {
  constructor(private readonly winstonService: WinstonService) {}

  @Interval(Number(process.env.INTERVAL_MS ?? '10000'))
  logTime(): void {
    this.winstonService.log(new Date().toLocaleString(), LogTimeService.name);
  }
}
