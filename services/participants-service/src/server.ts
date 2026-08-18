import { createApp } from './app.js';
import { getConfig } from './config.js';
import { createPool } from './db/pool.js';
import { schemaSql } from './db/schema.js';
import { seed } from './db/seed.js';
import { PostgresParticipantRepository } from './repositories/participant-repository.js';

const config = getConfig();
const pool = createPool(config.DATABASE_URL);
await pool.query(schemaSql);
if (config.SEED_DEMO_DATA === 'true') await seed(pool);

const server = createApp(new PostgresParticipantRepository(pool), config.CORS_ORIGIN)
  .listen(config.PORT, () => console.log(`participants-service ecoute sur le port ${config.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal}: arret de participants-service`);
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
