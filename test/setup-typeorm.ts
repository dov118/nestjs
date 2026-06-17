import { DataSource } from 'typeorm';

import { testDataSourceOptions } from './typeorm.config';

let dataSource: DataSource;

export function getDataSource(): DataSource {
  return dataSource;
}

export function setupDatabase(): void {
  beforeEach(async (): Promise<void> => {
    dataSource = new DataSource(testDataSourceOptions);
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterEach(async (): Promise<void> => {
    await dataSource.destroy();
  });
}
