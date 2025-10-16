from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from ..core.db import execute

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactPayload(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    message: str

@router.post("")
def send_msg(payload: ContactPayload):
    execute(
        "INSERT INTO contact_messages(name,email,phone,message) VALUES(%s,%s,%s,%s)",
        (payload.name, payload.email, payload.phone, payload.message),
    )
    return {"ok": True}
