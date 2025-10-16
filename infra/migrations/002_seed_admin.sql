DO $$
DECLARE
  u RECORD;
  t RECORD;
  r_owner UUID;
BEGIN
  SELECT * INTO u FROM users WHERE email='admin@clarus';
  IF u IS NULL THEN
    INSERT INTO users(name,email,password_hash,is_active,created_at,updated_at)
    VALUES('Clarus Admin','admin@clarus','$2b$12$tP9d1uU/x1H3g0V3dKQgPe9d9xj8WJqef4w4Uq8Q7mA6v6v0AqSFe',TRUE,NOW(),NOW()); -- senha: clarus
    SELECT * INTO u FROM users WHERE email='admin@clarus';
  END IF;

  SELECT id INTO r_owner FROM roles WHERE name='Owner';
  SELECT * INTO t FROM tenants WHERE slug='clarus';

  IF NOT EXISTS (SELECT 1 FROM memberships WHERE user_id=u.id AND tenant_id=t.id) THEN
    INSERT INTO memberships(user_id, tenant_id, role_id, created_at)
    VALUES(u.id, t.id, r_owner, NOW());
  END IF;
END $$;