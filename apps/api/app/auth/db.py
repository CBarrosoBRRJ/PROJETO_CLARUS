import os, asyncpg, re
from typing import Any, Optional, Mapping

_raw_dsn = os.getenv("DATABASE_URL", "postgresql://postgres@db:5432/clarus")
# normaliza "postgresql+psycopg://", etc -> "postgresql://"
DATABASE_URL = re.sub(r"^postgres(?:ql)?\+\w+://", "postgresql://", _raw_dsn)

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.pool.Pool] = None

    async def init(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)

    async def fetchrow(self, query: str, *args: Any) -> Optional[Mapping[str, Any]]:
        assert self.pool is not None, "DB pool not initialized"
        async with self.pool.acquire() as con:
            return await con.fetchrow(query, *args)

    async def execute(self, query: str, *args: Any) -> str:
        assert self.pool is not None, "DB pool not initialized"
        async with self.pool.acquire() as con:
            return await con.execute(query, *args)

db = Database()