from pydantic import BaseModel, ConfigDict


class SpecialiteBase(BaseModel):
    nom: str


class SpecialiteCreate(SpecialiteBase):
    pass


class SpecialiteUpdate(BaseModel):
    nom: str | None = None


class SpecialiteRead(SpecialiteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


