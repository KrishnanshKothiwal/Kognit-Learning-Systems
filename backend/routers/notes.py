# In backend/routers/notes.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from sqlalchemy.orm import Session
import crud
# import schemas # <-- Remove this line
import models
import security
from database import SessionLocal
import fitz  # PyMuPDF
from services import ai_service  # Import AI service for summarization
# --- Updated Imports for schemas ---
from schemas.notes import Note, NoteCreate, NoteUpdate
# --- End Updated Imports ---
from deep_translator import GoogleTranslator

# Try to import python-docx for DOCX support
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not installed. DOCX files won't be supported. Install with: pip install python-docx")

router = APIRouter(tags=["notes"])

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/extract-pdf")
async def extract_pdf_text(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Extract text from PDF file"""
    file_content = await file.read()
    content = ""
    
    if file.content_type == 'application/pdf' or file.filename.endswith('.pdf'):
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            content += page.get_text()
        doc.close()
    else:
        raise HTTPException(status_code=400, detail="Only PDF files are supported for extraction")
    
    return {"content": content}

@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED) # Use Note directly
async def create_note_with_upload(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ""
    file_content = await file.read()

    # Determine file type and extract content
    if file.content_type == 'text/plain' or file.filename.endswith('.txt'):
        # Try UTF-8 first, fall back to latin-1 which accepts all byte values
        try:
            content = file_content.decode('utf-8')
        except UnicodeDecodeError:
            content = file_content.decode('latin-1')
    elif file.content_type == 'application/pdf' or file.filename.endswith('.pdf'):
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            content += page.get_text()
        doc.close()
    elif (file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or
          file.filename.endswith('.docx')):
        if not DOCX_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="DOCX support not available. Please install python-docx: pip install python-docx"
            )
        import io
        doc_stream = io.BytesIO(file_content)
        doc = Document(doc_stream)
        for paragraph in doc.paragraphs:
            content += paragraph.text + "\n"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a .txt, .pdf, or .docx file."
        )

    # Sanitize content: normalize to UTF-8 to prevent Windows charmap errors
    content = content.encode('utf-8', errors='replace').decode('utf-8', errors='replace')

    # Create note immediately — return to client without waiting for AI
    note_data = NoteCreate(title=title, content=content)
    db_note = crud.create_note(db=db, note=note_data, user_id=current_user.user_id)
    note_id = db_note.note_id
    user_id = current_user.user_id

    # Run AI summary + achievements in the background (won't block the response)
    async def _background_summarize(note_id: int, content: str, user_id: int):
        from database import SessionLocal as _SessionLocal
        _db = _SessionLocal()
        try:
            summary = await ai_service.summarize_note(content)
            note = _db.query(models.Note).filter(models.Note.note_id == note_id).first()
            if note:
                note.summary = summary
                _db.add(note)
                _db.commit()
        except Exception as e:
            print(f"[Background] Error generating summary for note {note_id}: {e}")
        finally:
            # Achievements
            try:
                total_notes = len(crud.get_user_notes(_db, user_id=user_id))
                if total_notes == 1:
                    crud.unlock_achievement(_db, user_id, 'first_note', 'First Note Created')
                import datetime as _dt
                if _dt.datetime.utcnow().weekday() == 5:
                    crud.unlock_achievement(_db, user_id, 'weekend_warrior', 'Weekend Warrior: Studied on a Saturday')
            except Exception:
                pass
            _db.close()

    background_tasks.add_task(_background_summarize, note_id, content, user_id)
    return db_note

@router.get("/", response_model=list[Note]) # Use Note directly
async def read_notes_for_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    notes = crud.get_user_notes(db, user_id=current_user.user_id)
    return notes

# NEW ENDPOINT FOR SINGLE NOTE RETRIEVAL (already present, but ensure 'Note' is used directly)
@router.get("/{note_id}", response_model=Note) # Use Note directly
async def read_single_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

# --- NEW ENDPOINT FOR FLASHCARD GENERATION ---
@router.post("/{note_id}/generate-flashcards")
async def generate_flashcards_from_note(
    note_id: int,
    num_cards: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Generate flashcards from a note using AI"""
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    if not note.content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note has no content to generate flashcards from")
    
    try:
        # Generate flashcards using AI
        ai_flashcards = await ai_service.generate_flashcards(note.content, num_cards=num_cards)
        
        # Create flashcards in database
        created_flashcards = []
        for card_data in ai_flashcards:
            flashcard = crud.create_flashcard(
                db=db,
                note_id=note_id,
                question_text=card_data.get("question_text", ""),
                answer_text=card_data.get("answer_text", "")
            )
            created_flashcards.append({
                "flashcard_id": flashcard.flashcard_id,
                "question_text": flashcard.question_text,
                "answer_text": flashcard.answer_text
            })
        
        return {"flashcards": created_flashcards, "count": len(created_flashcards)}
        
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating flashcards: {str(e)}")

# --- ENDPOINT TO GET FLASHCARDS FOR A NOTE ---
@router.get("/{note_id}/flashcards")
async def get_note_flashcards(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get all flashcards for a note"""
    flashcards = crud.get_flashcards_for_note(db, note_id=note_id, user_id=current_user.user_id)
    return [
        {
            "flashcard_id": card.flashcard_id,
            "question_text": card.question_text,
            "answer_text": card.answer_text,
            "created_at": card.created_at.isoformat() if card.created_at else None
        }
        for card in flashcards
    ]

# --- DELETE NOTE ---
@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    ok = crud.delete_note(db, note_id=note_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return

# --- UPDATE NOTE ---
@router.put("/{note_id}", response_model=Note)
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

# --- SUMMARIZE NOTE ---
@router.post("/{note_id}/summarize", response_model=Note)
async def summarize_note_endpoint(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note or not note.content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found or empty content")
    try:
        note.summary = await ai_service.summarize_note(note.content)
        db.add(note)
        db.commit()
        db.refresh(note)
    except Exception:
        pass
    return note
@router.post("/{note_id}/translate")
async def translate_note_endpoint(
    note_id: int,
    target_lang: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note or not note.content:
        raise HTTPException(status_code=404, detail="Note not found or empty content")

    try:
        translated = GoogleTranslator(source="auto", target=target_lang).translate(note.content)
        return {"translated_text": translated, "language": target_lang}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")