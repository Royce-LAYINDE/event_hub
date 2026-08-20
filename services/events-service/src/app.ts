import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import type { EventRepository } from './repositories/event-repository.js';
import { createEventsRouter, createInternalEventsRouter } from './routes/events.js';

export function createApp(repository: EventRepository, corsOrigin = 'http://localhost:5173') {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin.split(',').map((item) => item.trim()) }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ enabled: process.env.NODE_ENV !== 'test' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'events-service' }));
  app.use('/api/events', createEventsRouter(repository));
  app.use('/internal', createInternalEventsRouter(repository));

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
    if (pgError.code === '23503') {
      res.status(409).json({ error: { code: 'EVENT_HAS_REGISTRATIONS', message: 'Impossible de supprimer un evenement avec des inscriptions.' } });
      return;
    }
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur.' } });
  };
  app.use(errorHandler);
  return app;
}
