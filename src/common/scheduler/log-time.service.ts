import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { getEnvNumber } from '../../config/env';
import { WinstonService } from '../logger/winston.service';

@Injectable()
export class LogTimeService {
  constructor(private readonly winstonService: WinstonService) {}

  @Interval(getEnvNumber('INTERVAL_MS', 10000))
  logTime(): void {
    this.winstonService.log(new Date().toISOString(), LogTimeService.name);
  }
}
