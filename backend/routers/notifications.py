# In backend/routers/notifications.py

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from database import get_db
from schemas.calendar import CalendarEvent
import models
import crud
import security

router = APIRouter(
    tags=["Notifications"]
)

@router.get("/upcoming-reminders")
async def get_upcoming_reminders(
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get upcoming calendar events that need reminders"""
    now = datetime.utcnow()
    end_time = now + timedelta(hours=hours)
    
    events = crud.get_calendar_events(
        db=db,
        user_id=current_user.user_id,
        start_date=now,
        end_date=end_time
    )
    
    # Filter for events that haven't been reminded and are upcoming
    upcoming = [
        e for e in events 
        if not e.is_completed 
        and not e.reminder_sent 
        and e.start_time >= now
    ]
    
    # Sort by start time
    upcoming.sort(key=lambda x: x.start_time)
    
    return [
        {
            "event_id": e.event_id,
            "title": e.title,
            "start_time": e.start_time.isoformat(),
            "description": e.description,
            "event_type": e.event_type,
            "hours_until": (e.start_time - now).total_seconds() / 3600
        }
        for e in upcoming
    ]

@router.post("/mark-reminder-sent/{event_id}")
async def mark_reminder_sent(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Mark a calendar event as having received a reminder"""
    event = crud.get_calendar_event(db, event_id, current_user.user_id)
    if not event:
        return {"error": "Event not found"}
    
    event.reminder_sent = True
    db.add(event)
    db.commit()
    return {"success": True}

