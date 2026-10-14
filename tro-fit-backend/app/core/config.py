import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Tro-Fit Auth System"
    API_V1_STR: str = "/api/v1"
    
    # DB Configuration
    # Fallback to local SQLite file: app/../users.db
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'users.db')}")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.environ["JWT_SECRET_KEY"]
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

settings = Settings()
