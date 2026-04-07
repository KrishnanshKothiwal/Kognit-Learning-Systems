# EduNudge: An AI-Powered Learning & Reflection Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-05998b)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/frontend-Next.js-black.svg)](https://nextjs.org/)

A modern web application designed to enhance student learning through AI-powered note summarization, intelligent quiz generation, and personalized learning nudges. The platform combines study tools with reflective journaling to create a comprehensive learning experience.

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Future Enhancements](#future-enhancements)

## About The Project

EduNudge is an intelligent learning platform that helps students:
- Transform study notes into concise summaries and interactive quizzes
- Track learning progress through a comprehensive dashboard
- Maintain a reflective learning journal with AI-powered emotion analysis
- Receive personalized motivation nudges based on learning patterns
- Set and track academic goals with integrated calendar features

## Key Features

- **📝 Smart Notes Management**
  - Upload documents (PDF, DOCX) or write notes directly
  - AI-powered summarization and key point extraction
  - Organize notes with tags and categories

- **🧠 Intelligent Quiz Generation**
  - Automatic quiz creation from notes
  - Multiple choice and flashcard formats
  - Performance tracking and analytics

- **📅 Study Calendar**
  - Schedule study sessions and deadlines
  - Track learning goals and milestones
  - Integrated with note-taking and quizzes

- **✍️ Reflective Journal**
  - Private journaling space
  - AI emotion analysis for stress detection
  - Personalized motivation nudges

- **📊 Analytics Dashboard**
  - Visual progress tracking
  - Quiz performance analytics
  - Study habit insights

## Architecture

The application follows a modern three-tier architecture:

### Frontend (Presentation Layer)
- Next.js 13+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn UI components
- Firebase Authentication

### Backend (Business Layer)
- FastAPI (Python 3.10+)
- SQLAlchemy ORM
- Pydantic for data validation
- Google Gemini AI for intelligence features
- JWT-based authentication

### Database (Data Layer)
- PostgreSQL for production
- SQLite for development
- Alembic for migrations

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Tremor for analytics
- Framer Motion for animations

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Google Gemini AI
- VaderSentiment for emotion analysis

### Database & Tools
- PostgreSQL/SQLite
- Alembic migrations
- Firebase Auth
- Docker (optional)

## Getting Started

### Prerequisites

- Node.js 18+ (Frontend)
- Python 3.10+ (Backend)
- PostgreSQL (Production) or SQLite (Development)

### Backend Setup

1. Clone the repository:
\`\`\`bash
git clone [repository-url]
cd edunudge/backend
\`\`\`

2. Create and activate Python virtual environment:
\`\`\`bash
python -m venv venv
\`\`\`

3. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Configure environment variables:
Create a .env file in the backend directory:
\`\`\`env
DATABASE_URL=postgresql://user:password@localhost/edunudge_db
SECRET_KEY=your_secret_key_here
FRONTEND_URL=http://localhost:3009
GEMINI_API_KEY=your_gemini_api_key_here
\`\`\`

5. Run migrations:
\`\`\`bash
alembic upgrade head
\`\`\`

6. Start the backend server:
\`\`\`bash
uvicorn main:app --reload --port 8000
\`\`\`

### Frontend Setup

1. Navigate to frontend directory:
\`\`\`bash
cd ../frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure environment variables:
Create .env.local:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
\`\`\`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at http://localhost:3009

## Future Enhancements

1. **Advanced Study Tools**
   - Spaced repetition system for flashcards
   - Collaborative study groups
   - Real-time document collaboration

2. **Enhanced AI Features**
   - Personalized study recommendations
   - Advanced performance predictions
   - Content difficulty analysis

3. **Integration & Export**
   - Calendar sync with Google/Outlook
   - Export notes to various formats
   - Mobile app development

4. **Analytics & Insights**
   - Advanced learning analytics
   - Study pattern recommendations
   - Progress prediction models