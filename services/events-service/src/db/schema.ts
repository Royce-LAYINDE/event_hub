export const schemaSql = `
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(180) NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0 AND registered_count <= capacity),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_starts_at_idx ON events(starts_at);
CREATE INDEX IF NOT EXISTS events_location_idx ON events(location);

CREATE TABLE IF NOT EXISTS event_reservations (
  registration_id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS event_reservations_event_id_idx ON event_reservations(event_id);
`;
