import { ScheduleModule } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';

import { IntervalService } from '../../../src/service/interval/interval.service';
import { WinstonService } from '../../../src/service/winston/winston.service';

const TEST_INTERVAL_MS = Number(process.env.INTERVAL_MS);
const FIXED_DATE = new Date('2026-06-17T10:00:00Z');

describe('IntervalService', () => {
  let logMock: jest.Mock;
  let appModule: TestingModule;

  beforeEach(async (): Promise<void> => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
    logMock = jest.fn();

    appModule = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        IntervalService,
        { provide: WinstonService, useValue: { log: logMock } },
      ],
    }).compile();

    await appModule.init();
  });

  afterEach(async (): Promise<void> => {
    await appModule.close();
    jest.useRealTimers();
  });

  it('should log local datetime on 3 consecutive ticks at the configured interval', () => {
    jest.advanceTimersByTime(TEST_INTERVAL_MS);
    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenNthCalledWith(
      1,
      new Date(FIXED_DATE.getTime() + TEST_INTERVAL_MS).toLocaleString(),
      IntervalService.name,
    );

    jest.advanceTimersByTime(TEST_INTERVAL_MS);
    expect(logMock).toHaveBeenCalledTimes(2);
    expect(logMock).toHaveBeenNthCalledWith(
      2,
      new Date(FIXED_DATE.getTime() + TEST_INTERVAL_MS * 2).toLocaleString(),
      IntervalService.name,
    );

    jest.advanceTimersByTime(TEST_INTERVAL_MS);
    expect(logMock).toHaveBeenCalledTimes(3);
    expect(logMock).toHaveBeenNthCalledWith(
      3,
      new Date(FIXED_DATE.getTime() + TEST_INTERVAL_MS * 3).toLocaleString(),
      IntervalService.name,
    );
  });
});
