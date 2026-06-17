import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';

describe('AppModule', () => {
  let moduleRef: TestingModule;

  afterEach(async (): Promise<void> => {
    await moduleRef.close();
  });

  it('should compile and initialize AppModule without throwing', async (): Promise<void> => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();

    expect(moduleRef).toBeDefined();
  });
});
