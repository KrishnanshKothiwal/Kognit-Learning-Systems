# In backend/routers/journals.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import base64

from database import get_db
from schemas.journal import JournalEntry, JournalEntryCreate, JournalEntryUpdate
import models
import crud
import security
from services.ai_service import extract_text_from_image, get_journal_insights

router = APIRouter(
    tags=["Journals"]
)

@router.post("/", response_model=JournalEntry, status_code=status.HTTP_201_CREATED)
async def create_journal_entry_endpoint(
    entry: JournalEntryCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    # Create entry first
    db_entry = crud.create_journal_entry(db=db, entry=entry, user_id=current_user.user_id)
    
    # --- AI Processing (async, non-blocking) ---
    try:
        summary, emotions_json, ai_nudge = await get_journal_insights(db_entry.content)
        db_entry = crud.update_journal_entry_ai_fields(
            db=db,
            entry=db_entry,
            summary=summary,
            emotions=emotions_json, # Store as JSON string
            ai_nudge=ai_nudge
        )
    except Exception as e:
        print(f"AI processing error (non-fatal): {e}")
        # Continue without AI fields if processing fails
    # --- End AI Processing ---

    # Achievements: journaling streak (5 days)
    try:
        import datetime as _dt
        # Fetch last 5 entries and check unique past 5 days present
        entries = crud.get_journal_entries_by_user(db=db, user_id=current_user.user_id, skip=0, limit=20)
        days = set(_dt.datetime.fromisoformat(e.created_at.isoformat()).date() for e in entries)
        today = _dt.datetime.utcnow().date()
        streak = all((today - _dt.timedelta(days=i)) in days for i in range(5))
        if streak:
            crud.unlock_achievement(db, current_user.user_id, 'streak_5', 'Journaling Streak: 5 Days')
    except Exception:
        pass

    return db_entry

@router.post("/extract-image")
async def extract_text_from_image_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Extract text from image using Google Cloud Vision API"""
    file_content = await file.read()
    
    if file.content_type and file.content_type.startswith('image/'):
        try:
            from services.ai_service import extract_text_from_image
            extracted_text = await extract_text_from_image(file_content, file.content_type)
            if extracted_text and not extracted_text.startswith("[Image:"):
                return {"content": extracted_text}
            else:
                return {"content": f"[Image: {file.filename} - Could not extract text. Please add text manually.]"}
        except Exception as e:
            print(f"OCR error: {e}")
            return {"content": f"[Error extracting text: {str(e)}. Please add text manually.]"}
    else:
        raise HTTPException(status_code=400, detail="Only image files are supported for OCR")

@router.get("/", response_model=List[JournalEntry])
async def read_journal_entries(
    skip: int = 0, 
    limit: int = 50,  # Reduced default limit for faster loading
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    # Optimize query - only load essential fields initially
    entries = crud.get_journal_entries_by_user(db=db, user_id=current_user.user_id, skip=skip, limit=limit)
    return entries

@router.get("/{entry_id}", response_model=JournalEntry)
async def read_journal_entry(
    entry_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    db_entry = crud.get_journal_entry(db=db, entry_id=entry_id, user_id=current_user.user_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return db_entry

# DELETE JOURNAL ENTRY
@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry_endpoint(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    ok = crud.delete_journal_entry(db=db, entry_id=entry_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return

# UPDATE JOURNAL ENTRY
@router.put("/{entry_id}", response_model=JournalEntry)
async def update_journal_entry_endpoint(
    entry_id: int,
    payload: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_entry = crud.get_journal_entry(db=db, entry_id=entry_id, user_id=current_user.user_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if payload.title is not None:
        db_entry.title = payload.title
    if payload.content is not None:
        db_entry.content = payload.content
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry
