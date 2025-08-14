from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class ClientBase(BaseModel):
    name: str
    adress: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    adress: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None


class ClientRead(ClientBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


