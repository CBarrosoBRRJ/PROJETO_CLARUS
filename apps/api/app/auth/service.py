from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from jose import jwt
from passlib.context import CryptContext

# Atenção: troque por variável de ambiente em produção
JWT_SECRET = "CHANGE_ME_DEV_ONLY"
JWT_ALG = "HS256"
JWT_TTL_MIN = 60

# Usa pbkdf2_sha256 (sem bcrypt)
pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd.verify(plain, hashed)
    except Exception:
        return False

def hash_password(plain: str) -> str:
    return pwd.hash(plain)

def create_access_token(data: Dict[str, Any], expires_minutes: int = JWT_TTL_MIN) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)