import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { ParticipantRepository } from '../repositories/participant-repository.js';
import type { ParticipantEntity } from '../types.js';

const participant: ParticipantEntity = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Aminata Ndiaye',
  email: 'aminata.ndiaye@dit.sn',
  phone: '+221 77 123 45 67',
  type: 'STUDENT',
  createdAt: '2026-08-05T10:00:00.000Z',
  updatedAt: '2026-08-05T10:00:00.000Z',
};

const repository: ParticipantRepository = {
  list: async (search) => !search || participant.name.toLowerCase().includes(search.toLowerCase()) ? [participant] : [],
  findById: async (id) => id === participant.id ? participant : null,
  create: async (input) => ({ ...participant, ...input }),
  update: async (id, input) => id === participant.id ? { ...participant, ...input } : null,
  delete: async (id) => id === participant.id,
};

describe('participants-service', () => {
  const app = createApp(repository);

  it('recherche un participant par nom', async () => {
    const response = await request(app).get('/api/participants?search=Aminata').expect(200);
    expect(response.body.data[0].email).toBe(participant.email);
  });

  it('cree un participant valide', async () => {
    const response = await request(app).post('/api/participants').send({
      name: 'Fatou Diop', email: 'fatou@example.com', phone: '+221 77 000 00 00', type: 'EXTERNAL',
    }).expect(201);
    expect(response.body.data.type).toBe('EXTERNAL');
  });

  it('retourne 404 pour un inconnu', async () => {
    await request(app).get('/api/participants/dddddddd-dddd-4ddd-8ddd-dddddddddddd').expect(404);
  });
});
