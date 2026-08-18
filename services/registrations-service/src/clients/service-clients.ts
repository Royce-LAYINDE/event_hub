import { AppError } from '../errors.js';

interface ErrorPayload {
  error?: { code?: string; message?: string; details?: unknown };
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(5_000), headers: { 'content-type': 'application/json', ...init?.headers } });
  } catch {
    throw new AppError(503, 'DEPENDENCY_UNAVAILABLE', 'Un microservice requis est indisponible.');
  }
  const payload = await response.json().catch(() => ({})) as ErrorPayload;
  if (!response.ok) {
    throw new AppError(response.status, payload.error?.code ?? 'DEPENDENCY_ERROR', payload.error?.message ?? 'Erreur de communication entre microservices.', payload.error?.details);
  }
  return payload;
}

export interface EventsClient {
  ensureExists(eventId: string): Promise<void>;
  reserve(eventId: string, registrationId: string): Promise<void>;
  release(registrationId: string): Promise<void>;
}

export interface ParticipantsClient {
  ensureExists(participantId: string): Promise<void>;
}

export class HttpEventsClient implements EventsClient {
  constructor(private readonly baseUrl: string) {}

  async ensureExists(eventId: string): Promise<void> {
    await requestJson(`${this.baseUrl}/api/events/${eventId}`);
  }

  async reserve(eventId: string, registrationId: string): Promise<void> {
    await requestJson(`${this.baseUrl}/internal/events/${eventId}/reservations`, {
      method: 'POST', body: JSON.stringify({ registrationId }),
    });
  }

  async release(registrationId: string): Promise<void> {
    await requestJson(`${this.baseUrl}/internal/reservations/${registrationId}`, { method: 'DELETE' });
  }
}

export class HttpParticipantsClient implements ParticipantsClient {
  constructor(private readonly baseUrl: string) {}
  async ensureExists(participantId: string): Promise<void> {
    await requestJson(`${this.baseUrl}/api/participants/${participantId}`);
  }
}
