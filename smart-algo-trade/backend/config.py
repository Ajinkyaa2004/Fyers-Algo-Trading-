import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    """Application configuration with validation."""
    
    # Fyers API Config
    FYERS_CLIENT_ID = os.getenv("FYERS_CLIENT_ID")
    FYERS_SECRET_KEY = os.getenv("FYERS_SECRET_KEY")
    FYERS_REDIRECT_URI = os.getenv("FYERS_REDIRECT_URI", "http://127.0.0.1:8001/api/auth/callback")
    
    # Backend Config
    BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8001"))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database Config
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_algo_trade.db")
    
    # Security
    ALLOWED_ORIGINS = [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ]
    
    TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    @classmethod
    def validate(cls):
        """Validate required configuration."""
        if not cls.FYERS_CLIENT_ID:
            raise ValueError("FYERS_CLIENT_ID not set in environment variables")
        if not cls.FYERS_SECRET_KEY:
            raise ValueError("FYERS_SECRET_KEY not set in environment variables")
        return True

settings = Settings()
