from typing import Optional

from pydantic import BaseModel, ConfigDict


class SoumissionDetailBase(BaseModel):
    quantite: float
    prix_unitaire: float
    id_soumission: int
    id_poste: int


class SoumissionDetailCreate(SoumissionDetailBase):
    pass


class SoumissionDetailUpdate(BaseModel):
    quantite: Optional[float] = None
    prix_unitaire: Optional[float] = None
    id_soumission: Optional[int] = None
    id_poste: Optional[int] = None


class SoumissionDetailRead(SoumissionDetailBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


