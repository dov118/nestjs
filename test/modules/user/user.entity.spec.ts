import { QueryFailedError, Repository } from 'typeorm';

import { User } from '../../../src/modules/user/entities/user.entity';
import { getDataSource, setupDatabase } from '../../setup-typeorm';

describe('UserEntity', () => {
  setupDatabase();

  it('should persist a user and return it with all fields set', async (): Promise<void> => {
    const repository: Repository<User> = getDataSource().getRepository(User);
    const saved = await repository.save(
      repository.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      }),
    );

    expect(typeof saved.id).toBe('number');
    expect(saved.firstName).toBe('John');
    expect(saved.lastName).toBe('Doe');
    expect(saved.email).toBe('john.doe@example.com');
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it('should reject a second user with the same email', async (): Promise<void> => {
    const repository: Repository<User> = getDataSource().getRepository(User);
    await repository.save(
      repository.create({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
      }),
    );
    let caught: unknown;
    try {
      await repository.save(
        repository.create({
          firstName: 'Bob',
          lastName: 'Jones',
          email: 'alice@example.com',
        }),
      );
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(QueryFailedError);
    expect((caught as QueryFailedError).message).toMatch(
      /UNIQUE constraint failed: user\.email/,
    );
  });
});
