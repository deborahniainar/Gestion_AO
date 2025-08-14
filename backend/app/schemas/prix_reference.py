from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PrixReferenceBase(BaseModel):
    id_poste: int
    prix: float
    updated_at: Optional[date] = None
    id_fournisseur: Optional[int] = None


class PrixReferenceCreate(PrixReferenceBase):
    pass


class PrixReferenceUpdate(BaseModel):
    id_poste: Optional[int] = None
    prix: Optional[float] = None
    updated_at: Optional[date] = None
    id_fournisseur: Optional[int] = None


class PrixReferenceRead(PrixReferenceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


