from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    openai_api_key: str = ""  # Deprecated - using Gemini now
    frontend_url: str = "http://localhost:3009"  # Frontend URL for CORS
    firebase_api_key: str = ""  # Firebase API key (optional, used in security.py)
    firebase_project_id: str = ""  # Firebase project ID (optional)
    huggingface_api_key: str = ""  # Hugging Face API key for summarization
    gemini_api_key: str = ""  # Google Gemini API key for quiz generation
    google_vision_api_key: str = ""  # Google Cloud Vision API key for OCR
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env

settings = Settings()
