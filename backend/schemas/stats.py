# In backend/schemas/stats.py

from pydantic import BaseModel

class UserStats(BaseModel):
    total_notes: int
    quizzes_taken: int
    average_score: float | None = None
class QuizHistoryItem(BaseModel):
    name: str
    score: int
