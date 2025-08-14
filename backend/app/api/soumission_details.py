from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import SoumissionDetail
from ..schemas.soumission_detail import (
    SoumissionDetailCreate,
    SoumissionDetailRead,
    SoumissionDetailUpdate,
)


router = APIRouter(prefix="/soumission_details", tags=["Soumission Details"])


@router.get("/", response_model=list[SoumissionDetailRead])
def list_soumission_details(db: Session = Depends(get_db)):
    return db.query(SoumissionDetail).all()


@router.get("/{detail_id}", response_model=SoumissionDetailRead)
def get_soumission_detail(detail_id: int, db: Session = Depends(get_db)):
    obj = db.query(SoumissionDetail).get(detail_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Détail introuvable")
    return obj


@router.post("/", response_model=SoumissionDetailRead, status_code=status.HTTP_201_CREATED)
def create_soumission_detail(payload: SoumissionDetailCreate, db: Session = Depends(get_db)):
    obj = SoumissionDetail(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{detail_id}", response_model=SoumissionDetailRead)
def update_soumission_detail(detail_id: int, payload: SoumissionDetailUpdate, db: Session = Depends(get_db)):
    obj = db.query(SoumissionDetail).get(detail_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Détail introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{detail_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_soumission_detail(detail_id: int, db: Session = Depends(get_db)):
    obj = db.query(SoumissionDetail).get(detail_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Détail introuvable")
    db.delete(obj)
    db.commit()
    return None


