from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from ..core.db import fetchone
from ..auth.utils import verify_password, gen_token_12, send_email_stub

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginPayload(BaseModel):
    email: EmailStr
    password: str
    remember: bool | None = None

@router.post("/login")
def login(payload: LoginPayload):
    u = fetchone("SELECT * FROM users WHERE email=%s", (payload.email,))
    if not u or not verify_password(payload.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = gen_token_12()
    resp = JSONResponse({
        "ok": True,
        "redirect": "/admin/dashboard",
        "access_token": token,
        "user": {"email": u["email"], "name": u["name"]}
    })
    resp.set_cookie("session", token, httponly=True, samesite="lax", path="/", max_age=(60*60*24 if payload.remember else 60*60*12))
    return resp

class ForgotPayload(BaseModel):
    email: EmailStr

@router.post("/forgot")
def forgot(payload: ForgotPayload):
    # stub: sempre responde ok, mas "envia" para logs
    send_email_stub(
        to=payload.email,
        subject="Clarus - Recuperação de senha",
        body="Se sua conta existir, enviaremos instruções de redefinição."
    )
    return {"ok": True}
