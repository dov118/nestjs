import { Repository } from 'typeorm';
import { SeederFactory, useSeederFactory } from 'typeorm-extension';

import { User } from '../../../src/modules/user/entities/user.entity';
import '../../../src/database/factories/user.factory';
import { getDataSource, setupDatabase } from '../../setup-typeorm';

describe('UserFactory', () => {
  const factory = (): SeederFactory<User> => useSeederFactory(User);

  it('should generate a user with every required field populated', async (): Promise<void> => {
    const user = await factory().make();

    expect(typeof user.firstName).toBe('string');
    expect(user.firstName.length).toBeGreaterThan(0);
    expect(typeof user.lastName).toBe('string');
    expect(user.lastName.length).toBeGreaterThan(0);

    const [localPart, domainPart] = user.email.split('@');
    expect(user.email.split('@')).toHaveLength(2);
    expect(localPart.length).toBeGreaterThan(0);
    expect(domainPart).toContain('.');
  });

  it('should let overrides take precedence while keeping other fields generated', async (): Promise<void> => {
    const user = await factory().make({ email: 'override@example.com' });

    expect(user.email).toBe('override@example.com');
    expect(user.firstName.length).toBeGreaterThan(0);
    expect(user.lastName.length).toBeGreaterThan(0);
  });

  describe('persistence', () => {
    setupDatabase();

    it('should produce an entity that persists and receives an id', async (): Promise<void> => {
      const repository: Repository<User> = getDataSource().getRepository(User);

      const saved = await repository.save(await factory().make());

      expect(typeof saved.id).toBe('number');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });
});
