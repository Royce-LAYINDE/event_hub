import { getConfig } from '../config.js';
import { createPool } from './pool.js';
import { schemaSql } from './schema.js';

export async function migrate(connectionString: string): Promise<void> {
  const pool = createPool(connectionString);
  try {
    await pool.query(schemaSql);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate(getConfig().DATABASE_URL)
    .then(() => console.log('events-service: migration terminee'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
