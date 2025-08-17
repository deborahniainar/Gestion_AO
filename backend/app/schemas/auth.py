from typing import Optional

from pydantic import BaseModel, ConfigDict

from .admin import AdminRead


class LoginResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    admin: Optional[AdminRead] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


