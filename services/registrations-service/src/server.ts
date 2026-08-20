import { createApp } from './app.js';
import { HttpEventsClient, HttpParticipantsClient } from './clients/service-clients.js';
import { getConfig } from './config.js';
import { createPool } from './db/pool.js';
import { schemaSql } from './db/schema.js';
import { PostgresRegistrationRepository } from './repositories/registration-repository.js';

const config = getConfig();
const pool = createPool(config.DATABASE_URL);
await pool.query(schemaSql);

const app = createApp(
  new PostgresRegistrationRepository(pool),
  new HttpEventsClient(config.EVENTS_SERVICE_URL),
  new HttpParticipantsClient(config.PARTICIPANTS_SERVICE_URL),
  config.CORS_ORIGIN,
);
const server = app.listen(config.PORT, () => console.log(`registrations-service ecoute sur le port ${config.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal}: arret de registrations-service`);
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
