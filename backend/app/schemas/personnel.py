from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PersonnelBase(BaseModel):
    nom: str
    disponibilite: Optional[date] = None
    id_specialite: Optional[int] = None


class PersonnelCreate(PersonnelBase):
    pass


class PersonnelUpdate(BaseModel):
    nom: Optional[str] = None
    disponibilite: Optional[date] = None
    id_specialite: Optional[int] = None


class PersonnelRead(PersonnelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


