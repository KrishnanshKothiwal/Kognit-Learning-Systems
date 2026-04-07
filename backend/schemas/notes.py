# In backend/schemas/notes.py

from pydantic import BaseModel
from datetime import datetime

# The basic properties of a note
class NoteBase(BaseModel):
    title: str
    content: str | None = None

# The properties we expect when a user creates a note
class NoteCreate(NoteBase):
    content: str | None = None

# For updates (partial allowed)
class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None

# The properties we will return from the API (for listing/single note)
class Note(NoteBase):
    note_id: int
    user_id: int
    summary: str | None = None
    created_at: datetime # Use datetime directly for Pydantic v2. For older, use datetime.datetime

    class Config:
        from_attributes = True