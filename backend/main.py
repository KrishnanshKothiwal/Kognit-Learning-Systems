# In backend/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine
import models
import os
import traceback

# Correctly import the 'router' object from each router file
from routers.users import router as users_router
from routers.notes import router as notes_router
from routers.stats import router as stats_router
from routers.nudges import router as nudges_router
from routers.quizzes import router as quizzes_router
from routers.journals import router as journals_router
from routers.calendar import router as calendar_router
from routers.notifications import router as notifications_router
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS origins - allow localhost for development and Vercel domains for production
origins = [
    "http://localhost",        # For direct access
    "http://localhost:3000",   # Your Next.js frontend development server (legacy)
    "http://localhost:3009",   # Your Next.js frontend development server (current)
    "http://127.0.0.1",        # Another way to specify localhost
    "http://127.0.0.1:3000",   # Another way to specify frontend if using 127.0.0.1 (legacy)
    "http://127.0.0.1:3009",   # Another way to specify frontend if using 127.0.0.1 (current)
]

# Allow all origins in development, or specific origins in production
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))
if os.getenv("VERCEL_URL"):
    origins.append(f"https://{os.getenv('VERCEL_URL')}")
    

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler — ensures CORS headers are present even on 500 errors.
# Without this, unhandled exceptions return responses with no CORS headers,
# which the browser incorrectly reports as a CORS error instead of a 500.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    print(f"Unhandled exception on {request.url}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=headers,
    )

# Include all the routers from their respective files

app.include_router(users_router, prefix="/users") # <--- ADDED prefix="/users"
app.include_router(notes_router, prefix="/notes") # <--- ADDED prefix="/notes"
app.include_router(stats_router, prefix="/stats") # <--- ADDED prefix="/stats"
app.include_router(nudges_router, prefix="/nudges")
app.include_router(quizzes_router, prefix="/quizzes")
app.include_router(journals_router, prefix="/journals")
app.include_router(calendar_router, prefix="/calendar")
app.include_router(notifications_router, prefix="/notifications")
@app.get("/")
def read_root():
    return {"message": "Welcome to the EduNudge API"}

@app.get("/health")
async def health_check():
    """Quick health check endpoint"""
    try:
        from database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db.close()
            return {"status": "healthy", "database": "connected"}
        except Exception as db_error:
            db.close()
            return {"status": "healthy", "database": "disconnected", "error": str(db_error)}
    except Exception as e:
        return {"status": "healthy", "server": "running", "error": str(e)}