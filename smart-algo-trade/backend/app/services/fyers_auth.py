import os
import json
from pathlib import Path
from typing import Optional, Dict
from fyers_apiv3 import fyersModel
from dotenv import load_dotenv
from datetime import datetime

# Force load env from the project root or backend folder
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class FyersAuthService:
    def __init__(self):
        self.client_id = os.getenv("FYERS_CLIENT_ID")
        self.secret_key = os.getenv("FYERS_SECRET_KEY")
        # Backend callback endpoint - MUST match Fyers dashboard setting for auto-redirect to work
        self.redirect_uri = "http://127.0.0.1:8001/api/auth/callback"
        self.token_file = Path("data/fyers_session.json")
        self.fyers: Optional[fyersModel.FyersModel] = None
        self.access_token: Optional[str] = None
        self.user_profile: Optional[Dict] = None
        
        self.token_file.parent.mkdir(parents=True, exist_ok=True)
        # Ensure log directory exists
        Path("logs").mkdir(exist_ok=True)
        self._load_session()

    def get_login_url(self) -> str:
        session = fyersModel.SessionModel(
            client_id=self.client_id,
            secret_key=self.secret_key,
            redirect_uri=self.redirect_uri,
            response_type="code",
            grant_type="authorization_code"
        )
        return session.generate_authcode()

    def generate_session(self, auth_code: str) -> Dict:
        """Generate access token from auth code using Fyers API v3"""
        try:
            session = fyersModel.SessionModel(
                client_id=self.client_id,
                secret_key=self.secret_key,
                redirect_uri=self.redirect_uri,
                response_type="code",
                grant_type="authorization_code"
            )
            session.set_token(auth_code)
            # The correct method name for Fyers API v3
            response = session.generate_token()
            
            if response.get("s") == "ok":
                self.access_token = response.get("access_token")
                self._init_fyers()
                self._save_session()
                return {"status": "success", "message": "Authenticated successfully"}
            else:
                raise Exception(f"Failed to generate access token: {response.get('message', 'Unknown error')}")
        except AttributeError as e:
            # If generate_token doesn't exist, try alternative method
            raise Exception(f"Fyers API Error: {str(e)}")

    def _init_fyers(self):
        self.fyers = fyersModel.FyersModel(
            client_id=self.client_id,
            token=self.access_token,
            log_path=str(Path("logs"))
        )
        profile_res = self.fyers.get_profile()
        if profile_res.get("s") == "ok":
            self.user_profile = profile_res.get("data")
            self.user_profile["login_time"] = datetime.now().isoformat()

    def _save_session(self):
        if self.user_profile and self.access_token:
            data = {
                "access_token": self.access_token,
                "user": self.user_profile
            }
            with open(self.token_file, "w") as f:
                json.dump(data, f, indent=2)

    def _load_session(self):
        if self.token_file.exists():
            try:
                with open(self.token_file, "r") as f:
                    data = json.load(f)
                    self.access_token = data.get("access_token")
                    self.fyers = fyersModel.FyersModel(
                        client_id=self.client_id,
                        token=self.access_token,
                        log_path=str(Path("logs"))
                    )
                    self.user_profile = data.get("user")
            except Exception as e:
                print(f"Error loading session: {e}")
                self.access_token = None
                self.fyers = None
                self.user_profile = None

    def get_session(self) -> Dict:
        """Get current session information"""
        return {
            "authenticated": self.is_authenticated(),
            "access_token": self.access_token,
            "user_profile": self.user_profile
        }

    def is_authenticated(self) -> bool:
        return self.fyers is not None and self.access_token is not None

    def logout(self):
        """Clear session and remove token file"""
        self.access_token = None
        self.fyers = None
        self.user_profile = None
        if self.token_file.exists():
            self.token_file.unlink()

    def get_fyers_instance(self) -> fyersModel.FyersModel:
        if not self.is_authenticated():
            raise Exception("Not authenticated")
        return self.fyers

try:
    fyers_auth_service = FyersAuthService()
except Exception as e:
    import logging
    logging.warning(f"Failed to initialize FyersAuthService: {e}")
    fyers_auth_service = None
