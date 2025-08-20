from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Poste
from ..schemas.poste import PosteCreate, PosteRead, PosteUpdate


router = APIRouter(prefix="/postes", tags=["Postes"])


@router.get("/", response_model=list[PosteRead])
def list_postes(db: Session = Depends(get_db)):
    return db.query(Poste).all()


@router.get("/{poste_id}", response_model=PosteRead)
def get_poste(poste_id: int, db: Session = Depends(get_db)):
    obj = db.get(Poste, poste_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")
    return obj


@router.post("/", response_model=PosteRead, status_code=status.HTTP_201_CREATED)
def create_poste(payload: PosteCreate, db: Session = Depends(get_db)):
    obj = Poste(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{poste_id}", response_model=PosteRead)
def update_poste(poste_id: int, payload: PosteUpdate, db: Session = Depends(get_db)):
    obj = db.get(Poste, poste_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{poste_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poste(poste_id: int, db: Session = Depends(get_db)):
    obj = db.get(Poste, poste_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")
    db.delete(obj)
    db.commit()
    return None


