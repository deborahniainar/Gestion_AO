from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminBase(BaseModel):
    username: str
    password: str


class AdminCreate(AdminBase):
    pass


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


class AdminRead(BaseModel):
    id: int
    username: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


