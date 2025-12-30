# Example: Integration with Existing Flask App
# Shows how to add live trading to your existing application

import os
import asyncio
import threading
from flask import Flask
from decimal import Decimal

# ============================================================================
# STEP 1: Import Live Trading Components
# ============================================================================

from live_trading_api import register_live_trading_routes
from fyers_websocket import FyersWebSocketManager


# ============================================================================
# STEP 2: Create Flask App with Live Trading
# ============================================================================

def create_app_with_live_trading():
    """
    Initialize Flask app with live trading engine and WebSocket price streaming.
    
    This is your main app creation function.
    """
    
    # Create Flask app instance
    app = Flask(__name__)
    
    # Configuration
    app.config['JSON_SORT_KEYS'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    
    # ====================================================================
    # Register Live Trading Routes
    # ====================================================================
    # This adds all endpoints:
    # - POST /api/live-trading/buy
    # - POST /api/live-trading/sell
    # - GET /api/live-trading/portfolio
    # - GET /api/live-trading/orders
    # - GET /api/live-trading/positions
    # - GET /api/live-trading/risk-orders
    # - POST /api/live-trading/update-price
    # - GET /api/live-trading/health
    
    register_live_trading_routes(app)
    
    # ====================================================================
    # Start WebSocket Price Stream (Background Task)
    # ====================================================================
    # This connects to Fyers API and streams real-time prices
    
    @app.before_first_request
    def start_price_stream():
        """Start WebSocket connection on app startup"""
        
        def run_websocket():
            """Run WebSocket in separate thread"""
            asyncio.run(connect_to_fyers())
        
        # Start in background daemon thread (doesn't block app startup)
        ws_thread = threading.Thread(target=run_websocket, daemon=True)
        ws_thread.start()
        
        print("✅ Price streaming started in background")
    
    # ====================================================================
    # Your Existing Routes
    # ====================================================================
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """App health check endpoint"""
        return {
            'status': 'healthy',
            'timestamp': asyncio.run(asyncio.sleep(0))
        }, 200
    
    return app


# ============================================================================
# STEP 3: WebSocket Connection to Fyers
# ============================================================================

async def connect_to_fyers():
    """
    Connect to Fyers WebSocket and stream prices to trading engine.
    
    Runs indefinitely in background thread.
    Automatically reconnects if connection drops.
    """
    
    # Get Fyers credentials from environment
    auth_token = os.getenv('FYERS_AUTH_TOKEN')
    user_id = os.getenv('FYERS_USER_ID')
    
    if not auth_token or not user_id:
        print("❌ FYERS_AUTH_TOKEN or FYERS_USER_ID not set in environment")
        print("   Set these to enable live price streaming")
        return
    
    print(f"Connecting to Fyers WebSocket...")
    print(f"   User: {user_id}")
    print(f"   Token: {auth_token[:20]}...")
    
    # Initialize WebSocket manager
    ws_manager = FyersWebSocketManager(auth_token, user_id)
    
    # Define callback for price updates
    async def on_price_update(price_update):
        """
        This callback is called whenever Fyers sends a price update.
        
        Args:
            price_update (dict): {
                'symbol': 'NSE:SBIN-EQ',
                'last_price': 549.75,
                'bid_price': 549.50,
                'ask_price': 550.00,
                'volume': 100000,
                'timestamp': '2024-12-29T10:30:45'
            }
        """
        
        # Import here to avoid circular imports
        from live_trading_api import price_stream
        from live_market_trading import PriceQuote
        from datetime import datetime
        
        try:
            symbol = price_update['symbol']
            
            # Create PriceQuote object
            quote = PriceQuote(
                symbol=symbol,
                bid_price=Decimal(str(price_update['bid_price'])),
                ask_price=Decimal(str(price_update['ask_price'])),
                last_price=Decimal(str(price_update['last_price'])),
                volume=price_update['volume'],
                timestamp=datetime.fromisoformat(price_update['timestamp'])
            )
            
            # Update price stream (notifies trading engine)
            await price_stream.update_price(symbol, quote)
            
            # Also trigger risk order checks (stop-loss, take-profit)
            from live_trading_api import trading_engine
            if trading_engine:
                await trading_engine.check_risk_orders(symbol, quote.last_price)
        
        except Exception as e:
            print(f"❌ Error processing price update: {e}")
    
    # Register callback for all price updates
    ws_manager.register_callback(on_price_update)
    
    # Connect to Fyers API
    if await ws_manager.connect():
        print("✅ Connected to Fyers WebSocket")
        
        # Subscribe to trading symbols
        # Add your symbols here
        symbols = [
            "NSE:SBIN-EQ",      # SBIN
            "NSE:INFY-EQ",      # Infosys
            "NSE:TCS-EQ",       # TCS
            "NSE:BAJAJFINSV-EQ",# Bajaj Finserv
            "NSE:MARUTI-EQ",    # Maruti
            "NIFTY50-INDEX",    # Nifty Index
        ]
        
        print(f"Subscribing to {len(symbols)} symbols...")
        for symbol in symbols:
            if await ws_manager.subscribe_to_symbol(symbol):
                print(f"   ✓ {symbol}")
            else:
                print(f"   ✗ {symbol} (subscription failed)")
        
        print("✅ All symbols subscribed")
        
        # Start listening to price stream (blocks until disconnect)
        # This runs indefinitely, receiving price updates
        print("🔌 Starting price stream (listening for updates)...")
        await ws_manager.start_price_stream()
        
        print("⚠️ Price stream disconnected")
    
    else:
        print("❌ Failed to connect to Fyers WebSocket")


# ============================================================================
# STEP 4: Environment Setup
# ============================================================================

def setup_environment():
    """
    Setup required environment variables.
    
    Create a .env file with:
    
    FYERS_AUTH_TOKEN=your_auth_token_from_fyers
    FYERS_USER_ID=your_user_id
    INITIAL_WALLET_BALANCE=500000
    COMMISSION_RATE=0.0005
    FLASK_ENV=development
    LOG_LEVEL=INFO
    """
    
    from dotenv import load_dotenv
    
    # Load from .env file
    load_dotenv()
    
    # Verify required variables
    required = ['FYERS_AUTH_TOKEN', 'FYERS_USER_ID']
    missing = [var for var in required if not os.getenv(var)]
    
    if missing:
        print(f"⚠️  Missing environment variables: {', '.join(missing)}")
        print("   Set these in .env file or environment to enable live trading")
    else:
        print("✅ Environment variables configured")


# ============================================================================
# STEP 5: Run the Application
# ============================================================================

if __name__ == '__main__':
    
    # Setup environment
    setup_environment()
    
    # Create app with live trading
    app = create_app_with_live_trading()
    
    # Run Flask app
    print("🚀 Starting Smart Algo Trade with Live Trading Engine")
    print("   Frontend: http://localhost:3000")
    print("   Backend:  http://localhost:5000")
    print("   APIs:     http://localhost:5000/api/live-trading/health")
    print("")
    print("Available endpoints:")
    print("   POST   /api/live-trading/buy         - Place BUY order")
    print("   POST   /api/live-trading/sell        - Place SELL order")
    print("   GET    /api/live-trading/portfolio   - Get portfolio P&L")
    print("   GET    /api/live-trading/positions   - Get active positions")
    print("   GET    /api/live-trading/orders      - Get order history")
    print("   GET    /api/live-trading/risk-orders - Get SL/TP orders")
    print("   GET    /api/live-trading/health      - Check system status")
    print("")
    
    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")


# ============================================================================
# ALTERNATIVE: Async Flask with ASGI (Advanced)
# ============================================================================

# For production with high concurrency, use ASGI server:
# pip install hypercorn
# Run: hypercorn app:app

def create_async_app():
    """Create async-capable Flask app for production"""
    from flask import Flask
    from quart import Quart
    
    # Use Quart (async Flask)
    app = Quart(__name__)
    
    # Register routes (same as Flask)
    register_live_trading_routes(app)
    
    # Startup tasks
    @app.before_serving
    async def startup():
        # Start WebSocket in background
        asyncio.create_task(connect_to_fyers())
        print("✅ Async app started")
    
    return app


# ============================================================================
# TEST HELPER: Simulate Price Updates
# ============================================================================

async def simulate_price_updates():
    """
    Simulate price updates for testing without Fyers connection.
    
    Useful for:
    - Testing without live market data
    - Demo/development
    - Automated testing
    """
    
    from live_market_trading import PriceQuote
    from live_trading_api import price_stream
    from datetime import datetime
    import asyncio
    
    # Symbols to simulate
    symbols = {
        "NSE:SBIN-EQ": {"base": 550.00, "range": 5},
        "NSE:INFY-EQ": {"base": 1400.00, "range": 20},
    }
    
    while True:
        for symbol, config in symbols.items():
            import random
            
            # Generate random price within range
            offset = random.uniform(-config['range'], config['range'])
            price = Decimal(str(config['base'] + offset))
            
            # Create quote
            quote = PriceQuote(
                symbol=symbol,
                bid_price=price - Decimal('0.25'),
                ask_price=price + Decimal('0.25'),
                last_price=price,
                volume=random.randint(50000, 200000),
                timestamp=datetime.now()
            )
            
            # Update price stream
            await price_stream.update_price(symbol, quote)
            
            print(f"[Simulated] {symbol} @ {price}")
        
        # Update every 5 seconds
        await asyncio.sleep(5)


# To test with simulated prices instead of Fyers:
# Replace connect_to_fyers() with simulate_price_updates()
# in the start_price_stream() function above


# ============================================================================
# QUICK START
# ============================================================================

"""
Quick Start:

1. Set environment variables:
   export FYERS_AUTH_TOKEN=your_token
   export FYERS_USER_ID=your_user_id

2. Run this file:
   python app.py

3. Test endpoints:
   curl http://localhost:5000/api/live-trading/health
   
4. From React frontend:
   await fetch('/api/live-trading/buy', {
     method: 'POST',
     body: JSON.stringify({
       symbol: 'NSE:SBIN-EQ',
       quantity: 100
     })
   })

5. Check results:
   curl http://localhost:5000/api/live-trading/portfolio
   curl http://localhost:5000/api/live-trading/orders
   curl http://localhost:5000/api/live-trading/positions
"""
