import os
from dotenv import load_dotenv
from fyers_apiv3 import fyersModel

load_dotenv('backend/.env')

FYERS_CLIENT_ID = os.getenv("FYERS_CLIENT_ID")
FYERS_SECRET_KEY = os.getenv("FYERS_SECRET_KEY")
FYERS_REDIRECT_URI = os.getenv("FYERS_REDIRECT_URI")

print("="*40)
print("FYERS CONFIGURATION DIAGNOSTIC")
print("="*40)
print(f"1. App ID (Client ID): {FYERS_CLIENT_ID}")
print(f"2. Secret Key       : {FYERS_SECRET_KEY[:3]}...{FYERS_SECRET_KEY[-3:] if FYERS_SECRET_KEY else ''}")
print(f"3. Redirect URI     : {FYERS_REDIRECT_URI}")
print("-"*40)

try:
    session = fyersModel.SessionModel(
        client_id=FYERS_CLIENT_ID,
        secret_key=FYERS_SECRET_KEY,
        redirect_uri=FYERS_REDIRECT_URI,
        response_type="code",
        grant_type="authorization_code"
    )
    url = session.generate_authcode()
    print("✅ SUCCESS: Backend can generate login URL.")
    print("\nPLEASE VERIFY IN FYERS DASHBOARD:")
    print(f"The 'Redirect URI' in Fyers must be EXACTLY: {FYERS_REDIRECT_URI}")
    print("\nGenerated URL for your browser:")
    print(url)
except Exception as e:
    print(f"❌ FAILED: {str(e)}")
print("="*40)
