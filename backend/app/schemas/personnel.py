from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PersonnelBase(BaseModel):
    nom: str
    prenom: str
    fonction: Optional[str] = None
    experience_annees: Optional[int] = None
    formation: Optional[str] = None
    nationalite: Optional[str] = None
    date_naissance: Optional[date] = None
    salaire_mensuel: Optional[float] = None
    contact: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    # disponibilite: Optional[date] = None
    # id_specialite: Optional[int] = None


class PersonnelCreate(PersonnelBase):
    pass


class PersonnelUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    # disponibilite: Optional[date] = None
    # id_specialite: Optional[int] = None


class PersonnelRead(PersonnelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


