from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SoumissionBase(BaseModel):
    delai_validite: Optional[date] = None
    id_appel_offre: Optional[int] = None
    id_user: Optional[int] = None


class SoumissionCreate(SoumissionBase):
    pass


class SoumissionUpdate(BaseModel):
    delai_validite: Optional[date] = None
    id_appel_offre: Optional[int] = None
    id_user: Optional[int] = None


class SoumissionRead(SoumissionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


