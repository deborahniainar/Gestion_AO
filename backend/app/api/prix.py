from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import PrixReference
from ..schemas.prix_reference import (
    PrixReferenceCreate,
    PrixReferenceRead,
    PrixReferenceUpdate,
)


router = APIRouter(prefix="/prix", tags=["Prix"])


@router.get("/", response_model=list[PrixReferenceRead])
def list_prix(db: Session = Depends(get_db)):
    return db.query(PrixReference).all()


@router.get("/{prix_id}", response_model=PrixReferenceRead)
def get_prix(prix_id: int, db: Session = Depends(get_db)):
    obj = db.get(PrixReference, prix_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prix introuvable")
    return obj


@router.post("/", response_model=PrixReferenceRead, status_code=status.HTTP_201_CREATED)
def create_prix(payload: PrixReferenceCreate, db: Session = Depends(get_db)):
    obj = PrixReference(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{prix_id}", response_model=PrixReferenceRead)
def update_prix(prix_id: int, payload: PrixReferenceUpdate, db: Session = Depends(get_db)):
    obj = db.get(PrixReference, prix_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prix introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{prix_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prix(prix_id: int, db: Session = Depends(get_db)):
    obj = db.get(PrixReference, prix_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prix introuvable")
    db.delete(obj)
    db.commit()
    return None

