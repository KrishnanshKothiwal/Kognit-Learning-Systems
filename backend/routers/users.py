# In backend/routers/users.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import crud
import models
import security
from schemas.user import User, UserCreate, Token, UserUpdate
from database import SessionLocal # Assuming get_db needs SessionLocal

router = APIRouter(tags=["users"],)

# Assuming get_db is also defined here or in a common utility
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- CORRECTED ROUTE PATH BELOW ---

# Note: User creation is now handled by Firebase Auth
# This endpoint is kept for backward compatibility but users should sign up via Firebase
@router.post("/", response_model=User)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create user (deprecated - use Firebase Auth for signup)"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

# Token endpoint is deprecated - authentication is handled by Firebase
# Kept for backward compatibility
@router.post("/token", response_model=Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint (deprecated - use Firebase Auth for login)"""
    raise HTTPException(
        status_code=501,
        detail="This endpoint is deprecated. Please use Firebase Authentication."
    )

# Get current user profile
@router.get("/me", response_model=User)
async def get_me(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return current_user

# Update email/password for current user
@router.put("/me", response_model=User)
async def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # Change email if provided
    if payload.email:
        existing = crud.get_user_by_email(db, email=payload.email)
        if existing and existing.user_id != current_user.user_id:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email
    # Password changes are handled by Firebase Auth
    # For Firebase users, we don't store passwords
    if payload.new_password:
        raise HTTPException(
            status_code=400, 
            detail="Password changes should be done through Firebase Authentication"
        )
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

# Achievements list
@router.get("/achievements")
async def list_achievements(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    return crud.get_user_achievements(db, user_id=current_user.user_id)