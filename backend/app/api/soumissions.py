from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Soumission
from ..schemas.soumission import (
    SoumissionCreate,
    SoumissionRead,
    SoumissionUpdate,
)


router = APIRouter(prefix="/soumissions", tags=["Soumissions"])


@router.get("/", response_model=list[SoumissionRead])
def list_soumissions(db: Session = Depends(get_db)):
    return db.query(Soumission).all()


@router.get("/{soumission_id}", response_model=SoumissionRead)
def get_soumission(soumission_id: int, db: Session = Depends(get_db)):
    soum = db.get(Soumission, soumission_id)
    if not soum:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soumission introuvable")
    return soum


@router.post("/", response_model=SoumissionRead, status_code=status.HTTP_201_CREATED)
def create_soumission(payload: SoumissionCreate, db: Session = Depends(get_db)):
    soum = Soumission(**payload.model_dump(exclude_unset=True))
    db.add(soum)
    db.commit()
    db.refresh(soum)
    return soum


@router.put("/{soumission_id}", response_model=SoumissionRead)
def update_soumission(soumission_id: int, payload: SoumissionUpdate, db: Session = Depends(get_db)):
    soum = db.get(Soumission, soumission_id)
    if not soum:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soumission introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(soum, key, value)
    db.commit()
    db.refresh(soum)
    return soum


@router.delete("/{soumission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_soumission(soumission_id: int, db: Session = Depends(get_db)):
    soum = db.get(Soumission, soumission_id)
    if not soum:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soumission introuvable")
    db.delete(soum)
    db.commit()
    return None

