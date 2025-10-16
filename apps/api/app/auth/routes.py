from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from typing import Optional

from .db import db
from .utils import verify_password, hash_password, sign_access_token, sign_refresh_token, hash_token, JWT_SECRET
from .deps import get_current_user_from_cookie

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

async def _get_user_by_email(email: str):
    return await db.fetchrow("SELECT * FROM users WHERE email=$1", email)

async def _get_role_id_by_name(name: str) -> Optional[str]:
    row = await db.fetchrow("SELECT id FROM roles WHERE name=$1", name)
    return row["id"] if row else None

@router.post("/signup")
async def signup(body: SignupIn):
    if await _get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    tenant_slug = body.email.split("@")[-1].split(".")[0]
    ten = await db.fetchrow(
        "INSERT INTO tenants(name, slug, created_at, updated_at) VALUES($1,$2,NOW(),NOW()) RETURNING id,slug",
        tenant_slug.title(), tenant_slug
    )
    user = await db.fetchrow("""
      INSERT INTO users(name,email,password_hash,is_active,created_at,updated_at)
      VALUES($1,$2,$3,TRUE,NOW(),NOW()) RETURNING id,name,email
    """, body.name, body.email, hash_password(body.password))

    rid = await _get_role_id_by_name("Admin")
    await db.execute(
        "INSERT INTO memberships(user_id,tenant_id,role_id,created_at) VALUES($1,$2,$3,NOW())",
        user["id"], ten["id"], rid
    )
    return {"ok": True, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}, "tenant": ten}

@router.post("/login")
async def login(body: LoginIn, response: Response):
    user = await _get_user_by_email(body.email)
    if not user or not user["password_hash"] or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    membership = await db.fetchrow("""
      SELECT m.tenant_id, r.name AS role
      FROM memberships m
      JOIN roles r ON r.id=m.role_id
      WHERE m.user_id=$1
      ORDER BY m.created_at ASC
      LIMIT 1
    """, user["id"])
    if not membership:
        raise HTTPException(status_code=403, detail="Sem acesso a nenhum tenant")

    access = sign_access_token(str(user["id"]), str(membership["tenant_id"]), membership["role"])
    refresh, refresh_exp = sign_refresh_token(str(user["id"]))
    await db.execute("""
      INSERT INTO refresh_tokens(user_id, token_hash, expires_at, created_at)
      VALUES($1,$2,$3,NOW())
    """, user["id"], hash_token(refresh), refresh_exp)

    response.set_cookie("access_token", access, httponly=True, samesite="Lax", secure=False, max_age=60*20, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, samesite="Lax", secure=False, max_age=60*60*24*30, path="/")
    await db.execute("UPDATE users SET last_login_at=NOW() WHERE id=$1", user["id"])
    return {"ok": True}

@router.post("/logout")
async def logout(response: Response, request: Request):
    rt = request.cookies.get("refresh_token")
    if rt:
        await db.execute("UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=$1", hash_token(rt))
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@router.get("/me")
async def me(request: Request, token = Depends(get_current_user_from_cookie)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    uid = payload.get("sub"); ten = payload.get("ten"); rol = payload.get("rol")
    if not uid or not ten:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = await db.fetchrow("SELECT id,name,email FROM users WHERE id=$1", uid)
    tenant = await db.fetchrow("SELECT id,name,slug,logo_url FROM tenants WHERE id=$1", ten)
    return {"user": user, "tenant": tenant, "role": rol}