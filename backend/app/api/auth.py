from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Admin
from ..core.security import verify_password, create_access_token, hash_password
from ..schemas.admin import AdminRead
from ..schemas.auth import LoginResponse


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin: Admin | None = db.query(Admin).filter(Admin.username == form_data.username).first()
    if admin is None:
        return LoginResponse(success=False, message="Identifiants invalides")

    # Vérifie le mot de passe (bcrypt). Si l'ancien mot de passe était en clair dans la DB,
    # effectue une migration douce en le remplaçant par la version hashée lors d'une connexion réussie.
    if not verify_password(form_data.password, admin.password):
        if form_data.password == admin.password:
            admin.password = hash_password(form_data.password)
            db.add(admin)
            db.commit()
        else:
            return LoginResponse(success=False, message="Identifiants invalides")

    token = create_access_token(subject=admin.id, extra_claims={"username": admin.username})
    return LoginResponse(success=True, access_token=token, token_type="bearer", admin=AdminRead.model_validate(admin))


