export const schemaSql = `
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_unique_active_idx
  ON registrations(event_id, participant_id) WHERE status = 'CONFIRMED';
CREATE INDEX IF NOT EXISTS registrations_event_idx ON registrations(event_id);
CREATE INDEX IF NOT EXISTS registrations_participant_idx ON registrations(participant_id);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations(status);
`;
