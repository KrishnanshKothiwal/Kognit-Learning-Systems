# In backend/schemas/nudge.py

from pydantic import BaseModel
from typing import Optional

class NudgeBase(BaseModel):
    content: str

class NudgeCreate(NudgeBase):
    pass

class NudgeUpdate(NudgeBase):
    content: Optional[str] = None

class Nudge(NudgeBase):
    nudge_id: int

    class Config:
        from_attributes = True

class DailyNudge(BaseModel):
    content: str