import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors.js';
import type { EventRepository } from '../repositories/event-repository.js';

const eventSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(5000),
  startsAt: z.iso.datetime(),
  location: z.string().trim().min(2).max(180),
  capacity: z.number().int().min(1).max(100_000),
});

const idSchema = z.uuid();

export function createEventsRouter(repository: EventRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const filters = z.object({
      from: z.iso.datetime().optional(),
      to: z.iso.datetime().optional(),
      location: z.string().trim().max(180).optional(),
    }).parse(req.query);
    res.json({ data: await repository.list(filters) });
  });

  router.post('/', async (req, res) => {
    const event = await repository.create(eventSchema.parse(req.body));
    res.status(201).location(`/api/events/${event.id}`).json({ data: event });
  });

  router.get('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const event = await repository.findById(id);
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Evenement introuvable.');
    res.json({ data: event });
  });

  router.patch('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = eventSchema.partial().refine((value) => Object.keys(value).length > 0, 'Au moins un champ est requis.').parse(req.body);
    const event = await repository.update(id, input);
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Evenement introuvable.');
    res.json({ data: event });
  });

  router.delete('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    if (!(await repository.delete(id))) throw new AppError(404, 'EVENT_NOT_FOUND', 'Evenement introuvable.');
    res.status(204).send();
  });

  router.get('/:id/availability', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const event = await repository.findById(id);
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Evenement introuvable.');
    res.json({ data: { eventId: id, capacity: event.capacity, registeredCount: event.registeredCount, remainingPlaces: event.remainingPlaces, available: event.remainingPlaces > 0 } });
  });

  return router;
}

export function createInternalEventsRouter(repository: EventRepository): Router {
  const router = Router();

  router.post('/events/:id/reservations', async (req, res) => {
    const eventId = idSchema.parse(req.params.id);
    const { registrationId } = z.object({ registrationId: z.uuid() }).parse(req.body);
    const result = await repository.reserve(eventId, registrationId);
    if (!result) throw new AppError(404, 'EVENT_NOT_FOUND', 'Evenement introuvable.');
    if (!result.reserved) throw new AppError(409, 'EVENT_FULL', 'Cet evenement est complet.', { remainingPlaces: 0 });
    res.status(result.alreadyReserved ? 200 : 201).json({ data: result });
  });

  router.delete('/reservations/:registrationId', async (req, res) => {
    const registrationId = idSchema.parse(req.params.registrationId);
    const released = await repository.release(registrationId);
    res.json({ data: { released } });
  });

  return router;
}
