from typing import Optional

from pydantic import BaseModel, ConfigDict


class PosteBase(BaseModel):
    code: str
    name: str


class PosteCreate(PosteBase):
    pass


class PosteUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None


class PosteRead(PosteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


