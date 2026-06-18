import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthModule } from '../../../src/modules/health/health.module';
import { testDataSourceOptions } from '../../typeorm.config';

describe('HealthModule', () => {
  let moduleRef: TestingModule;

  afterEach(async (): Promise<void> => {
    await moduleRef.close();
  });

  it('should compile and initialize HealthModule without throwing', async (): Promise<void> => {
    moduleRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testDataSourceOptions), HealthModule],
    }).compile();

    await moduleRef.init();

    expect(moduleRef).toBeDefined();
  });
});
