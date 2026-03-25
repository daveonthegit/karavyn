import type { FastifyPluginAsync } from 'fastify';
import { updateUserSchema } from '@karavyn/shared';

import { requireAuth } from '../auth/auth.middleware.js';
import { usersService } from './users.service.js';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAuth);

  fastify.get('/users/me', async (request, reply) => {
    const user = await usersService.getById(request.userId);
    return reply.send(user);
  });

  fastify.patch('/users/me', async (request, reply) => {
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      });
    }

    const user = await usersService.updateProfile(request.userId, parsed.data);
    return reply.send(user);
  });
};
