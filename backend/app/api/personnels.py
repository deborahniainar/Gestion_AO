from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..db.models import Personnel
from ..schemas.personnel import PersonnelCreate, PersonnelRead, PersonnelUpdate


router = APIRouter(prefix="/personnels", tags=["Personnels"])


@router.get("/", response_model=list[PersonnelRead])
def list_personnels(db: Session = Depends(get_db)):
    return db.query(Personnel).all()


@router.get("/{personnel_id}", response_model=PersonnelRead)
def get_personnel(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.query(Personnel).get(personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    return obj


@router.post("/", response_model=PersonnelRead, status_code=status.HTTP_201_CREATED)
def create_personnel(payload: PersonnelCreate, db: Session = Depends(get_db)):
    obj = Personnel(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{personnel_id}", response_model=PersonnelRead)
def update_personnel(personnel_id: int, payload: PersonnelUpdate, db: Session = Depends(get_db)):
    obj = db.query(Personnel).get(personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{personnel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personnel(personnel_id: int, db: Session = Depends(get_db)):
    obj = db.query(Personnel).get(personnel_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personnel introuvable")
    db.delete(obj)
    db.commit()
    return None

