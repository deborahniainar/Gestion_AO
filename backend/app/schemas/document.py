from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    type: str
    filename: str
    original_name: Optional[str] = None
    original_filename: Optional[str] = None
    expire_at: Optional[date] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    type: Optional[str] = None
    filename: Optional[str] = None
    original_name: Optional[str] = None
    original_filename: Optional[str] = None
    expire_at: Optional[date] = None


class DocumentRead(DocumentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


