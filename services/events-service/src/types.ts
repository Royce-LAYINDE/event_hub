export interface EventEntity {
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

export interface CreateEventInput {
  title: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface EventFilters {
  from?: string;
  to?: string;
  location?: string;
}

export interface ReservationResult {
  event: EventEntity;
  reserved: boolean;
  alreadyReserved: boolean;
}
