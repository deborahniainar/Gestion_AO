from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Specialite
from ..schemas.specialite import SpecialiteCreate, SpecialiteRead, SpecialiteUpdate


router = APIRouter(prefix="/specialites", tags=["Spécialités"])


@router.get("/", response_model=list[SpecialiteRead])
def list_specialites(db: Session = Depends(get_db)):
    return db.query(Specialite).all()


@router.get("/{specialite_id}", response_model=SpecialiteRead)
def get_specialite(specialite_id: int, db: Session = Depends(get_db)):
    obj = db.query(Specialite).get(specialite_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité introuvable")
    return obj


@router.post("/", response_model=SpecialiteRead, status_code=status.HTTP_201_CREATED)
def create_specialite(payload: SpecialiteCreate, db: Session = Depends(get_db)):
    obj = Specialite(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{specialite_id}", response_model=SpecialiteRead)
def update_specialite(specialite_id: int, payload: SpecialiteUpdate, db: Session = Depends(get_db)):
    obj = db.query(Specialite).get(specialite_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{specialite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_specialite(specialite_id: int, db: Session = Depends(get_db)):
    obj = db.query(Specialite).get(specialite_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité introuvable")
    db.delete(obj)
    db.commit()
    return None


