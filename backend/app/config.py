import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "SANGYAN - Investor Safety & Content Risk Analyzer"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    DEFAULT_LANGUAGE: str = "en"

settings = Settings(
    GEMINI_API_KEY=os.getenv("GEMINI_API_KEY", ""),
    GROQ_API_KEY=os.getenv("GROQ_API_KEY", "")
)