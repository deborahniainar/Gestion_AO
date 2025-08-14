from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Fournisseur
from ..schemas.fournisseur import FournisseurCreate, FournisseurRead, FournisseurUpdate


router = APIRouter(prefix="/fournisseurs", tags=["Fournisseurs"])


@router.get("/", response_model=list[FournisseurRead])
def list_fournisseurs(db: Session = Depends(get_db)):
    return db.query(Fournisseur).all()


@router.get("/{fournisseur_id}", response_model=FournisseurRead)
def get_fournisseur(fournisseur_id: int, db: Session = Depends(get_db)):
    obj = db.query(Fournisseur).get(fournisseur_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    return obj


@router.post("/", response_model=FournisseurRead, status_code=status.HTTP_201_CREATED)
def create_fournisseur(payload: FournisseurCreate, db: Session = Depends(get_db)):
    obj = Fournisseur(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{fournisseur_id}", response_model=FournisseurRead)
def update_fournisseur(fournisseur_id: int, payload: FournisseurUpdate, db: Session = Depends(get_db)):
    obj = db.query(Fournisseur).get(fournisseur_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{fournisseur_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fournisseur(fournisseur_id: int, db: Session = Depends(get_db)):
    obj = db.query(Fournisseur).get(fournisseur_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fournisseur introuvable")
    db.delete(obj)
    db.commit()
    return None


