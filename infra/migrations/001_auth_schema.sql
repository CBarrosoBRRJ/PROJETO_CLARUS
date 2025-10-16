-- ─────────────────────────────────────────────────────────────────────────────
--  Clarus DB Schema (robusto, multi-tenant, RBAC e auditoria)
--  Tabelas: users, tenants, roles, permissions, role_permissions,
--           memberships (user<->tenant+role), invites, password_resets,
--           refresh_tokens, audit_logs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- SAFE DROP (somente se precisar refazer em dev)
-- DO $$ BEGIN
--   EXECUTE 'DROP TABLE IF EXISTS audit_logs, refresh_tokens, password_resets, invites,
--            memberships, role_permissions, permissions, roles, users, tenants CASCADE';
-- EXCEPTION WHEN OTHERS THEN NULL;
-- END $$;

CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  primary_domain  TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT UNIQUE NOT NULL,
  description     TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL, -- ex: user.read, user.write
  description     TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user   ON memberships(user_id);

CREATE TABLE IF NOT EXISTS invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  token_hash      TEXT NOT NULL,         -- hash do token do convite
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  user_agent      TEXT,
  ip_address      INET,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id)   ON DELETE SET NULL,
  event           TEXT NOT NULL,                 -- ex: login_ok, login_fail, role_change
  payload_json    JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEED: roles & permissions básicas
INSERT INTO roles (id, name, description) VALUES
  (uuid_generate_v4(), 'Owner',   'Dono do tenant: todos os acessos')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
  (uuid_generate_v4(), 'Admin',   'Admin do tenant: gerencia usuários e configs')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
  (uuid_generate_v4(), 'Analyst', 'Analista: cria painéis, integrações, lê dados')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description) VALUES
  (uuid_generate_v4(), 'Viewer',  'Visualizador: acesso de leitura')
ON CONFLICT (name) DO NOTHING;

-- Permissões (exemplo inicial — adicione conforme necessidade)
INSERT INTO permissions (id, code, description) VALUES
  (uuid_generate_v4(), 'user.read',      'Listar usuários'),
  (uuid_generate_v4(), 'user.write',     'Criar/editar usuários'),
  (uuid_generate_v4(), 'tenant.read',    'Ler dados do tenant'),
  (uuid_generate_v4(), 'tenant.write',   'Editar tenant'),
  (uuid_generate_v4(), 'audit.read',     'Ver auditoria')
ON CONFLICT (code) DO NOTHING;

-- Vincula todas permissões ao Owner e as principais ao Admin
DO $$
DECLARE
  r_owner UUID;
  r_admin UUID;
  p RECORD;
BEGIN
  SELECT id INTO r_owner FROM roles WHERE name='Owner';
  SELECT id INTO r_admin FROM roles WHERE name='Admin';

  FOR p IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions(role_id, permission_id) VALUES (r_owner, p.id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Admin recebe quase tudo (exemplo: aqui recebe todas também; ajuste se quiser limitar)
  FOR p IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions(role_id, permission_id) VALUES (r_admin, p.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- SEED: tenant Clarus + admin@clarus como Owner (senha será setada via API seed)
INSERT INTO tenants (id, name, slug, primary_domain)
VALUES (uuid_generate_v4(), 'Clarus', 'clarus', 'clarus')
ON CONFLICT (slug) DO NOTHING;