export const schemaSql = `
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('STUDENT', 'PROFESSOR', 'EXTERNAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS participants_email_unique_idx ON participants(LOWER(email));
CREATE INDEX IF NOT EXISTS participants_name_idx ON participants(name);
`;
