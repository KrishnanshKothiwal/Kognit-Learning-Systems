# In backend/routers/calendar.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from schemas.calendar import CalendarEvent, CalendarEventCreate, CalendarEventUpdate
import models
import crud
import security

router = APIRouter(
    tags=["Calendar"]
)

@router.post("/", response_model=CalendarEvent, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event: CalendarEventCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    db_event = crud.create_calendar_event(db=db, event=event, user_id=current_user.user_id)
    return db_event

@router.get("/", response_model=List[CalendarEvent])
async def read_calendar_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,  # Reduced limit for faster loading
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    try:
        if not start_date:
            start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        if not end_date:
            # Reduced default range to 7 days instead of 30 for faster loading
            end_date = start_date + timedelta(days=7)
        
        # Simple optimized query - let SQLAlchemy handle it efficiently
        events = db.query(models.CalendarEvent).filter(
            models.CalendarEvent.user_id == current_user.user_id,
            models.CalendarEvent.start_time >= start_date,
            models.CalendarEvent.start_time <= end_date
        ).order_by(models.CalendarEvent.start_time.asc()).limit(limit).all()
        
        return events
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        # Return empty list on error rather than failing
        return []

@router.get("/upcoming", response_model=List[CalendarEvent])
async def get_upcoming_events(
    days: int = 7,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=days)
    events = crud.get_calendar_events(
        db=db, 
        user_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date
    )
    # Filter for upcoming (not completed)
    return [e for e in events if not e.is_completed and e.start_time >= start_date]

@router.get("/{event_id}", response_model=CalendarEvent)
async def read_calendar_event(
    event_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    db_event = crud.get_calendar_event(db=db, event_id=event_id, user_id=current_user.user_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return db_event

@router.put("/{event_id}", response_model=CalendarEvent)
async def update_calendar_event(
    event_id: int,
    payload: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_event = crud.get_calendar_event(db=db, event_id=event_id, user_id=current_user.user_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    
    if payload.title is not None:
        db_event.title = payload.title
    if payload.description is not None:
        db_event.description = payload.description
    if payload.start_time is not None:
        db_event.start_time = payload.start_time
    if payload.end_time is not None:
        db_event.end_time = payload.end_time
    if payload.event_type is not None:
        db_event.event_type = payload.event_type
    if payload.is_completed is not None:
        db_event.is_completed = payload.is_completed
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    ok = crud.delete_calendar_event(db=db, event_id=event_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return

