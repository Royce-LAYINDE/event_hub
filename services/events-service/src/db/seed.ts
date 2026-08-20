import type pg from 'pg';
import { getConfig } from '../config.js';
import { createPool } from './pool.js';

const demoEvents = [
  ['11111111-1111-4111-8111-111111111111', 'DIT AI Conference 2026', "Une journee consacree aux usages responsables de l'intelligence artificielle en Afrique.", '2026-08-14T09:00:00.000Z', 'Auditorium DIT', 180],
  ['22222222-2222-4222-8222-222222222222', 'Atelier MLOps pratique', 'Du notebook au deploiement continu avec Docker, GitHub Actions et monitoring.', '2026-08-17T14:00:00.000Z', 'Lab Innovation', 40],
  ['33333333-3333-4333-8333-333333333333', 'Seminaire Data & Societe', 'Echanges entre etudiants, enseignants et professionnels sur les donnees au Senegal.', '2026-08-20T10:00:00.000Z', 'Salle Teranga', 90],
] as const;

export async function seed(pool: pg.Pool): Promise<void> {
  for (const item of demoEvents) {
    await pool.query(
      `INSERT INTO events (id, title, description, starts_at, location, capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [...item],
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pool = createPool(getConfig().DATABASE_URL);
  seed(pool)
    .then(() => console.log('events-service: donnees de demonstration inserees'))
    .finally(() => pool.end());
}
