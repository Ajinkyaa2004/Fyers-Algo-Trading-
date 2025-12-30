from fastapi import APIRouter, HTTPException, Query, Body, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import Dict
from app.services.fyers_auth import fyers_auth_service
from app.models import User
from database import get_db
from app.logger import get_logger
from app.auth import jwt_manager
from datetime import datetime
import uuid

logger = get_logger(__name__)
router = APIRouter()

@router.get("/login")
async def get_login_url():
    """Get Fyers OAuth login URL."""
    try:
        if not fyers_auth_service:
            raise HTTPException(status_code=503, detail="Auth service not initialized")
        login_url = fyers_auth_service.get_login_url()
        logger.info(f"Generated login URL")
        return {"status": "success", "login_url": login_url}
    except Exception as e:
        logger.error(f"Error getting login URL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback")
async def auth_callback(
    auth_code: str = Query(None),
    error: str = Query(None),
    s: str = Query(None),
    code: str = Query(None)
):
    """Handle OAuth callback from Fyers"""
    logger.info(f"Callback received - auth_code present: {bool(auth_code)}, s={s}, code={code}")
    
    if error:
        logger.warning(f"OAuth error: {error}")
        return HTMLResponse(f"""
        <html>
            <body>
                <script>
                    window.location.href = 'http://127.0.0.1:3000/login?error={error}';
                </script>
            </body>
        </html>
        """)
    
    if not auth_code:
        logger.warning("No auth code received")
        return HTMLResponse("""
        <html>
            <body>
                <script>
                    window.location.href = 'http://127.0.0.1:3000/login?error=No+auth+code+received';
                </script>
            </body>
        </html>
        """)
    
    try:
        logger.info(f"Processing auth code...")
        if not fyers_auth_service:
            raise Exception("Auth service not initialized")
        result = fyers_auth_service.generate_session(auth_code)
        logger.info(f"Auth successful: {result}")
        # Redirect to frontend with success flag
        return HTMLResponse("""
        <html>
            <head><title>Redirecting...</title></head>
            <body>
                <p>Authentication successful! Redirecting...</p>
                <script>
                    setTimeout(() => {
                        window.location.href = 'http://127.0.0.1:3000/?login=success';
                    }, 500);
                </script>
            </body>
        </html>
        """)
    except Exception as e:
        logger.error(f"Error processing auth code: {str(e)}", exc_info=True)
        error_msg = str(e).replace(" ", "+").replace(":", "%3A")
        return HTMLResponse(f"""
        <html>
            <head><title>Error</title></head>
            <body>
                <p>Error: {error_msg}</p>
                <script>
                    setTimeout(() => {{
                        window.location.href = 'http://127.0.0.1:3000/login?error=Auth+failed';
                    }}, 2000);
                </script>
            </body>
        </html>
        """)

@router.post("/process-code")
async def process_code(data: Dict = Body(...)):
    auth_code = data.get("auth_code")
    if not auth_code:
        raise HTTPException(status_code=400, detail="auth_code is required")
    try:
        result = fyers_auth_service.generate_session(auth_code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_auth_status():
    if not fyers_auth_service:
        return {
            "is_authenticated": False,
            "user": None,
            "status": "service_unavailable"
        }
    is_authenticated = fyers_auth_service.is_authenticated()
    return {
        "is_authenticated": is_authenticated,
        "user": fyers_auth_service.user_profile if is_authenticated else None
    }

@router.post("/logout")
async def logout():
    try:
        fyers_auth_service.logout()
        return {"status": "success", "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
