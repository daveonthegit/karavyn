import { env } from './config/env.js';
import { buildApp } from './app.js';

async function main() {
  const app = await buildApp();

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`Karavyn API running on port ${env.PORT}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
