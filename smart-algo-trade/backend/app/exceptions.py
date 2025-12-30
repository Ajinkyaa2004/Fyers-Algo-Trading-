from fastapi import HTTPException
from typing import Any, Dict

class APIException(HTTPException):
    """Base API exception."""
    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)

class ValidationError(APIException):
    """Validation error."""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=422)

class AuthenticationError(APIException):
    """Authentication error."""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(detail, status_code=401)

class AuthorizationError(APIException):
    """Authorization error."""
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(detail, status_code=403)

class NotFoundError(APIException):
    """Resource not found error."""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=404)

def error_response(message: str, error: str = None, status_code: int = 500) -> Dict[str, Any]:
    """Create standardized error response."""
    return {
        "status": "error",
        "message": message,
        "error": error,
        "code": status_code
    }

def success_response(data: Any = None, message: str = "Success") -> Dict[str, Any]:
    """Create standardized success response."""
    return {
        "status": "success",
        "message": message,
        "data": data
    }
