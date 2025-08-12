import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Configuration pour SQLite
if "sqlite" in settings.database_url:
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False}, 
        echo=True  
    )
else:
    engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

