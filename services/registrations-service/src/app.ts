import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { ZodError } from 'zod';
import type { EventsClient, ParticipantsClient } from './clients/service-clients.js';
import { AppError } from './errors.js';
import type { RegistrationRepository } from './repositories/registration-repository.js';
import { createRegistrationsRouter } from './routes/registrations.js';

export function createApp(repository: RegistrationRepository, eventsClient: EventsClient, participantsClient: ParticipantsClient, corsOrigin = 'http://localhost:5173') {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin.split(',').map((item) => item.trim()) }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ enabled: process.env.NODE_ENV !== 'test' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'registrations-service' }));
  app.use('/api/registrations', createRegistrationsRouter(repository, eventsClient, participantsClient));
  app.use((_req, res) => res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route introuvable.' } }));

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Donnees invalides.', details: error.issues } });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } });
      return;
    }
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      res.status(409).json({ error: { code: 'ALREADY_REGISTERED', message: 'Ce participant est deja inscrit a cet evenement.' } });
      return;
    }
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' } });
  };
  app.use(errorHandler);
  return app;
}
