import os
import logging
from typing import Optional
from datetime import datetime, timedelta
import jwt
from functools import wraps
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer

logger = logging.getLogger(__name__)

class JWTManager:
    """Manage JWT tokens for secure API authentication."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_access_token(self, user_id: str, expires_minutes: int = 1440) -> str:
        """Create JWT access token."""
        expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: str, expires_days: int = 7) -> str:
        """Create JWT refresh token."""
        expire = datetime.utcnow() + timedelta(days=expires_days)
        payload = {
            "sub": user_id,
            "exp": expire,
            "type": "refresh"
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[str]:
        """Create new access token from refresh token."""
        payload = self.verify_token(refresh_token)
        if payload and payload.get("type") == "refresh":
            return self.create_access_token(payload["sub"])
        return None

# Initialize JWT manager (should be configured with SECRET_KEY from .env)
jwt_manager = JWTManager(secret_key=os.getenv("JWT_SECRET", "your-secret-key-change-in-production"))
