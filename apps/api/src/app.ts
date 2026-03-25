import Fastify from 'fastify';

import { env } from './config/env.js';
import { AppError } from './lib/errors.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export async function buildApp() {
  const usePrettyLogs =
    env.NODE_ENV !== 'production' && process.stdout.isTTY === true;

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: usePrettyLogs
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof Error && 'validation' in error) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: (error as Error & { validation: unknown }).validation,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(usersRoutes, { prefix: '/api' });

  return app;
}
