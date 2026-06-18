import { Server } from 'http';

import { INestApplication } from '@nestjs/common';
import {
  HealthCheckResult,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { HealthModule } from '../../../src/modules/health/health.module';
import { testDataSourceOptions } from '../../typeorm.config';

describe('Health (e2e)', () => {
  describe('with a reachable database', () => {
    let app: INestApplication;

    beforeAll(async (): Promise<void> => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [TypeOrmModule.forRoot(testDataSourceOptions), HealthModule],
      }).compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async (): Promise<void> => {
      await app.close();
    });

    it('GET /service/live returns 200 and an ok status', async (): Promise<void> => {
      const response: request.Response = await request(
        app.getHttpServer() as Server,
      ).get('/service/live');

      expect(response.status).toBe(200);
      expect((response.body as HealthCheckResult).status).toBe('ok');
    });

    it('GET /service/ready returns 200 and reports the database up', async (): Promise<void> => {
      const response: request.Response = await request(
        app.getHttpServer() as Server,
      ).get('/service/ready');

      const body = response.body as HealthCheckResult;
      expect(response.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.details.database.status).toBe('up');
    });
  });

  describe('with an unreachable database', () => {
    let app: INestApplication;

    beforeAll(async (): Promise<void> => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [HealthModule],
      })
        .overrideProvider(TypeOrmHealthIndicator)
        .useValue({
          pingCheck: (): Promise<HealthIndicatorResult> =>
            Promise.resolve({ database: { status: 'down' } }),
        })
        .compile();
      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async (): Promise<void> => {
      await app.close();
    });

    it('GET /service/ready returns 503 and reports the database down', async (): Promise<void> => {
      const response: request.Response = await request(
        app.getHttpServer() as Server,
      ).get('/service/ready');

      const body = response.body as HealthCheckResult;
      expect(response.status).toBe(503);
      expect(body.status).toBe('error');
      expect(body.details.database.status).toBe('down');
    });
  });
});
