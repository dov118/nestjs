import { User } from '../../modules/user/entities/user.entity';

export const USER_SEED_DATA: Pick<User, 'firstName' | 'lastName' | 'email'>[] =
  [
    {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice.martin@example.com',
    },
    { firstName: 'Bob', lastName: 'Dupont', email: 'bob.dupont@example.com' },
  ];
