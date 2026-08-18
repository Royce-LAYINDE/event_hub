import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors.js';
import type { ParticipantRepository } from '../repositories/participant-repository.js';

const participantSchema = z.object({
  name: z.string().trim().min(2).max(180),
  email: z.email().max(254),
  phone: z.string().trim().min(7).max(30),
  type: z.enum(['STUDENT', 'PROFESSOR', 'EXTERNAL']),
});
const idSchema = z.uuid();

export function createParticipantsRouter(repository: ParticipantRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const { search } = z.object({ search: z.string().trim().max(180).optional() }).parse(req.query);
    res.json({ data: await repository.list(search) });
  });

  router.post('/', async (req, res) => {
    const participant = await repository.create(participantSchema.parse(req.body));
    res.status(201).location(`/api/participants/${participant.id}`).json({ data: participant });
  });

  router.get('/:id', async (req, res) => {
    const participant = await repository.findById(idSchema.parse(req.params.id));
    if (!participant) throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant introuvable.');
    res.json({ data: participant });
  });

  router.patch('/:id', async (req, res) => {
    const input = participantSchema.partial().refine((value) => Object.keys(value).length > 0, 'Au moins un champ est requis.').parse(req.body);
    const participant = await repository.update(idSchema.parse(req.params.id), input);
    if (!participant) throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant introuvable.');
    res.json({ data: participant });
  });

  router.delete('/:id', async (req, res) => {
    if (!(await repository.delete(idSchema.parse(req.params.id)))) {
      throw new AppError(404, 'PARTICIPANT_NOT_FOUND', 'Participant introuvable.');
    }
    res.status(204).send();
  });

  return router;
}
