# In backend/schemas/journal.py

from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

# Schema for creating a journal entry (what frontend sends)
class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=1, description="Content of the journal entry")

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

# Schema for displaying a journal entry (what backend sends to frontend)
class JournalEntry(BaseModel):
    entry_id: int
    user_id: int
    title: Optional[str] = None
    content: str
    summary: Optional[str] = None
    emotions: Optional[str] = None # Will be a JSON string of detected emotions
    ai_nudge: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True