-- Drop and recreate cleanly
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'employee')),
  name       TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  token      TEXT PRIMARY KEY,
  admin_id   UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  name       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert users
INSERT INTO admin_users (username, password, role, name) VALUES
  ('owner',     'zaitoon-owner-2025', 'owner',    'Restaurant Owner'),
  ('employee1', 'zaitoon-emp1-2025',  'employee', 'Employee 1'),
  ('employee2', 'zaitoon-emp2-2025',  'employee', 'Employee 2');

-- Verify (should show 3 rows)
SELECT username, role, name, is_active FROM admin_users;
