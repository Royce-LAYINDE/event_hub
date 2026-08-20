export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';

export interface RegistrationEntity {
  id: string;
  eventId: string;
  participantId: string;
  status: RegistrationStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface RegistrationFilters {
  eventId?: string;
  participantId?: string;
  status?: RegistrationStatus;
}

export interface RegistrationStats {
  total: number;
  confirmed: number;
  cancelled: number;
  byEvent: Array<{ eventId: string; count: number }>;
}
