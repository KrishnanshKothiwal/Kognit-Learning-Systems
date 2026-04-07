# In backend/schemas/calendar.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    event_type: str = "study"  # study, assignment, exam, reminder, etc.

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_type: Optional[str] = None
    is_completed: Optional[bool] = None

class CalendarEvent(CalendarEventBase):
    event_id: int
    user_id: int
    reminder_sent: bool
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

