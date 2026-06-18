import { setSeederFactory } from 'typeorm-extension';

import { User } from '../../modules/user/entities/user.entity';

export const userFactory = setSeederFactory(User, (faker): User => {
  const user = new User();
  user.firstName = faker.person.firstName();
  user.lastName = faker.person.lastName();
  user.email = faker.internet.email();
  return user;
});
