import type { FastifyPluginAsync } from 'fastify';
import { Webhook } from 'svix';

import { env } from '../../config/env.js';
import { usersService } from '../users/users.service.js';

interface ClerkWebhookUserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  email_addresses: Array<{ email_address: string }>;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkWebhookUserData;
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhooks/clerk', async (request, reply) => {
    if (!env.CLERK_WEBHOOK_SECRET) {
      fastify.log.warn('CLERK_WEBHOOK_SECRET not set, skipping verification');
      return reply.status(500).send({ error: { code: 'CONFIG_ERROR', message: 'Webhook secret not configured' } });
    }

    const svixId = request.headers['svix-id'] as string;
    const svixTimestamp = request.headers['svix-timestamp'] as string;
    const svixSignature = request.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return reply.status(400).send({
        error: { code: 'INVALID_WEBHOOK', message: 'Missing svix headers' },
      });
    }

    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(JSON.stringify(request.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      return reply.status(400).send({
        error: { code: 'INVALID_WEBHOOK', message: 'Webhook verification failed' },
      });
    }

    const { type, data } = event;

    if (type === 'user.created' || type === 'user.updated') {
      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'User';
      const email = data.email_addresses?.[0]?.email_address ?? null;

      await usersService.upsert({
        id: data.id,
        displayName,
        avatarUrl: data.image_url ?? null,
        email,
      });

      fastify.log.info({ userId: data.id, type }, 'User synced from Clerk webhook');
    }

    return reply.status(200).send({ received: true });
  });
};
