param(
  [ValidateSet("up","list","where","psql","newdb","ctx","crud-demo","conn","help")]
  [string]$Action = "help",
  [string]$Name,
  [string]$Tenant,
  [ValidateSet("OWNER","ADMIN","EDITOR","VIEWER")]
  [string]$Role
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvOrDefault {
  param([string]$Name, [string]$Default)
  $val = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ([string]::IsNullOrWhiteSpace($val)) { $val = [Environment]::GetEnvironmentVariable($Name, 'User') }
  if ([string]::IsNullOrWhiteSpace($val)) { $val = [Environment]::GetEnvironmentVariable($Name, 'Machine') }
  if ([string]::IsNullOrWhiteSpace($val)) { $val = $Default }
  return $val
}

$PgImage     = Get-EnvOrDefault -Name "CLARUS_PG_IMAGE"     -Default "postgres:16-alpine"
$DbContainer = Get-EnvOrDefault -Name "CLARUS_DB_CONTAINER" -Default "clarus-db"
$DbPort      = Get-EnvOrDefault -Name "CLARUS_DB_PORT"      -Default "5433"
$DbName      = Get-EnvOrDefault -Name "CLARUS_DB_NAME"      -Default "clarus"
$DbUser      = Get-EnvOrDefault -Name "CLARUS_DB_USER"      -Default "clarus"
$DbPass      = Get-EnvOrDefault -Name "CLARUS_DB_PASS"      -Default "clarus"
$PgSuperUser = "postgres"
$PgVolume    = Get-EnvOrDefault -Name "CLARUS_DB_VOLUME"    -Default "clarus_pgdata"
$Network     = Get-EnvOrDefault -Name "CLARUS_NET"          -Default "clarus-net"

function Test-Command { param([string]$Name) Get-Command $Name -ErrorAction SilentlyContinue }

function Ensure-Prereqs {
  if (-not (Test-Command -Name "docker")) { throw "Docker não encontrado. Instale Docker Desktop e reabra o PowerShell." }
  docker network inspect $Network | Out-Null 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "→ Criando network $Network ..."; docker network create $Network | Out-Null }
  Write-Host "→ Garantindo imagem: $PgImage ..."; docker pull $PgImage | Out-Null
}

function Wait-PostgresReady {
  param([int]$TimeoutSec = 45)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    docker exec $DbContainer pg_isready -U $PgSuperUser -d postgres | Out-Null
    if ($LASTEXITCODE -eq 0) { return }
    Start-Sleep -Milliseconds 700
  } while ((Get-Date) -lt $deadline)
  throw "Postgres não ficou pronto em $TimeoutSec s."
}

function Invoke-DbSql {
  param([Parameter(Mandatory)][string]$Database,[Parameter(Mandatory)][string]$Sql)
  $args = @("exec","-i",$DbContainer,"psql","-U",$PgSuperUser,"-d",$Database,"-v","ON_ERROR_STOP=1","-f","-")
  $Sql | & docker @args
}

function Initialize-ClarusSchema {
  Write-Host "→ Criando schema, tabelas core, papéis e RLS..."
  $sql = @'
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='clarus_owner') THEN CREATE ROLE clarus_owner; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='clarus_admin') THEN CREATE ROLE clarus_admin; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='clarus_editor') THEN CREATE ROLE clarus_editor; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='clarus_viewer') THEN CREATE ROLE clarus_viewer; END IF;
END $$;

GRANT clarus_viewer TO __DBUSER__;
GRANT clarus_editor TO __DBUSER__;
GRANT clarus_admin  TO __DBUSER__;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email citext UNIQUE,
  full_name text,
  role text NOT NULL CHECK (role IN ('OWNER','ADMIN','EDITOR','VIEWER')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  price numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant  ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mat_tenant    ON materials(tenant_id);

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials  ENABLE ROW LEVEL SECURITY;

-- USERS: SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'users'
      AND policyname = 'p_users_sel_viewer'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_users_sel_viewer ON users
        FOR SELECT USING (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

-- AUDIT_LOGS: SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'audit_logs'
      AND policyname = 'p_audit_sel_viewer'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_audit_sel_viewer ON audit_logs
        FOR SELECT USING (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

-- MATERIALS: SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'materials'
      AND policyname = 'p_mat_sel_viewer'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_mat_sel_viewer ON materials
        FOR SELECT USING (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

-- MATERIALS: INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'materials'
      AND policyname = 'p_mat_ins_editor'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_mat_ins_editor ON materials
        FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

-- MATERIALS: UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'materials'
      AND policyname = 'p_mat_upd_editor'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_mat_upd_editor ON materials
        FOR UPDATE
        USING      (tenant_id::text = current_setting('app.tenant_id', true))
        WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

-- MATERIALS: DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = current_schema()
      AND tablename  = 'materials'
      AND policyname = 'p_mat_del_admin'
  ) THEN
    EXECUTE $DDL$
      CREATE POLICY p_mat_del_admin ON materials
        FOR DELETE
        USING (tenant_id::text = current_setting('app.tenant_id', true));
    $DDL$;
  END IF;
END $$;

GRANT SELECT ON users, audit_logs, materials TO clarus_viewer;
GRANT INSERT, UPDATE ON materials TO clarus_editor;
GRANT DELETE ON materials TO clarus_admin;

INSERT INTO tenants (id, name)
  VALUES ('00000000-0000-0000-0000-000000000001','Empresa Demonstração')
  ON CONFLICT DO NOTHING;

INSERT INTO users (id, tenant_id, email, full_name, role)
  VALUES (uuid_generate_v4(),'00000000-0000-0000-0000-000000000001','owner@demo.com','Owner Demo','OWNER')
  ON CONFLICT DO NOTHING;
'@
  $sql = $sql.Replace('__DBUSER__', $DbUser)
  Invoke-DbSql -Database $DbName -Sql $sql | Out-Null
  Write-Host "✔ Schema/roles/RLS verificados."
}


function Start-ClarusDb {
  Ensure-Prereqs
  $exists = (docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $DbContainer)
  if (-not $exists) {
    Write-Host "→ Criando container $DbContainer ..."
    docker run -d `
      --name $DbContainer `
      --network $Network `
      -e POSTGRES_PASSWORD=$DbPass `
      -e POSTGRES_USER=$PgSuperUser `
      -e PGDATA=/var/lib/postgresql/data/pgdata `
      -v ${PgVolume}:/var/lib/postgresql/data `
      -p ${DbPort}:5432 `
      $PgImage | Out-Null
    Start-Sleep -Seconds 3
  } else {
    Write-Host "→ Container já existe. Iniciando (se parado) ..."
    docker start $DbContainer | Out-Null
  }

  Wait-PostgresReady

  Write-Host "→ Garantindo role '$DbUser' e database '$DbName' ..."

  # 1) Garante o ROLE (usar aspas simples no here-string para não interpolar $$)
  $sqlRole = @'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '__DBUSER__') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '__DBUSER__', '__DBPASS__');
  END IF;
END $$;
'@
  $sqlRole = $sqlRole.Replace('__DBUSER__',$DbUser).Replace('__DBPASS__',$DbPass)
  Invoke-DbSql -Database "postgres" -Sql $sqlRole | Out-Null

  # 2) Garante o DATABASE (fora do DO $$)
  $raw = & docker exec $DbContainer psql -U $PgSuperUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName'" 2>$null
  $dbExists = ($raw | Out-String).Trim()
  if (-not $dbExists) {
    Write-Host "→ Criando database $DbName ..."
    & docker exec $DbContainer createdb -U $PgSuperUser $DbName | Out-Null
  } else {
    Write-Host "→ Database $DbName já existe."
  }

  # 3) Permissão de CONNECT
  Invoke-DbSql -Database "postgres" -Sql "GRANT CONNECT ON DATABASE $DbName TO $DbUser;" | Out-Null

  Initialize-ClarusSchema
}

function Get-ClarusDatabases {
  Write-Host "→ Listando bancos (exclui templates):"
  Invoke-DbSql -Database "postgres" -Sql "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY 1;"
}

function Get-ClarusDbLocation {
  Write-Host "→ Procurando volume '$PgVolume'..."
  $inspect = docker volume inspect $PgVolume 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Warning "Volume não encontrado. Ele será criado ao subir o container."; return }
  $obj = $inspect | ConvertFrom-Json
  $mount = $obj.Mountpoint
  Write-Host "Mountpoint (no Linux interno do Docker): $mount"
  Write-Host "No Windows/WSL2: \\wsl$\docker-desktop-data\data\docker\volumes\$PgVolume\_data"
}

function Enter-ClarusPsql {
  Write-Host "Abrindo psql no DB '$DbName' (CTRL+C para sair)..."
  docker exec -it $DbContainer psql -U $PgSuperUser -d $DbName
}

function New-ClarusDatabase {
  param([Parameter(Mandatory)][string]$Name)
  Write-Host "→ Criando database '$Name'..."
  Invoke-DbSql -Database "postgres" -Sql "CREATE DATABASE ""$Name"";"
  Invoke-DbSql -Database "postgres" -Sql "GRANT CONNECT ON DATABASE ""$Name"" TO $DbUser;"
}

function Set-ClarusAppContext {
  param([Parameter(Mandatory)][string]$TenantId,[Parameter(Mandatory)][ValidateSet("OWNER","ADMIN","EDITOR","VIEWER")] [string]$Role)
  $sql = "SELECT set_config('app.tenant_id', '$TenantId', true); SELECT set_config('app.role', '$Role', true);"
  Invoke-DbSql -Database $DbName -Sql $sql | Out-Null
  Write-Host "✔ Contexto aplicado: tenant=$TenantId role=$Role"
}

function Example-Crud {
  param([string]$TenantId = "00000000-0000-0000-0000-000000000001")
  $sql = @'
SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000001', true);
SELECT set_config('app.role', 'EDITOR', true);

INSERT INTO materials(tenant_id, code, name, unit, price) VALUES
  ('00000000-0000-0000-0000-000000000001','MAT-001','Cimento CP II','saco', 35.90),
  ('00000000-0000-0000-0000-000000000001','MAT-002','Areia Média','m3', 120.00)
ON CONFLICT DO NOTHING;

UPDATE materials SET price = 129.90 WHERE code='MAT-002';

SELECT id, code, name, unit, price FROM materials ORDER BY created_at DESC;
'@
  Invoke-DbSql -Database $DbName -Sql $sql
}

function Get-ConnectionString {
  $cs = "postgresql://${DbUser}:${DbPass}@localhost:${DbPort}/${DbName}"
  Write-Host $cs
}

function Show-Help {
@"
Comandos:
.\infra\db-tools.ps1 -Action up
.\infra\db-tools.ps1 -Action list
.\infra\db-tools.ps1 -Action where
.\infra\db-tools.ps1 -Action psql
.\infra\db-tools.ps1 -Action newdb -Name teste
.\infra\db-tools.ps1 -Action ctx  -Tenant 000...001 -Role VIEWER|EDITOR|ADMIN|OWNER
.\infra\db-tools.ps1 -Action crud-demo
.\infra\db-tools.ps1 -Action conn
"@ | Write-Host
}

switch ($Action) {
  "up"        { Start-ClarusDb }
  "list"      { Get-ClarusDatabases }
  "where"     { Get-ClarusDbLocation }
  "psql"      { Enter-ClarusPsql }
  "newdb"     { if (-not $Name) { throw "Use -Name <nome>" } New-ClarusDatabase -Name $Name }
  "ctx"       { if (-not $Tenant -or -not $Role) { throw "Use -Tenant <uuid> -Role <papel>" } Set-ClarusAppContext -TenantId $Tenant -Role $Role }
  "crud-demo" { Example-Crud }
  "conn"      { Get-ConnectionString }
  default     { Show-Help }
}
