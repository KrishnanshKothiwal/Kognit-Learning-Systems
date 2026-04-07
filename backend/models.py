# In backend/models.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean, Text # <-- Ensure Text is imported
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    notes = relationship("Note", back_populates="user")
    quizzes = relationship("Quiz", back_populates="user")
    quiz_attempts = relationship("UserQuizAttempt", back_populates="user")
    journal_entries = relationship("JournalEntry", back_populates="user")
    calendar_events = relationship("CalendarEvent", back_populates="user")

class Note(Base):
    __tablename__ = "notes"
    note_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text, nullable=True)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.user_id"))

    user = relationship("User", back_populates="notes")
    quizzes = relationship("Quiz", back_populates="note")
    flashcards = relationship("Flashcard", back_populates="note", cascade="all, delete-orphan")

class Quiz(Base):
    __tablename__ = "quizzes"
    quiz_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    note_id = Column(Integer, ForeignKey("notes.note_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quizzes")
    note = relationship("Note", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("UserQuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    question_id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"))
    question_text = Column(String, nullable=False)
    options = Column(Text, nullable=False) # <-- CHANGE THIS LINE BACK TO TEXT
    correct_answer = Column(String, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")

class UserQuizAttempt(Base):
    __tablename__ = "user_quiz_attempts"
    attempt_id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.quiz_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    score = Column(Float, nullable=False)
    answers_json = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    entry_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String, index=True, nullable=True) # Optional title for the entry
    content = Column(Text, nullable=False)
    # AI-generated fields
    summary = Column(Text, nullable=True) # AI-generated summary
    emotions = Column(Text, nullable=True) # AI-detected emotions (e.g., JSON string)
    ai_nudge = Column(Text, nullable=True) # AI-generated personalized nudge
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="journal_entries")

class Flashcard(Base):
    __tablename__ = "flashcards"
    flashcard_id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.note_id"))
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    note = relationship("Note", back_populates="flashcards")

# Achievements
class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    key = Column(String, index=True)  # e.g., first_note, quiz_master
    title = Column(String)
    earned_at = Column(DateTime, default=datetime.datetime.utcnow)

class AchievementProgress(Base):
    __tablename__ = "achievement_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    key = Column(String, index=True)  # e.g., polyglot_uses
    count = Column(Integer, default=0)

# Calendar Events
class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    __table_args__ = (
        # Composite index for faster queries on (user_id, start_time)
        {'mysql_engine': 'InnoDB'},
    )
    event_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)  # Ensure index on user_id
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True)
    event_type = Column(String, default="study")  # study, assignment, exam, reminder, etc.
    reminder_sent = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="calendar_events")
