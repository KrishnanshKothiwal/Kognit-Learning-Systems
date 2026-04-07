# AI Integration Setup Guide

This guide explains how to enable AI features for the EduNudge application without paid API keys.

## Prerequisites

- Python 3.10+

## Installation

Install optional free packages (used if available):

```bash
pip install python-docx vaderSentiment
```

- `python-docx`: DOCX reading (notes upload)
- `vaderSentiment`: Mood detection from journal entries

All features have graceful fallbacks if a package is missing.

## Environment Configuration

No paid API key is required. You can still optionally add:

```env
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your_secret_key_here
```

If you later choose to use paid providers, extend `services/ai_service.py` accordingly.

## Features Enabled (Free Stack)

### 1. Note Summarization
- Automatically generates summaries when notes are uploaded (heuristic summarizer)
- Supports PDF, TXT, and DOCX files (DOCX requires python-docx)

### 2. Quiz Generation
- Generates multiple-choice questions (1 correct + 3 distractors) from note content
- Heuristic generation; no external paid API needed

### 3. Flashcard Generation
- Creates Q&A flashcards from note content (heuristic)

### 4. Journal Mood Analysis + Nudges
- Detects sentiment (positive/neutral/negative) with VADER if available
- Provides short personalized nudges based on mood

## API Endpoints

### Notes
- `POST /notes/` - Upload a note (auto-generates summary)
- `POST /notes/{note_id}/generate-flashcards` - Generate flashcards from a note
- `GET /notes/{note_id}/flashcards` - Get all flashcards for a note

### Quizzes
- `POST /quizzes/generate-from-note/{note_id}` - Generate a quiz from note content

### Journals
- `POST /journals/` - Create journal entry (auto-analyzes mood + nudge)

### Nudges
- `GET /nudges/daily/` - Get personalized nudge based on recent journal mood

## Troubleshooting

- DOCX not working: `pip install python-docx`
- Mood analysis not working: `pip install vaderSentiment`

All features degrade gracefully if optional packages are not installed.

