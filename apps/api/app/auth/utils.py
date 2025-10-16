from passlib.context import CryptContext
import random, string, sys

# aceita pbkdf2_sha256 (atual) e também bcrypt* (legado)
_pwdctx = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt_sha256", "bcrypt"],
    deprecated="auto"
)

# ===== Criptografia =====
def hash_password(plain: str) -> str:
    return _pwdctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    # não deixa exceção vazar: se hash inválido/inesperado -> False
    try:
        return _pwdctx.verify(plain, hashed)
    except Exception as e:
        print(f"[auth] verify error: {e}", file=sys.stdout, flush=True)
        return False

# ===== Utilidades =====
def gen_token_12() -> str:
    alpha = string.ascii_uppercase + string.digits
    return ''.join(random.choice(alpha) for _ in range(12))

def password_strength_ok(pwd: str) -> bool:
    return (
        len(pwd) >= 8
        and any(c.isupper() for c in pwd)
        and any(not c.isalnum() for c in pwd)
    )

def send_email_stub(to: str, subject: str, body: str) -> None:
    print(f"[email_stub] TO={to} | SUBJECT={subject}\n{body}\n", file=sys.stdout, flush=True)
