"""
Fyers API Authentication and Testing Script
Uses the apiCalls.py pattern to authenticate and test API
"""
from fyers_apiv3 import fyersModel
import json
from pathlib import Path

# Configuration - UPDATE THESE WITH YOUR VALUES
CLIENT_ID = "BDJ0JIY3EC-100"  # From your .env
SECRET_KEY = "79XDF3PCDM"      # From your .env
REDIRECT_URI = "http://127.0.0.1:8001/api/auth/callback"
LOG_PATH = "./logs"

def get_login_url():
    """Generate the login URL for Fyers OAuth"""
    session = fyersModel.SessionModel(
        client_id=CLIENT_ID,
        secret_key=SECRET_KEY,
        redirect_uri=REDIRECT_URI,
        response_type="code",
        grant_type="authorization_code"
    )
    login_url = session.generate_authcode()
    print("🔐 Login URL:")
    print(login_url)
    print("\n⚠️  Open this URL in your browser to authenticate")
    return login_url

def generate_access_token(auth_code):
    """Generate access token from auth code"""
    try:
        session = fyersModel.SessionModel(
            client_id=CLIENT_ID,
            secret_key=SECRET_KEY,
            redirect_uri=REDIRECT_URI,
            response_type="code",
            grant_type="authorization_code"
        )
        session.set_token(auth_code)
        response = session.generate_token()
        
        print("\n📋 Token Response:")
        print(json.dumps(response, indent=2))
        
        if response.get("s") == "ok":
            token = response.get("access_token")
            print(f"\n✅ Access Token Generated Successfully!")
            print(f"Token: {token[:50]}...")
            return token
        else:
            print(f"❌ Error: {response.get('message', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"❌ Error generating token: {str(e)}")
        return None

def test_api_calls(access_token):
    """Test various Fyers API calls"""
    try:
        fyers = fyersModel.FyersModel(
            client_id=CLIENT_ID,
            token=access_token,
            log_path=LOG_PATH
        )
        
        print("\n🔍 Testing API Calls:")
        
        # Get Profile
        print("\n1️⃣  Getting Profile...")
        profile = fyers.get_profile()
        print(json.dumps(profile, indent=2)[:500])
        
        # Get Funds
        print("\n2️⃣  Getting Funds...")
        funds = fyers.funds()
        print(json.dumps(funds, indent=2)[:500])
        
        # Get Holdings
        print("\n3️⃣  Getting Holdings...")
        holdings = fyers.holdings()
        print(json.dumps(holdings, indent=2)[:500])
        
        # Get Positions
        print("\n4️⃣  Getting Positions...")
        positions = fyers.positions()
        print(json.dumps(positions, indent=2)[:500])
        
        return True
    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        return False

def save_token(token):
    """Save token to file for later use"""
    token_file = Path("data/fyers_session.json")
    token_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(token_file, 'w') as f:
        json.dump({"access_token": token}, f)
    print(f"✅ Token saved to {token_file}")

if __name__ == "__main__":
    print("=" * 60)
    print("FYERS API AUTHENTICATION & TESTING")
    print("=" * 60)
    
    import sys
    
    if len(sys.argv) > 1:
        auth_code = sys.argv[1]
        print(f"\n🔐 Using provided auth code...")
        token = generate_access_token(auth_code)
        
        if token:
            save_token(token)
            test_api_calls(token)
    else:
        print("\n📝 STEP 1: Get Login URL")
        login_url = get_login_url()
        
        print("\n" + "=" * 60)
        print("STEP 2: After authentication, run:")
        print("python test_fyers_api.py <YOUR_AUTH_CODE>")
        print("=" * 60)
