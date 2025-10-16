from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import engine
from app.models.user import User, Role

router = APIRouter(prefix="/users", tags=["users"])

def get_session():
    with Session(engine) as session:
        yield session

@router.get("", response_model=List[User])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()

@router.post("", response_model=User)
def create_user(user: User, session: Session = Depends(get_session)):
    # exige email
    if not user.email:
        raise HTTPException(status_code=400, detail="email Ã© obrigatÃ³rio")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.api_route("/seed", methods=["GET","POST"])
def seed_users(session: Session = Depends(get_session)):
    if session.exec(select(User)).first():
        return {"status": "ok", "msg": "jÃ¡ havia usuÃ¡rios"}
    sample = [
        User(email="owner@clarus", role=Role.OWNER,  active=True,  tenant_id="t1"),
        User(email="admin@clarus", role=Role.ADMIN,  active=True,  tenant_id="t1"),
        User(email="editor@clarus", role=Role.EDITOR, active=True, tenant_id="t1"),
        User(email="viewer@clarus", role=Role.VIEWER, active=True, tenant_id="t1"),
    ]
    session.add_all(sample)
    session.commit()
    return {"status": "ok", "inserted": len(sample)}

@router.get("/count")
def count_users(session: Session = Depends(get_session)):
    return {"count": len(session.exec(select(User)).all())}
