"""
Manual token generation script using browser-based authentication
Run this to get an access token that works with your Fyers account
"""
import os
from fyers_apiv3 import fyersModel
import webbrowser
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

APP_ID = os.getenv("FYERS_CLIENT_ID")
SECRET_KEY = os.getenv("FYERS_SECRET_KEY")

print("=" * 60)
print("FYERS Access Token Generator")
print("=" * 60)
print(f"\nApp ID: {APP_ID}")
print(f"Secret Key: {SECRET_KEY[:5]}...")

# Step 1: Get auth code
print("\n" + "=" * 60)
print("STEP 1: Getting Authorization Code")
print("=" * 60)

redirect_uri = "https://www.google.com/"
print(f"\nRedirect URI: {redirect_uri}")
print("\nA browser window will open. Please:")
print("1. Login with your Fyers account")
print("2. Approve the app")
print("3. Copy the auth_code from the URL after redirect")
print("4. Paste it below\n")

response_type = "code"
grant_type = "authorization_code"

appSession = fyersModel.SessionModel(
    client_id=APP_ID,
    redirect_uri=redirect_uri,
    response_type=response_type,
    grant_type=grant_type,
    state="state",
    scope="",
    nonce=""
)

generateTokenUrl = appSession.generate_authcode()
print(f"Auth URL: {generateTokenUrl}\n")

# Open browser
webbrowser.open(generateTokenUrl, new=1)

# Get auth code from user
auth_code = input("Enter the auth_code from the URL (after 'auth_code='): ").strip()

if not auth_code:
    print("Error: No auth code provided")
    exit(1)

# Step 2: Generate access token
print("\n" + "=" * 60)
print("STEP 2: Generating Access Token")
print("=" * 60 + "\n")

try:
    appSession2 = fyersModel.SessionModel(
        client_id=APP_ID,
        secret_key=SECRET_KEY,
        grant_type="authorization_code"
    )
    
    appSession2.set_token(auth_code)
    access_token_response = appSession2.generate_token()
    
    if isinstance(access_token_response, dict):
        access_token = access_token_response.get('access_token')
    else:
        access_token = access_token_response
    
    print(f"✅ Access Token Generated Successfully!\n")
    print(f"Access Token: {access_token}\n")
    
    # Save to a tokens file
    tokens = {
        "access_token": access_token,
        "app_id": APP_ID,
        "timestamp": str(Path.cwd())
    }
    
    token_file = Path(__file__).parent / "fyers_token.json"
    with open(token_file, "w") as f:
        json.dump(tokens, f, indent=2)
    
    print(f"✅ Token saved to: {token_file}")
    print("\nYou can now use this token to authenticate with the Fyers API!")
    
except Exception as e:
    print(f"❌ Error generating token: {e}")
    import traceback
    traceback.print_exc()
