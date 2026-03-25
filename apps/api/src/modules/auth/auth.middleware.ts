import { verifyToken as clerkVerify } from '@clerk/backend';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../../config/env.js';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing token' },
    });
  }

  try {
    const payload = await clerkVerify(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });
    request.userId = payload.sub;
  } catch {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}

export async function verifyToken(token: string): Promise<string> {
  const payload = await clerkVerify(token, {
    secretKey: env.CLERK_SECRET_KEY,
  });
  return payload.sub;
}
