---

# Kognit

## Project Name & Overview

Kognit is an AI-powered learning and reflection platform designed to convert passive studying into an active, adaptive, and personalized learning process.

The platform integrates note ingestion, intelligent summarization, quiz generation, behavioral nudging, and reflective journaling into a single system. It creates a continuous feedback loop between learning, evaluation, and motivation, enabling students to improve retention, consistency, and academic performance.

---

## Problem It Solves

### 1. Passive Learning

Most students consume content passively through reading or watching, which leads to low retention and poor recall. There is no built-in mechanism for active reinforcement.

### 2. Lack of Personalization

Learning systems do not adapt to individual pace, strengths, weaknesses, or behavioral patterns. Every student receives the same static experience.

### 3. Motivation and Consistency Gap

Students struggle with consistency despite having clear goals. There is no system to detect disengagement, stress, or declining performance and intervene appropriately.

### 4. Fragmented Tooling

Students rely on multiple disconnected tools:

* Notes in one platform
* Quizzes in another
* Calendar separately
* No structured reflection

This fragmentation prevents the creation of a unified learning feedback loop.

---

## Target Users (Personas)

### 1. College Student (Primary)

* Prepares for exams, assignments, and placements
* Needs structured revision and active recall
* Struggles with consistency and time management

### 2. Competitive Exam Aspirant

* Studies large volumes of content over long durations
* Requires high retention and frequent revision
* Needs performance tracking and weak-area identification

### 3. Self-Learner

* Learns from online resources (YouTube, PDFs, courses)
* Lacks structure and accountability
* Needs guided learning and feedback

---

## Vision Statement

To build an intelligent learning system that acts as a personalized cognitive layer for students, continuously adapting to how they learn, what they forget, and when they need intervention, ultimately maximizing retention, consistency, and performance.

---

## Key Features / Goals

### 1. Intelligent Content Processing

* Upload PDFs, DOCX, or raw notes
* AI-generated summaries and key concepts
* Structured knowledge extraction

### 2. Automated Quiz Generation

* Generate quizzes directly from notes
* Support multiple formats (MCQs, flashcards)
* Reinforce active recall

### 3. Personalized Learning Loop

* Track performance across quizzes and sessions
* Identify weak areas and knowledge gaps
* Adapt future content and quizzes accordingly

### 4. Reflective Journaling with Analysis

* Allow students to log learning experiences
* Perform sentiment and stress analysis
* Detect burnout or disengagement patterns

### 5. Behavioral Nudging System

* Send personalized reminders and motivation nudges
* Trigger interventions based on inactivity or decline
* Reinforce consistency and habit formation

### 6. Study Planning and Tracking

* Calendar-based scheduling
* Goal setting and milestone tracking
* Integration with learning tasks

### 7. Analytics Dashboard

* Track progress over time
* Visualize performance trends
* Provide actionable insights

---

## Success Metrics

### Engagement Metrics

* Daily Active Users (DAU)
* Weekly retention rate
* Average session duration

### Learning Effectiveness

* Quiz accuracy improvement over time
* Reduction in repeated mistakes
* Completion rate of study goals

### Behavioral Metrics

* Consistency (days active per week)
* Drop-off rate after initial usage
* Response rate to nudges

### Product Metrics

* Number of notes uploaded per user
* Number of quizzes generated per user
* Feature usage distribution

---

## Assumptions & Constraints

### Assumptions

* Students are willing to adopt AI-assisted learning tools
* Active recall (quizzing) improves retention significantly
* Behavioral nudges can improve consistency
* Users will provide enough data (notes, interactions) for personalization

### Constraints

* Accuracy of AI-generated summaries and quizzes
* Dependence on external AI APIs (e.g., Gemini)
* Latency and cost constraints for real-time processing
* Data privacy and secure handling of user content
* Limited initial training data for personalization models

---


## Quick Start – Local Development

### Prerequisites
- Docker Desktop installed
- Git installed

### Steps to Run

1. Clone the repository
git clone <your-repo-link>
cd kognit

2. Build Docker containers
docker build -t kognit .

3. Run the application
docker run -p 3000:3000 kognit

OR (if using docker-compose)
docker-compose up --build

4. Access the application
http://localhost:3000


## Local Development Tools

- Frontend: Next.js
- Backend: FastAPI
- Database: SQLite
- Containerization: Docker


## Branching Strategy

This project follows GitHub Flow:

- main → stable production-ready code
- feature/* → new features and development work
- Pull Requests are used to merge feature branches into main

Example branch:
feature/mvp-moscow-alignment


## Proof of Setup

The following screenshots are included in the repository:

- Docker build and run in terminal
- Application running on localhost
- GitHub repository with branches and README


