import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { EventsClient, ParticipantsClient } from '../clients/service-clients.js';
import { AppError } from '../errors.js';
import type { RegistrationRepository } from '../repositories/registration-repository.js';

const idSchema = z.uuid();
const createSchema = z.object({ eventId: z.uuid(), participantId: z.uuid() });

export function createRegistrationsRouter(
  repository: RegistrationRepository,
  eventsClient: EventsClient,
  participantsClient: ParticipantsClient,
): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const filters = z.object({
      eventId: z.uuid().optional(),
      participantId: z.uuid().optional(),
      status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
    }).parse(req.query);
    res.json({ data: await repository.list(filters) });
  });

  router.post('/', async (req, res) => {
    const { eventId, participantId } = createSchema.parse(req.body);
    const duplicate = await repository.findActive(eventId, participantId);
    if (duplicate) throw new AppError(409, 'ALREADY_REGISTERED', 'Ce participant est deja inscrit a cet evenement.');

    await Promise.all([eventsClient.ensureExists(eventId), participantsClient.ensureExists(participantId)]);
    const registrationId = randomUUID();
    await eventsClient.reserve(eventId, registrationId);
    try {
      const registration = await repository.create(registrationId, eventId, participantId);
      res.status(201).location(`/api/registrations/${registration.id}`).json({ data: registration });
    } catch (error) {
      await eventsClient.release(registrationId).catch(() => undefined);
      throw error;
    }
  });

  router.get('/statistics', async (_req, res) => {
    res.json({ data: await repository.stats() });
  });

  router.get('/event/:eventId', async (req, res) => {
    const eventId = idSchema.parse(req.params.eventId);
    res.json({ data: await repository.list({ eventId }) });
  });

  router.get('/participant/:participantId', async (req, res) => {
    const participantId = idSchema.parse(req.params.participantId);
    res.json({ data: await repository.list({ participantId }) });
  });

  router.get('/:id', async (req, res) => {
    const registration = await repository.findById(idSchema.parse(req.params.id));
    if (!registration) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Inscription introuvable.');
    res.json({ data: registration });
  });

  router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const current = await repository.findById(id);
    if (!current) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Inscription introuvable.');
    if (current.status === 'CANCELLED') {
      res.json({ data: current });
      return;
    }
    await eventsClient.release(id);
    const cancelled = await repository.cancel(id);
    if (!cancelled) throw new AppError(409, 'REGISTRATION_ALREADY_CANCELLED', 'Cette inscription est deja annulee.');
    res.json({ data: cancelled });
  });

  return router;
}
