from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Materiel
from ..schemas.materiel import MaterielCreate, MaterielRead, MaterielUpdate


router = APIRouter(prefix="/materiels", tags=["Matériels"])


@router.get("/", response_model=list[MaterielRead])
def list_materiels(db: Session = Depends(get_db)):
    return db.query(Materiel).all()


@router.get("/{materiel_id}", response_model=MaterielRead)
def get_materiel(materiel_id: int, db: Session = Depends(get_db)):
    obj = db.query(Materiel).get(materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    return obj


@router.post("/", response_model=MaterielRead, status_code=status.HTTP_201_CREATED)
def create_materiel(payload: MaterielCreate, db: Session = Depends(get_db)):
    obj = Materiel(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{materiel_id}", response_model=MaterielRead)
def update_materiel(materiel_id: int, payload: MaterielUpdate, db: Session = Depends(get_db)):
    obj = db.query(Materiel).get(materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{materiel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_materiel(materiel_id: int, db: Session = Depends(get_db)):
    obj = db.query(Materiel).get(materiel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matériel introuvable")
    db.delete(obj)
    db.commit()
    return None

