from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AOStatus(str, Enum):
    en_cours = "en_cours"
    soumis = "soumis"
    attribue = "attribue"
    perdu = "perdu"


class AppelOffreBase(BaseModel):
    reference: str
    objet: Optional[str] = None
    date_limite: Optional[date] = None
    status: AOStatus = AOStatus.en_cours
    id_client: Optional[int] = None
    id_user: Optional[int] = None


class AppelOffreCreate(AppelOffreBase):
    pass


class AppelOffreUpdate(BaseModel):
    reference: Optional[str] = None
    objet: Optional[str] = None
    date_limite: Optional[date] = None
    status: Optional[AOStatus] = None
    id_client: Optional[int] = None
    id_user: Optional[int] = None


class AppelOffreRead(AppelOffreBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


