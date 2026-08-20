export interface EventItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
  remainingPlaces: number;
  createdAt: string;
  updatedAt: string;
}

export type ParticipantType = 'STUDENT' | 'PROFESSOR' | 'EXTERNAL';

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ParticipantType;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Registration {
  id: string;
  eventId: string;
  participantId: string;
  status: RegistrationStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface RegistrationStats {
  total: number;
  confirmed: number;
  cancelled: number;
  byEvent: Array<{ eventId: string; count: number }>;
}

export type EventInput = Pick<EventItem, 'title' | 'description' | 'startsAt' | 'location' | 'capacity'>;
export type ParticipantInput = Pick<Participant, 'name' | 'email' | 'phone' | 'type'>;
