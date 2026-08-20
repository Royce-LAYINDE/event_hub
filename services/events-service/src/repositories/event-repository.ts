import type pg from 'pg';
import { randomUUID } from 'node:crypto';
import { AppError } from '../errors.js';
import type { CreateEventInput, EventEntity, EventFilters, ReservationResult, UpdateEventInput } from '../types.js';

export interface EventRepository {
  list(filters: EventFilters): Promise<EventEntity[]>;
  findById(id: string): Promise<EventEntity | null>;
  create(input: CreateEventInput): Promise<EventEntity>;
  update(id: string, input: UpdateEventInput): Promise<EventEntity | null>;
  delete(id: string): Promise<boolean>;
  reserve(eventId: string, registrationId: string): Promise<ReservationResult | null>;
  release(registrationId: string): Promise<boolean>;
}

function mapEvent(row: Record<string, unknown>): EventEntity {
  const capacity = Number(row.capacity);
  const registeredCount = Number(row.registered_count);
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    startsAt: new Date(String(row.starts_at)).toISOString(),
    location: String(row.location),
    capacity,
    registeredCount,
    remainingPlaces: Math.max(0, capacity - registeredCount),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PostgresEventRepository implements EventRepository {
  constructor(private readonly pool: pg.Pool) {}

  async list(filters: EventFilters): Promise<EventEntity[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filters.from) {
      values.push(filters.from);
      clauses.push(`starts_at >= $${values.length}`);
    }
    if (filters.to) {
      values.push(filters.to);
      clauses.push(`starts_at <= $${values.length}`);
    }
    if (filters.location) {
      values.push(`%${filters.location}%`);
      clauses.push(`location ILIKE $${values.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await this.pool.query(`SELECT * FROM events ${where} ORDER BY starts_at ASC`, values);
    return result.rows.map(mapEvent);
  }

  async findById(id: string): Promise<EventEntity | null> {
    const result = await this.pool.query('SELECT * FROM events WHERE id = $1', [id]);
    return result.rowCount ? mapEvent(result.rows[0]) : null;
  }

  async create(input: CreateEventInput): Promise<EventEntity> {
    const result = await this.pool.query(
      `INSERT INTO events (id, title, description, starts_at, location, capacity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [randomUUID(), input.title, input.description, input.startsAt, input.location, input.capacity],
    );
    return mapEvent(result.rows[0]);
  }

  async update(id: string, input: UpdateEventInput): Promise<EventEntity | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const nextCapacity = input.capacity ?? current.capacity;
    if (nextCapacity < current.registeredCount) {
      throw new AppError(409, 'CAPACITY_TOO_LOW', 'La capacite ne peut pas etre inferieure au nombre d inscrits.');
    }
    const result = await this.pool.query(
      `UPDATE events SET title = $2, description = $3, starts_at = $4, location = $5,
       capacity = $6, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, input.title ?? current.title, input.description ?? current.description, input.startsAt ?? current.startsAt, input.location ?? current.location, nextCapacity],
    );
    return mapEvent(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async reserve(eventId: string, registrationId: string): Promise<ReservationResult | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const eventResult = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
      if (!eventResult.rowCount) {
        await client.query('ROLLBACK');
        return null;
      }

      const existing = await client.query('SELECT event_id FROM event_reservations WHERE registration_id = $1', [registrationId]);
      if (existing.rowCount) {
        const event = mapEvent(eventResult.rows[0]);
        await client.query('COMMIT');
        return { event, reserved: true, alreadyReserved: true };
      }

      const event = mapEvent(eventResult.rows[0]);
      if (event.remainingPlaces <= 0) {
        await client.query('ROLLBACK');
        return { event, reserved: false, alreadyReserved: false };
      }

      await client.query('INSERT INTO event_reservations (registration_id, event_id) VALUES ($1, $2)', [registrationId, eventId]);
      const updated = await client.query(
        'UPDATE events SET registered_count = registered_count + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
        [eventId],
      );
      await client.query('COMMIT');
      return { event: mapEvent(updated.rows[0]), reserved: true, alreadyReserved: false };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async release(registrationId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const deleted = await client.query(
        'DELETE FROM event_reservations WHERE registration_id = $1 RETURNING event_id',
        [registrationId],
      );
      if (!deleted.rowCount) {
        await client.query('COMMIT');
        return false;
      }
      await client.query(
        'UPDATE events SET registered_count = GREATEST(registered_count - 1, 0), updated_at = NOW() WHERE id = $1',
        [deleted.rows[0].event_id],
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
