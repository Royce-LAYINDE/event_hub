import { getConfig } from './config.js';
import { createPool } from './db/pool.js';
import { schemaSql } from './db/schema.js';
import { seed } from './db/seed.js';
import { createApp } from './app.js';
import { PostgresEventRepository } from './repositories/event-repository.js';

const config = getConfig();
const pool = createPool(config.DATABASE_URL);

await pool.query(schemaSql);
if (config.SEED_DEMO_DATA === 'true') await seed(pool);

const app = createApp(new PostgresEventRepository(pool), config.CORS_ORIGIN);
const server = app.listen(config.PORT, () => console.log(`events-service ecoute sur le port ${config.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal}: arret de events-service`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
