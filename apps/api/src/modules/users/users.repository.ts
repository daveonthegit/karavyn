import { eq } from 'drizzle-orm';

import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';

interface UpsertUserData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
}

interface UpdateUserData {
  displayName?: string;
  avatarUrl?: string | null;
}

class UsersRepository {
  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async upsert(data: UpsertUserData) {
    const [user] = await db
      .insert(users)
      .values({
        id: data.id,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        email: data.email,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          email: data.email,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async update(id: string, data: UpdateUserData) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }
}

export const usersRepository = new UsersRepository();
