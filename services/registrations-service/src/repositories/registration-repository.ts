import type pg from 'pg';
import type { RegistrationEntity, RegistrationFilters, RegistrationStats } from '../types.js';

export interface RegistrationRepository {
  list(filters?: RegistrationFilters): Promise<RegistrationEntity[]>;
  findById(id: string): Promise<RegistrationEntity | null>;
  findActive(eventId: string, participantId: string): Promise<RegistrationEntity | null>;
  create(id: string, eventId: string, participantId: string): Promise<RegistrationEntity>;
  cancel(id: string): Promise<RegistrationEntity | null>;
  stats(): Promise<RegistrationStats>;
}

function mapRegistration(row: Record<string, unknown>): RegistrationEntity {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    participantId: String(row.participant_id),
    status: row.status as RegistrationEntity['status'],
    createdAt: new Date(String(row.created_at)).toISOString(),
    cancelledAt: row.cancelled_at ? new Date(String(row.cancelled_at)).toISOString() : null,
  };
}

export class PostgresRegistrationRepository implements RegistrationRepository {
  constructor(private readonly pool: pg.Pool) {}

  async list(filters: RegistrationFilters = {}): Promise<RegistrationEntity[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.eventId) { values.push(filters.eventId); clauses.push(`event_id = $${values.length}`); }
    if (filters.participantId) { values.push(filters.participantId); clauses.push(`participant_id = $${values.length}`); }
    if (filters.status) { values.push(filters.status); clauses.push(`status = $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await this.pool.query(`SELECT * FROM registrations ${where} ORDER BY created_at DESC`, values);
    return result.rows.map(mapRegistration);
  }

  async findById(id: string): Promise<RegistrationEntity | null> {
    const result = await this.pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
    return result.rowCount ? mapRegistration(result.rows[0]) : null;
  }

  async findActive(eventId: string, participantId: string): Promise<RegistrationEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM registrations WHERE event_id = $1 AND participant_id = $2 AND status = 'CONFIRMED'`,
      [eventId, participantId],
    );
    return result.rowCount ? mapRegistration(result.rows[0]) : null;
  }

  async create(id: string, eventId: string, participantId: string): Promise<RegistrationEntity> {
    const result = await this.pool.query(
      `INSERT INTO registrations (id, event_id, participant_id) VALUES ($1, $2, $3) RETURNING *`,
      [id, eventId, participantId],
    );
    return mapRegistration(result.rows[0]);
  }

  async cancel(id: string): Promise<RegistrationEntity | null> {
    const result = await this.pool.query(
      `UPDATE registrations SET status = 'CANCELLED', cancelled_at = NOW()
       WHERE id = $1 AND status = 'CONFIRMED' RETURNING *`,
      [id],
    );
    return result.rowCount ? mapRegistration(result.rows[0]) : null;
  }

  async stats(): Promise<RegistrationStats> {
    const [totals, byEvent] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled FROM registrations`),
      this.pool.query(`SELECT event_id, COUNT(*)::int AS count FROM registrations
        WHERE status = 'CONFIRMED' GROUP BY event_id ORDER BY count DESC`),
    ]);
    return {
      total: totals.rows[0].total,
      confirmed: totals.rows[0].confirmed,
      cancelled: totals.rows[0].cancelled,
      byEvent: byEvent.rows.map((row) => ({ eventId: String(row.event_id), count: Number(row.count) })),
    };
  }
}
