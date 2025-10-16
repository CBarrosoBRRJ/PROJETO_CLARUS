from fastapi import APIRouter
from app.core.db import engine
import sqlalchemy

router = APIRouter()

@router.get("")
def health():
    return {"status": "healthy"}

@router.get("/db")
def health_db():
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return {"db": "ok"}
    except Exception as e:
        return {"db": "down", "error": str(e)}