-- 003_auth_core.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         CITEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- admin seed (senha: clarus)
INSERT INTO users (email, name, phone, password_hash, is_active)
SELECT 'admin@clarus.com','Administrador','', '$2b$12$8pK9o9xgG3d0Lm7WmVh8f.1pO0JfJf0l3Qbq3wM4l5g9r6o3r6Yj2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@clarus.com');

-- 004_access_requests.sql
CREATE TABLE IF NOT EXISTS access_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      CITEXT NOT NULL,
  phone      TEXT,
  status     TEXT NOT NULL DEFAULT 'new', -- new, reviewed, approved, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 005_invites.sql
CREATE TABLE IF NOT EXISTS invites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      CITEXT UNIQUE NOT NULL,
  token      TEXT NOT NULL,     -- 12 chars A-Z0-9
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 006_password_resets_and_contact.sql
CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      CITEXT NOT NULL,
  token      TEXT NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      CITEXT NOT NULL,
  phone      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
