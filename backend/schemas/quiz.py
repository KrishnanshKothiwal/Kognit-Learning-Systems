# In backend/schemas/quiz.py

from pydantic import BaseModel
import datetime
from typing import List, Dict, Optional

# --- Question Schemas ---
class QuestionBase(BaseModel):
    question_text: str
    options: List[str] # Expect a list of strings
    correct_answer: str

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    question_id: int
    quiz_id: int

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuizBase(BaseModel):
    title: str

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    quiz_id: int
    note_id: Optional[int] = None
    user_id: int
    created_at: datetime.datetime
    questions: List[Question] = [] # Include questions when fetching a full quiz

    class Config:
        from_attributes = True

# --- Quiz Attempt Schemas ---
class QuizAttemptSubmit(BaseModel):
    # Frontend will send a dictionary of {question_id: answer_text}
    answers: Dict[int, str] 

class QuizAttempt(BaseModel):
    attempt_id: int
    quiz_id: int
    user_id: int
    score: float
    completed_at: datetime.datetime

    class Config:
        from_attributes = True

class QuizReviewDetail(BaseModel):
    question_id: int
    question_text: str
    options: List[str]
    correct_answer: str
    user_answer: str
    is_correct: bool

class QuizResult(QuizAttempt):
    quiz_title: str
    total_questions: int
    details: List[QuizReviewDetail] | None = None