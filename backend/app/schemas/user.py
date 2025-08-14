from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    email_verified_at: Optional[datetime] = None
    password: str


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    email_verified_at: Optional[datetime] = None
    password: Optional[str] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    email_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


