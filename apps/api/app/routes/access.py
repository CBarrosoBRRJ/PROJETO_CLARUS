from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from ..core.db import fetchone, execute
from ..auth.utils import password_strength_ok, hash_password, gen_token_12

router = APIRouter(prefix="/access", tags=["access"])

class RequestPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None

@router.post("/request")
def request_access(payload: RequestPayload):
    execute(
        "INSERT INTO access_requests(name,email,phone) VALUES(%s,%s,%s)",
        (payload.name, payload.email, payload.phone),
    )
    return {"ok": True}

class ActivatePayload(BaseModel):
    token: str
    password: str
    # (se depois quiser pedir nome no front, dá pra adicionar aqui)

@router.post("/activate")
def activate(payload: ActivatePayload):
    inv = fetchone("SELECT * FROM invites WHERE token=%s AND used_at IS NULL", (payload.token,))
    if not inv:
        raise HTTPException(status_code=400, detail="Convite inválido ou já utilizado")
    if not password_strength_ok(payload.password):
        raise HTTPException(status_code=400, detail="Senha fraca")
    email = inv["email"]
    name_guess = email.split("@")[0].replace(".", " ").title()
    h = hash_password(payload.password)
    execute("""
        INSERT INTO users (email,name,phone,password_hash,is_active)
        VALUES (%s,%s,NULL,%s,TRUE)
        ON CONFLICT (email) DO UPDATE
        SET password_hash=EXCLUDED.password_hash, is_active=TRUE
    """, (email, name_guess, h))
    execute("UPDATE invites SET used_at = NOW() WHERE token=%s", (payload.token,))
    token = gen_token_12()
    body = {
        "ok": True,
        "redirect": "/admin/dashboard",
        "access_token": token,
        "user": {"email": email, "name": name_guess}
    }
    resp = JSONResponse(body)
    resp.set_cookie("session", token, httponly=True, samesite="lax", path="/", max_age=60*60*12)
    return resp
