from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Admin
from ..schemas.admin import AdminCreate, AdminRead, AdminUpdate
from ..core.security import hash_password


router = APIRouter(prefix="/admins", tags=["Admins"])


@router.get("/", response_model=list[AdminRead])
def list_admins(db: Session = Depends(get_db)):
    return db.query(Admin).all()


@router.get("/{admin_id}", response_model=AdminRead)
def get_admin(admin_id: int, db: Session = Depends(get_db)):
    obj = db.get(Admin, admin_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin introuvable")
    return obj


@router.post("/", response_model=AdminRead, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if data.get("password"):
        data["password"] = hash_password(data["password"])
    obj = Admin(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{admin_id}", response_model=AdminRead)
def update_admin(admin_id: int, payload: AdminUpdate, db: Session = Depends(get_db)):
    obj = db.get(Admin, admin_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "password" and value:
            value = hash_password(value)
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    obj = db.get(Admin, admin_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin introuvable")
    db.delete(obj)
    db.commit()
    return None


