# In backend/routers/nudges.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud
import schemas
import models
import security
from database import SessionLocal # Assuming you'll need SessionLocal here too, consistent with stats.py

router = APIRouter(tags=["nudges"])

# Assuming get_db is also defined here or in a common utility
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- CORRECTED ROUTE PATH BELOW ---

@router.get("/daily/", response_model=schemas.nudge.DailyNudge)
async def read_daily_nudge(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    return await crud.get_daily_nudge(db=db, user_id=current_user.user_id)

# --- END CORRECTED ROUTE PATH ---