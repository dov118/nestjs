import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { USER_SEED_DATA } from '../data/user.data';
import { User } from '../../modules/user/entities/user.entity';

export class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(User);
    for (const data of USER_SEED_DATA) {
      const exists = await repository.findOneBy({ email: data.email });
      if (exists === null) {
        await repository.save(repository.create(data));
      }
    }
  }
}
