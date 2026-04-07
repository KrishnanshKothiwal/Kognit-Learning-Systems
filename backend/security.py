# In backend/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
import time
import httpx
from jose import jwt
from config import settings
import crud
from database import SessionLocal
import models
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

# Cache for Google's public keys
_GOOGLE_CERTS = None
_CERTS_EXPIRY = 0

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_google_certs():
    global _GOOGLE_CERTS, _CERTS_EXPIRY
    now = time.time()
    if _GOOGLE_CERTS and now < _CERTS_EXPIRY:
        return _GOOGLE_CERTS
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
            resp.raise_for_status()
            _GOOGLE_CERTS = resp.json()
            # Cache for 1 hour
            _CERTS_EXPIRY = now + 3600
            return _GOOGLE_CERTS
    except Exception as e:
        print(f"Error fetching Google certificates: {e}")
        # Return stale certs if available, else raise
        if _GOOGLE_CERTS:
            return _GOOGLE_CERTS
        raise

async def verify_firebase_token_local(token: str) -> dict:
    project_id = settings.firebase_project_id
    if not project_id:
        raise HTTPException(status_code=500, detail="FIREBASE_PROJECT_ID not configured on server")
    
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        certs = await get_google_certs()
        if kid not in certs:
            raise Exception("Invalid matching kid")
            
        cert = certs[kid]
        
        # Verify the token
        decoded = jwt.decode(
            token,
            cert,
            algorithms=['RS256'],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}"
        )
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "emailVerified": decoded.get("email_verified", False)
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current user from Firebase token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        decoded_token = await verify_firebase_token_local(token)

        email = decoded_token.get("email")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain email",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get or create user in database
        user = crud.get_user_by_email(db, email=email)
        if not user:
            from schemas.user import UserCreate
            user_data = UserCreate(email=email, password="")
            user = crud.create_user(db=db, user=user_data)

        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
