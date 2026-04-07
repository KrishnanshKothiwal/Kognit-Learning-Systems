# In backend/routers/stats.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud
from schemas import UserStats, QuizHistoryItem
import models
import security
from database import SessionLocal

router = APIRouter(tags=["stats"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- CORRECTED ROUTE PATHS BELOW ---

@router.get("/", response_model=UserStats) # Changed from "/stats/" to "/"
async def read_user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    return crud.get_user_stats(db=db, user_id=current_user.user_id)

# Assuming frontend will call /stats/quiz-history/, so this path is correct given the prefix
@router.get("/quiz-history/", response_model=list[QuizHistoryItem]) # Changed from "/stats/quiz-history/" to "/quiz-history/"
async def read_user_quiz_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    return crud.get_quiz_history(db=db, user_id=current_user.user_id)

# --- END CORRECTED ROUTE PATHS ---