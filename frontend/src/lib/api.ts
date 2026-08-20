import type { EventInput, EventItem, Participant, ParticipantInput, Registration, RegistrationStats } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

interface Envelope<T> { data: T }

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({})) as Envelope<T> & { error?: { code?: string; message?: string } };
  if (!response.ok) throw new ApiError(payload.error?.code ?? 'API_ERROR', payload.error?.message ?? 'Une erreur est survenue.', response.status);
  return payload.data;
}

export const api = {
  events: {
    list: (query = '') => apiRequest<EventItem[]>(`/api/events${query}`),
    create: (input: EventInput) => apiRequest<EventItem>('/api/events', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<EventInput>) => apiRequest<EventItem>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => apiRequest<void>(`/api/events/${id}`, { method: 'DELETE' }),
  },
  participants: {
    list: (search = '') => apiRequest<Participant[]>(`/api/participants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    create: (input: ParticipantInput) => apiRequest<Participant>('/api/participants', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: Partial<ParticipantInput>) => apiRequest<Participant>(`/api/participants/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    delete: (id: string) => apiRequest<void>(`/api/participants/${id}`, { method: 'DELETE' }),
  },
  registrations: {
    list: () => apiRequest<Registration[]>('/api/registrations'),
    create: (eventId: string, participantId: string) => apiRequest<Registration>('/api/registrations', { method: 'POST', body: JSON.stringify({ eventId, participantId }) }),
    cancel: (id: string) => apiRequest<Registration>(`/api/registrations/${id}`, { method: 'DELETE' }),
    stats: () => apiRequest<RegistrationStats>('/api/registrations/statistics'),
  },
};
