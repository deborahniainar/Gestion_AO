from typing import Optional

from pydantic import BaseModel, ConfigDict


class MaterielBase(BaseModel):
    reference: str
    quantite: int
    localisation: Optional[str] = None
    etat: Optional[str] = None
    id_fournisseur: Optional[int] = None


class MaterielCreate(MaterielBase):
    pass


class MaterielUpdate(BaseModel):
    reference: Optional[str] = None
    quantite: Optional[int] = None
    localisation: Optional[str] = None
    etat: Optional[str] = None
    id_fournisseur: Optional[int] = None


class MaterielRead(MaterielBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


