import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import type { EventsClient, ParticipantsClient } from '../clients/service-clients.js';
import type { RegistrationRepository } from '../repositories/registration-repository.js';
import type { RegistrationEntity } from '../types.js';

const registration: RegistrationEntity = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  eventId: '11111111-1111-4111-8111-111111111111',
  participantId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  status: 'CONFIRMED',
  createdAt: '2026-08-05T10:00:00.000Z',
  cancelledAt: null,
};

function dependencies() {
  const repository: RegistrationRepository = {
    list: async () => [registration],
    findById: async (id) => id === registration.id ? registration : null,
    findActive: async () => null,
    create: async (id, eventId, participantId) => ({ ...registration, id, eventId, participantId }),
    cancel: async (id) => id === registration.id ? { ...registration, status: 'CANCELLED', cancelledAt: '2026-08-05T12:00:00.000Z' } : null,
    stats: async () => ({ total: 1, confirmed: 1, cancelled: 0, byEvent: [{ eventId: registration.eventId, count: 1 }] }),
  };
  const eventsClient: EventsClient = { ensureExists: vi.fn(), reserve: vi.fn(), release: vi.fn() };
  const participantsClient: ParticipantsClient = { ensureExists: vi.fn() };
  return { repository, eventsClient, participantsClient };
}

describe('registrations-service', () => {
  it('inscrit apres verification des autres services', async () => {
    const deps = dependencies();
    const response = await request(createApp(deps.repository, deps.eventsClient, deps.participantsClient))
      .post('/api/registrations')
      .send({ eventId: registration.eventId, participantId: registration.participantId })
      .expect(201);
    expect(response.body.data.status).toBe('CONFIRMED');
    expect(deps.eventsClient.reserve).toHaveBeenCalledOnce();
    expect(deps.participantsClient.ensureExists).toHaveBeenCalledOnce();
  });

  it('annule une inscription et libere la place', async () => {
    const deps = dependencies();
    const response = await request(createApp(deps.repository, deps.eventsClient, deps.participantsClient))
      .delete(`/api/registrations/${registration.id}`)
      .expect(200);
    expect(response.body.data.status).toBe('CANCELLED');
    expect(deps.eventsClient.release).toHaveBeenCalledWith(registration.id);
  });

  it('retourne les statistiques', async () => {
    const deps = dependencies();
    const response = await request(createApp(deps.repository, deps.eventsClient, deps.participantsClient))
      .get('/api/registrations/statistics')
      .expect(200);
    expect(response.body.data.confirmed).toBe(1);
  });
});
