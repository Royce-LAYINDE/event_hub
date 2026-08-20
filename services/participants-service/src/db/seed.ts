import type pg from 'pg';
import { getConfig } from '../config.js';
import { createPool } from './pool.js';

const participants = [
  ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Aminata Ndiaye', 'aminata.ndiaye@dit.sn', '+221 77 123 45 67', 'STUDENT'],
  ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Moussa Fall', 'moussa.fall@dit.sn', '+221 76 234 56 78', 'PROFESSOR'],
  ['cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Fatou Diop', 'fatou.diop@example.com', '+221 78 345 67 89', 'EXTERNAL'],
] as const;

export async function seed(pool: pg.Pool): Promise<void> {
  for (const participant of participants) {
    await pool.query(
      `INSERT INTO participants (id, name, email, phone, type) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [...participant],
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pool = createPool(getConfig().DATABASE_URL);
  seed(pool).then(() => console.log('participants-service: donnees de demonstration inserees')).finally(() => pool.end());
}
