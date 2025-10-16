from typing import Optional
from enum import Enum
from sqlmodel import Field
from app.core.db import AuditBase

class Role(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

class User(AuditBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    role: Role = Field(default=Role.VIEWER, index=True)
    active: bool = Field(default=True)