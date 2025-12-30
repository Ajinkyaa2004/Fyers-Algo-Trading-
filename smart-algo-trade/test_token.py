"""
Test the saved Fyers access token
"""
import json
from pathlib import Path
from fyers_apiv3 import fyersModel

def test_saved_token():
    """Test the token saved in fyers_session.json"""
    
    # Load the token
    token_file = Path("backend/data/fyers_session.json")
    with open(token_file) as f:
        session_data = json.load(f)
    
    access_token = session_data["access_token"]
    client_id = "BDJ0JIY3EC-100"
    
    print("=" * 60)
    print("TESTING SAVED FYERS TOKEN")
    print("=" * 60)
    print(f"\n✅ Loaded token from {token_file}")
    print(f"Token (first 50 chars): {access_token[:50]}...")
    
    # Create Fyers model
    fyers = fyersModel.FyersModel(
        client_id=client_id,
        token=access_token,
        log_path="./logs"
    )
    
    print("\n🔍 Testing API Calls:")
    
    # Test 1: Get Profile
    print("\n1️⃣  Profile:")
    try:
        profile = fyers.get_profile()
        if profile.get("s") == "ok":
            data = profile.get("data", {})
            print(f"   ✅ Name: {data.get('name')}")
            print(f"   ✅ ID: {data.get('fy_id')}")
            print(f"   ✅ Email: {data.get('email_id')}")
        else:
            print(f"   ❌ Error: {profile.get('message')}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 2: Get Funds
    print("\n2️⃣  Funds/Margins:")
    try:
        funds = fyers.funds()
        if funds.get("s") == "ok":
            data = funds.get("data", {})
            print(f"   ✅ Available: ₹{data.get('available_margin', 0)}")
            print(f"   ✅ Used: ₹{data.get('used_margin', 0)}")
        else:
            print(f"   ❌ Error: {funds.get('message')}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 3: Get Holdings
    print("\n3️⃣  Holdings:")
    try:
        holdings = fyers.holdings()
        if holdings.get("s") == "ok":
            data = holdings.get("data", [])
            print(f"   ✅ Total Holdings: {len(data)}")
            if data:
                for holding in data[:2]:
                    print(f"      - {holding.get('symbol')}: {holding.get('qty')} @ ₹{holding.get('price')}")
        else:
            print(f"   ❌ Error: {holdings.get('message')}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 4: Get Positions
    print("\n4️⃣  Positions:")
    try:
        positions = fyers.positions()
        if positions.get("s") == "ok":
            data = positions.get("data", {})
            net = data.get("net", [])
            print(f"   ✅ Active Positions: {len(net)}")
            if net:
                for pos in net[:2]:
                    print(f"      - {pos.get('symbol')}: {pos.get('qty')} @ ₹{pos.get('avg_price')}")
        else:
            print(f"   ❌ Error: {positions.get('message')}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    # Test 5: Get Orders
    print("\n5️⃣  Order Book:")
    try:
        orders = fyers.orderbook()
        if orders.get("s") == "ok":
            data = orders.get("data", [])
            print(f"   ✅ Total Orders: {len(data)}")
            if data:
                for order in data[:2]:
                    print(f"      - {order.get('symbol')}: {order.get('qty')} @ ₹{order.get('price')} ({order.get('status')})")
        else:
            print(f"   ❌ Error: {orders.get('message')}")
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "=" * 60)
    print("✅ TOKEN TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_saved_token()
