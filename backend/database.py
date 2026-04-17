# In backend/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session # <-- Ensure 'Session' is imported
from sqlalchemy.ext.declarative import declarative_base
from config import settings # <-- Keep this import
engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,  # auto-detects and discards stale connections
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()