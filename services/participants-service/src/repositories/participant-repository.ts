import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import type { CreateParticipantInput, ParticipantEntity, UpdateParticipantInput } from '../types.js';

export interface ParticipantRepository {
  list(search?: string): Promise<ParticipantEntity[]>;
  findById(id: string): Promise<ParticipantEntity | null>;
  create(input: CreateParticipantInput): Promise<ParticipantEntity>;
  update(id: string, input: UpdateParticipantInput): Promise<ParticipantEntity | null>;
  delete(id: string): Promise<boolean>;
}

function mapParticipant(row: Record<string, unknown>): ParticipantEntity {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    type: row.type as ParticipantEntity['type'],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PostgresParticipantRepository implements ParticipantRepository {
  constructor(private readonly pool: pg.Pool) {}

  async list(search?: string): Promise<ParticipantEntity[]> {
    const result = search
      ? await this.pool.query('SELECT * FROM participants WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY name', [`%${search}%`])
      : await this.pool.query('SELECT * FROM participants ORDER BY name');
    return result.rows.map(mapParticipant);
  }

  async findById(id: string): Promise<ParticipantEntity | null> {
    const result = await this.pool.query('SELECT * FROM participants WHERE id = $1', [id]);
    return result.rowCount ? mapParticipant(result.rows[0]) : null;
  }

  async create(input: CreateParticipantInput): Promise<ParticipantEntity> {
    const result = await this.pool.query(
      `INSERT INTO participants (id, name, email, phone, type) VALUES ($1, $2, LOWER($3), $4, $5) RETURNING *`,
      [randomUUID(), input.name, input.email, input.phone, input.type],
    );
    return mapParticipant(result.rows[0]);
  }

  async update(id: string, input: UpdateParticipantInput): Promise<ParticipantEntity | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const result = await this.pool.query(
      `UPDATE participants SET name = $2, email = LOWER($3), phone = $4, type = $5, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, input.name ?? current.name, input.email ?? current.email, input.phone ?? current.phone, input.type ?? current.type],
    );
    return mapParticipant(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM participants WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
