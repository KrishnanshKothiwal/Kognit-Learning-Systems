# In backend/routers/quizzes.py

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import crud, models, security
from schemas.quiz import Quiz, QuizCreate, Question, QuestionCreate, QuizAttemptSubmit, QuizResult, QuizAttempt
from database import SessionLocal
from typing import List, Optional
from services import ai_service  # Import AI service for quiz generation
import fitz  # PyMuPDF
from services.ai_service import extract_text_from_image  # For image OCR

# Try to import python-docx for DOCX support
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

router = APIRouter(tags=["quizzes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helper function to extract text from uploaded files ---
async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from uploaded file (PDF, DOCX, or image)"""
    file_content = await file.read()
    content = ""
    
    if file.content_type == 'application/pdf' or file.filename.endswith('.pdf'):
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            content += page.get_text()
        doc.close()
    elif file.content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'] or (file.filename and (file.filename.endswith('.docx') or file.filename.endswith('.doc'))):
        if not DOCX_AVAILABLE:
            raise HTTPException(status_code=400, detail="DOCX support not available. Please install python-docx.")
        import io
        doc = Document(io.BytesIO(file_content))
        content = "\n".join([para.text for para in doc.paragraphs])
    elif file.content_type and file.content_type.startswith('image/'):
        # Use Google Vision API for image OCR
        extracted = await extract_text_from_image(file_content, file.content_type)
        if extracted:
            content = extracted
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from image. Please ensure the image contains readable text.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or image files (JPG/PNG).")
    
    return content

# --- Endpoint 1: Generate a new quiz from a Note ---
@router.post("/generate-from-note/{note_id}", response_model=Quiz)
async def generate_quiz(
    note_id: int,
    num_questions: int = 5,
    difficulty: str = "medium",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    note = crud.get_user_note(db, note_id=note_id, user_id=current_user.user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if not note.content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Note has no content to generate quiz from")

    # Validate difficulty
    if difficulty not in ["easy", "medium", "hard"]:
        difficulty = "medium"

    # Generate quiz using AI
    quiz_data = QuizCreate(title=f"Quiz for '{note.title}' ({difficulty.capitalize()})")
    db_quiz = crud.create_quiz(db, quiz=quiz_data, note_id=note_id, user_id=current_user.user_id)
    
    try:
        # Generate questions using AI with difficulty
        ai_questions = await ai_service.generate_quiz_questions(
            note.content, 
            note.title, 
            num_questions=max(1, min(20, num_questions)),
            difficulty=difficulty
        )
        
        # Create questions from AI response
        for q_data in ai_questions:
            question = QuestionCreate(
                question_text=q_data.get("question_text", ""),
                options=q_data.get("options", []),
                correct_answer=q_data.get("correct_answer", "")
            )
            crud.create_question(db, question=question, quiz_id=db_quiz.quiz_id)
    except Exception as e:
        print(f"Error generating quiz with AI: {e}")
        # Fallback to at least one dummy question
        fallback_question = QuestionCreate(
            question_text=f"What is the main topic of '{note.title}'?",
            options=["Topic A", "Topic B", "Topic C", note.title],
            correct_answer=note.title
        )
        crud.create_question(db, question=fallback_question, quiz_id=db_quiz.quiz_id)
    
    # Refetch quiz with questions
    db_quiz_with_questions = crud.get_quiz(db, quiz_id=db_quiz.quiz_id, user_id=current_user.user_id)
    
    # Manually parse options from JSON string back to list for the response model
    for q in db_quiz_with_questions.questions:
        q.options = json.loads(q.options)
        
    return db_quiz_with_questions

# --- NEW Endpoint: Generate quiz from file upload ---
@router.post("/generate-from-file", response_model=Quiz)
async def generate_quiz_from_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    num_questions: int = Form(5),
    difficulty: str = Form("medium"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Generate a quiz from an uploaded file (PDF, DOCX, or image)"""
    
    # Validate difficulty
    if difficulty not in ["easy", "medium", "hard"]:
        difficulty = "medium"
    
    # Validate num_questions
    num_questions = max(1, min(20, num_questions))
    
    try:
        # Extract text from file
        content = await extract_text_from_file(file)
        
        if not content or len(content.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract sufficient text from the file. Please ensure the file contains readable text."
            )
        
        # Generate quiz using AI
        quiz_data = QuizCreate(title=f"{title} ({difficulty.capitalize()})")
        db_quiz = crud.create_quiz(db, quiz=quiz_data, note_id=None, user_id=current_user.user_id)
        
        # Generate questions using AI with difficulty
        ai_questions = await ai_service.generate_quiz_questions(
            content, 
            title, 
            num_questions=num_questions,
            difficulty=difficulty
        )
        
        if not ai_questions or len(ai_questions) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate quiz questions. Please try again or check your file content."
            )
        
        # Create questions from AI response
        for q_data in ai_questions:
            question = QuestionCreate(
                question_text=q_data.get("question_text", ""),
                options=q_data.get("options", []),
                correct_answer=q_data.get("correct_answer", "")
            )
            crud.create_question(db, question=question, quiz_id=db_quiz.quiz_id)
        
        # Refetch quiz with questions
        db_quiz_with_questions = crud.get_quiz(db, quiz_id=db_quiz.quiz_id, user_id=current_user.user_id)
        
        # Manually parse options from JSON string back to list for the response model
        for q in db_quiz_with_questions.questions:
            q.options = json.loads(q.options)
            
        return db_quiz_with_questions
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating quiz from file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating quiz: {str(e)}"
        )

# --- Endpoint 2: Get a specific quiz (for taking it) ---
@router.get("/{quiz_id}", response_model=Quiz)
async def read_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id, user_id=current_user.user_id)
    if not db_quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        
    # Manually parse options from JSON string back to list
    for q in db_quiz.questions:
        q.options = json.loads(q.options)
        
    return db_quiz

# --- Endpoint 3: Submit quiz answers ---
@router.post("/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz(
    quiz_id: int,
    submission: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id, user_id=current_user.user_id)
    if not db_quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    total_questions = len(db_quiz.questions)
    correct_count = 0
    
    # Grade the quiz (normalize answers)
    review_details = []
    for question in db_quiz.questions:
        user_answer = submission.answers.get(str(question.question_id)) or submission.answers.get(question.question_id)
        ua = (user_answer or "").strip().casefold()
        ca = (question.correct_answer or "").strip().casefold()
        is_correct = ua == ca
        if is_correct:
            correct_count += 1
        review_details.append({
            "question_id": question.question_id,
            "question_text": question.question_text,
            "options": json.loads(question.options),
            "correct_answer": question.correct_answer,
            "user_answer": user_answer or "",
            "is_correct": is_correct
        })
            
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # Save the attempt
    # Persist user answers for future review
    try:
        answers_json = json.dumps(submission.answers)
    except Exception:
        answers_json = None
    db_attempt = crud.create_quiz_attempt(db, quiz_id=quiz_id, user_id=current_user.user_id, score=score, answers_json=answers_json)
    
    # Achievements: Quiz Master 100%
    try:
        if int(round(score)) == 100:
            crud.unlock_achievement(db, current_user.user_id, 'quiz_master', 'Quiz Master: Scored 100% on a quiz')
    except Exception:
        pass

    # Return extended payload with review details
    return {
        "attempt_id": db_attempt.attempt_id,
        "quiz_id": db_attempt.quiz_id,
        "user_id": db_attempt.user_id,
        "score": db_attempt.score,
        "completed_at": db_attempt.completed_at,
        "quiz_title": db_quiz.title,
        "total_questions": total_questions,
        "details": review_details
    }

# --- Attempt details (for viewing past quizzes) ---
@router.get("/attempts/{attempt_id}")
async def get_attempt_details(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    attempt = db.query(models.UserQuizAttempt).filter(
        models.UserQuizAttempt.attempt_id == attempt_id,
        models.UserQuizAttempt.user_id == current_user.user_id
    ).first()
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    quiz = crud.get_quiz(db, quiz_id=attempt.quiz_id, user_id=current_user.user_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Persistence of user answers is not enabled by default (no migration yet)
    # If answers_json column exists and is populated, return details; else 501
    answers_json = getattr(attempt, 'answers_json', None)
    user_answers = {}
    if answers_json:
        try:
            user_answers = json.loads(answers_json)
        except Exception:
            user_answers = {}

    details = []
    for q in quiz.questions:
        opts = json.loads(q.options)
        ua = (str(user_answers.get(str(q.question_id), "")) or "")
        details.append({
            "question_id": q.question_id,
            "question_text": q.question_text,
            "options": opts,
            "correct_answer": q.correct_answer,
            "user_answer": ua,
            "is_correct": (ua.strip().casefold() == (q.correct_answer or "").strip().casefold())
        })

    return {
        "attempt_id": attempt.attempt_id,
        "quiz_id": attempt.quiz_id,
        "quiz_title": quiz.title,
        "score": attempt.score,
        "completed_at": attempt.completed_at,
        "total_questions": len(quiz.questions),
        "details": details
    }

# --- DELETE QUIZ ---
@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    ok = crud.delete_quiz(db, quiz_id=quiz_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return

# --- Endpoint 4: Get all quiz attempts for the user (with pagination) ---
@router.get("/history/all", response_model=List[QuizResult])
async def read_quiz_history(
    skip: int = 0,
    limit: int = 50,  # Limit to 50 most recent attempts
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Optimize query with join to avoid N+1 queries
    from sqlalchemy.orm import joinedload
    
    attempts = db.query(models.UserQuizAttempt).options(
        joinedload(models.UserQuizAttempt.quiz).joinedload(models.Quiz.questions)
    ).filter(
        models.UserQuizAttempt.user_id == current_user.user_id
    ).order_by(models.UserQuizAttempt.completed_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for attempt in attempts:
        quiz = attempt.quiz  # Already loaded via join
        if quiz:
            results.append(QuizResult(
                attempt_id=attempt.attempt_id,
                quiz_id=attempt.quiz_id,
                user_id=attempt.user_id,
                score=attempt.score,
                completed_at=attempt.completed_at,
                quiz_title=quiz.title,
                total_questions=len(quiz.questions) if quiz.questions else 0
            ))
    return results