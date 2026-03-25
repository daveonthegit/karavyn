import { NotFoundError } from '../../lib/errors.js';
import { usersRepository } from './users.repository.js';

interface UpsertUserData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
}

interface UpdateProfileData {
  displayName?: string;
  avatarUrl?: string | null;
}

class UsersService {
  async getById(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async upsert(data: UpsertUserData) {
    return usersRepository.upsert(data);
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await usersRepository.update(userId, data);
    if (!user) throw new NotFoundError('User');
    return user;
  }
}

export const usersService = new UsersService();
