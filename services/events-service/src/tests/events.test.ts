import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { EventRepository } from '../repositories/event-repository.js';
import type { EventEntity } from '../types.js';

const event: EventEntity = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Conference IA',
  description: 'Une conference consacree a l intelligence artificielle.',
  startsAt: '2026-08-14T09:00:00.000Z',
  location: 'Auditorium DIT',
  capacity: 100,
  registeredCount: 25,
  remainingPlaces: 75,
  createdAt: '2026-08-05T10:00:00.000Z',
  updatedAt: '2026-08-05T10:00:00.000Z',
};

function fakeRepository(): EventRepository {
  return {
    list: async () => [event],
    findById: async (id) => id === event.id ? event : null,
    create: async (input) => ({ ...event, ...input }),
    update: async (id, input) => id === event.id ? { ...event, ...input } : null,
    delete: async (id) => id === event.id,
    reserve: async (id) => id === event.id ? { event: { ...event, registeredCount: 26, remainingPlaces: 74 }, reserved: true, alreadyReserved: false } : null,
    release: async () => true,
  };
}

describe('events-service', () => {
  const app = createApp(fakeRepository());

  it('liste les evenements', async () => {
    const response = await request(app).get('/api/events').expect(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('retourne la disponibilite', async () => {
    const response = await request(app).get(`/api/events/${event.id}/availability`).expect(200);
    expect(response.body.data.remainingPlaces).toBe(75);
  });

  it('rejette un evenement invalide', async () => {
    const response = await request(app).post('/api/events').send({ title: 'X' }).expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
