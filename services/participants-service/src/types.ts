export type ParticipantType = 'STUDENT' | 'PROFESSOR' | 'EXTERNAL';

export interface ParticipantEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ParticipantType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantInput {
  name: string;
  email: string;
  phone: string;
  type: ParticipantType;
}

export type UpdateParticipantInput = Partial<CreateParticipantInput>;
