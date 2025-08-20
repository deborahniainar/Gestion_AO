from typing import Optional

from pydantic import BaseModel, ConfigDict


class MaterielBase(BaseModel):
    designation: str
    nombre: int
    marque: Optional[str] = None
    modele: Optional[str] = None
    annee: Optional[int] = None
    qualite: Optional[str] = None
    # id_fournisseur: Optional[int] = None


class MaterielCreate(MaterielBase):
    pass


class MaterielUpdate(BaseModel):
    designation: Optional[str] = None
    nombre: Optional[int] = None
    marque: Optional[str] = None
    modele: Optional[str] = None
    annee: Optional[int] = None
    qualite: Optional[str] = None
    # id_fournisseur: Optional[int] = None


class MaterielRead(MaterielBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


