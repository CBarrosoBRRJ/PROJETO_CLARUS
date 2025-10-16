import os, re
import psycopg2
import psycopg2.extras

RAW_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")

# normaliza: "postgresql+psycopg://..." -> "postgresql://"
url = re.sub(r"^postgresql\+[^:]+://", "postgresql://", RAW_URL)
# se vier com "/clarus", troca para "/postgres" (onde estão as tabelas)
url = re.sub(r"/clarus(\b|$)", "/postgres", url)

DATABASE_URL = url

print(f"[db] RAW_URL={RAW_URL} -> USING={DATABASE_URL}", flush=True)

def get_conn():
    return psycopg2.connect(DATABASE_URL)

def fetchone(query, params=()):
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params)
        return cur.fetchone()

def fetchall(query, params=()):
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params)
        return cur.fetchall()

def execute(query, params=()):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(query, params)
