from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class FournisseurBase(BaseModel):
    nom: str
    contact_nom: Optional[str] = None
    contact_mail: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    pays: Optional[str] = None
    note: Optional[str] = None


class FournisseurCreate(FournisseurBase):
    pass


class FournisseurUpdate(BaseModel):
    nom: Optional[str] = None
    contact_nom: Optional[str] = None
    contact_mail: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    pays: Optional[str] = None
    note: Optional[str] = None


class FournisseurRead(FournisseurBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


