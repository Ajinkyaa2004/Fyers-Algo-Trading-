# Live Market Trading Implementation Guide
# Complete integration of real-time trading execution with Fyers API

## Table of Contents
1. Architecture Overview
2. Module Breakdown
3. Integration Steps
4. API Endpoints
5. Real-Time Price Flow
6. Order Execution Mechanics
7. P&L Calculation
8. Risk Management
9. Testing & Debugging
10. Production Deployment

---

## 1. Architecture Overview

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FYERS LIVE MARKET                          │
│              (Real-time price feed via WebSocket)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│          FyersWebSocketManager (fyers_websocket.py)              │
│                                                                  │
│  - Connects to Fyers WebSocket API                              │
│  - Subscribes to symbols (NSE:SBIN-EQ, etc.)                    │
│  - Receives real-time price ticks                               │
│  - Parses Fyers protocol                                         │
│  - Triggers price update callbacks                               │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│          LivePriceStream (live_market_trading.py)               │
│                                                                  │
│  - Maintains in-memory price cache per symbol                   │
│  - Distributes prices to all subscribers                        │
│  - Thread-safe operations with asyncio locks                    │
│  - Provides get_current_price() API                             │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│       LiveTradingEngine (live_market_trading.py)                │
│                                                                  │
│  Core Functions:                                                │
│  - market_buy(symbol, qty, stop_loss, take_profit)             │
│  - market_sell(symbol, qty)                                     │
│  - check_risk_orders() → Auto-executes SL/TP                   │
│  - get_portfolio_pnl() → Calculates P&L                         │
│                                                                  │
│  Maintains:                                                      │
│  - Wallet balance                                                │
│  - Active positions (symbol → quantity, avg_price)             │
│  - Order history (all executed orders)                          │
│  - Stop-losses & take-profits (triggered on price)             │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│         Flask REST API (live_trading_api.py)                    │
│                                                                  │
│  Endpoints:                                                      │
│  POST   /api/live-trading/buy         → Execute BUY             │
│  POST   /api/live-trading/sell        → Execute SELL            │
│  POST   /api/live-trading/update-price → Price updates          │
│  GET    /api/live-trading/portfolio   → Portfolio summary       │
│  GET    /api/live-trading/orders      → Order history           │
│  GET    /api/live-trading/positions   → Active positions        │
│  GET    /api/live-trading/risk-orders → SL/TP orders           │
│  GET    /api/live-trading/health      → Status check            │
└──────────────────────────────────────────────────────────────────┘
                 │
                 ▼
         React Frontend Dashboard
    (Display portfolio, orders, P&L)
```

---

## 2. Module Breakdown

### 2.1 `live_market_trading.py` - Core Trading Engine

**Classes:**

```
OrderStatus         - Enum: PENDING, EXECUTED, FAILED, CANCELLED
OrderType           - Enum: MARKET_BUY, MARKET_SELL (only market orders)
PriceQuote         - Real-time market quote (bid, ask, last price)
ExecutedOrder      - Record of executed trade
Position           - Active trading position in a symbol
StopLossConfig     - Stop-loss trigger configuration
TakeProfileConfig  - Take-profit trigger configuration
LivePriceStream    - In-memory price cache + subscription manager
LiveTradingEngine  - Core trading execution engine
```

**Key Methods:**

```python
# Market Order Execution
await engine.market_buy(symbol, quantity, stop_loss_price, take_profit_price)
await engine.market_sell(symbol, quantity)

# Price Management
await price_stream.update_price(symbol, quote)
quote = await price_stream.get_current_price(symbol)

# Risk Management
await engine.check_risk_orders(symbol, current_price)  # Auto-executes SL/TP

# Reporting
pnl_summary = await engine.get_portfolio_pnl()
orders = engine.get_order_history(symbol)
positions = engine.get_active_positions()
risk_orders = engine.get_risk_orders()
```

**High-Precision Calculations:**

```python
# Uses Decimal for financial precision (not float)
from decimal import Decimal

# P&L Calculation (per position)
unrealized_pnl = (current_price - avg_buy_price) × quantity

# Realized P&L (on sell)
cost_basis = quantity × avg_buy_price
realized_pnl = sell_price - cost_basis - commission

# Commission (0.05% trading fee)
commission = order_value × 0.0005
```

---

### 2.2 `fyers_websocket.py` - Real-Time Price Streaming

**Classes:**

```
FyersWebSocketManager   - Manages WebSocket connection to Fyers API
```

**Key Methods:**

```python
# Connection Management
await ws_manager.connect()
await ws_manager.disconnect()
await ws_manager.start_price_stream()  # Main listening loop

# Symbol Subscription
await ws_manager.subscribe_to_symbol(symbol, callback)
await ws_manager.unsubscribe_from_symbol(symbol)

# Callback Management
ws_manager.register_callback(callback)  # Global price updates
```

**Features:**

- ✅ Authenticates with Fyers API token
- ✅ Auto-reconnects on disconnect (max 5 retries)
- ✅ Handles WebSocket ping/pong for connection health
- ✅ Parses Fyers protocol (quote mode)
- ✅ Distributes callbacks asynchronously (non-blocking)
- ✅ Graceful error handling for corrupted data

**Fyers Protocol:**

```json
// Connection & Authentication
{
  "T": "OP",
  "uid": "USER_ID",
  "token": "AUTH_TOKEN"
}

// Subscribe to symbol
{
  "T": "SUB",
  "K": "NSE:SBIN-EQ"
}

// Receive price update
{
  "T": 0,
  "K": "NSE:SBIN-EQ",
  "LTT": 1234567890,
  "LTP": 549.75,
  "BID": 549.50,
  "ASK": 550.00,
  "VOL": 100000
}
```

---

### 2.3 `live_trading_api.py` - Flask API Layer

**Endpoints:**

```
POST   /api/live-trading/buy           - Execute market BUY
POST   /api/live-trading/sell          - Execute market SELL
POST   /api/live-trading/update-price  - Receive price updates
GET    /api/live-trading/portfolio     - Get P&L summary
GET    /api/live-trading/orders        - Get order history
GET    /api/live-trading/positions     - Get active positions
GET    /api/live-trading/risk-orders   - Get SL/TP orders
GET    /api/live-trading/health        - Health check
```

**Global Initialization:**

```python
from live_trading_api import init_live_trading

init_live_trading(app, initial_balance=Decimal('500000'))
```

---

## 3. Integration Steps

### Step 1: Install Dependencies

```bash
pip install websockets  # For WebSocket connection
pip install flask       # Already have
pip install asyncio     # Standard library
```

### Step 2: Update Flask App

```python
# app.py or main.py

from flask import Flask
from live_trading_api import register_live_trading_routes

app = Flask(__name__)

# Register all live trading routes
register_live_trading_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
```

### Step 3: Start WebSocket Price Stream

```python
# In a background task or separate process

import asyncio
from fyers_websocket import FyersWebSocketManager, on_fyers_price_update
from live_trading_api import trading_engine, price_stream

async def start_live_prices():
    # Get auth token from Fyers session
    auth_token = "YOUR_AUTH_TOKEN"  # From /api/fyers-login
    user_id = "YOUR_USER_ID"
    
    # Initialize WebSocket
    ws_manager = FyersWebSocketManager(auth_token, user_id)
    
    # Register callback to feed prices to trading engine
    async def price_callback(price_update):
        await on_fyers_price_update(
            trading_engine,
            live_trading_api,
            price_update
        )
    
    ws_manager.register_callback(price_callback)
    
    # Connect and subscribe to symbols
    if await ws_manager.connect():
        # Subscribe to your trading symbols
        symbols = [
            "NSE:SBIN-EQ",
            "NSE:INFY-EQ",
            "NSE:BAJAJFINSV-EQ",
            "NIFTY50-INDEX"
        ]
        
        for symbol in symbols:
            await ws_manager.subscribe_to_symbol(symbol)
        
        # Start streaming (blocks until disconnect)
        await ws_manager.start_price_stream()

# Run in background (example with threading)
import threading
price_thread = threading.Thread(
    target=lambda: asyncio.run(start_live_prices()),
    daemon=True
)
price_thread.start()
```

### Step 4: Start Trading (Frontend)

```javascript
// React component example

async function placeBuyOrder() {
  const response = await fetch('/api/live-trading/buy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: 'NSE:SBIN-EQ',
      quantity: 100,
      stop_loss_price: 545.00,
      take_profit_price: 560.00
    })
  });
  
  const result = await response.json();
  console.log(result.message);
  // ✅ BUY EXECUTED: 100 NSE:SBIN-EQ @ ₹550.00 ...
}
```

---

## 4. API Endpoints

### 4.1 BUY Order

**Request:**
```bash
POST /api/live-trading/buy
Content-Type: application/json

{
  "symbol": "NSE:SBIN-EQ",
  "quantity": 100,
  "stop_loss_price": 545.00,
  "take_profit_price": 560.00
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ BUY EXECUTED: 100 NSE:SBIN-EQ @ ₹550.00 (Total: ₹55,000 + Commission: ₹27.50)",
  "order": {
    "order_id": "BUY-1",
    "symbol": "NSE:SBIN-EQ",
    "quantity": 100,
    "executed_price": 550.00,
    "timestamp": "2024-12-29T10:30:45.123456",
    "commission": 27.50
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "message": "❌ Insufficient balance. Need: ₹55,027.50, Available: ₹50,000"
}
```

### 4.2 SELL Order

**Request:**
```bash
POST /api/live-trading/sell
Content-Type: application/json

{
  "symbol": "NSE:SBIN-EQ",
  "quantity": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ SELL EXECUTED: 100 NSE:SBIN-EQ @ ₹560.00 | Proceeds: ₹55,972.50 | P&L: ₹1,000.00 (1.82%)",
  "order": {
    "order_id": "SELL-1",
    "symbol": "NSE:SBIN-EQ",
    "quantity": 100,
    "executed_price": 560.00,
    "timestamp": "2024-12-29T10:35:20.654321",
    "commission": 28.00
  }
}
```

### 4.3 Portfolio P&L

**Request:**
```bash
GET /api/live-trading/portfolio
```

**Response:**
```json
{
  "wallet_balance": 450000.00,
  "total_realized_pnl": 10000.00,
  "total_unrealized_pnl": 65000.00,
  "total_pnl": 75000.00,
  "total_pnl_percent": 15.00,
  "portfolio_value": 525000.00,
  "active_positions_count": 3,
  "order_count": 12,
  "positions": {
    "NSE:SBIN-EQ": {
      "quantity": 100,
      "avg_buy_price": 550.00,
      "current_price": 560.00,
      "unrealized_pnl": 1000.00,
      "unrealized_pnl_percent": 1.82
    }
  }
}
```

### 4.4 Price Update (WebSocket Integration)

**Request (from WebSocket handler):**
```bash
POST /api/live-trading/update-price
Content-Type: application/json

{
  "symbol": "NSE:SBIN-EQ",
  "bid_price": 549.50,
  "ask_price": 550.00,
  "last_price": 549.75,
  "volume": 100000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Price updated"
}
```

On price update:
- ✅ Triggers stop-loss checks
- ✅ Triggers take-profit checks
- ✅ Auto-executes SELL if triggered

---

## 5. Real-Time Price Flow

### Sequence Diagram

```
Fyers Market  → WebSocket   → Price Stream   → Risk Manager   → Auto-Execute
                Message        (cache)          (SL/TP check)     (SELL order)

1. Fyers broadcasts price tick
   │
   └─→ {"T": 0, "K": "NSE:SBIN-EQ", "LTP": 549.75, ...}

2. WebSocket receives & parses
   │
   └─→ FyersWebSocketManager._process_price_message()

3. Distributes to callbacks
   │
   └─→ on_fyers_price_update()

4. Updates price cache
   │
   └─→ price_stream.update_price(symbol, quote)

5. Notifies all subscribers
   │
   └─→ Calls registered callbacks async

6. Check risk orders
   │
   └─→ trading_engine.check_risk_orders(symbol, price)

7. If SL/TP triggered
   │
   └─→ auto-execute market_sell()

8. Update P&L
   │
   └─→ calculated on next portfolio query
```

### Example: Price Update at 549.75 triggers stop-loss at 545.00

```
❌ User has position: 100 NSE:SBIN-EQ @ avg 550.00
✅ Stop-loss set at: 545.00

🔔 Price update arrives: 544.95
   │
   └─→ "Price went below stop-loss!"
       
   └─→ Auto-execute SELL
       │
       └─→ market_sell("NSE:SBIN-EQ", 100)
           │
           └─→ Sell at current bid_price: 544.50
               │
               └─→ Loss calculated: (544.50 - 550.00) × 100 = ₹-550
                   │
                   └─→ 🛑 STOP-LOSS executed: Loss limited to ₹550
```

---

## 6. Order Execution Mechanics

### Buy Order Execution Flow

```python
async def market_buy(symbol, quantity, stop_loss_price=None, take_profit_price=None):
    
    # Step 1: Validate price feed
    price_quote = await price_stream.get_current_price(symbol)
    if not price_quote:
        return False, "Price feed unavailable", None
    
    # Step 2: Get ask price (seller's asking price)
    execution_price = price_quote.ask_price  # 550.00
    
    # Step 3: Calculate total cost
    order_value = 100 × 550.00 = ₹55,000
    commission = 55,000 × 0.0005 = ₹27.50
    total_cost = ₹55,027.50
    
    # Step 4: Validate wallet
    if wallet_balance (₹500,000) < total_cost:
        return False, "Insufficient balance", None
    
    # Step 5: Deduct from wallet
    wallet_balance -= 55,027.50  # ₹499,972.50
    
    # Step 6: Record position
    positions["NSE:SBIN-EQ"] = Position(
        symbol="NSE:SBIN-EQ",
        quantity=100,
        avg_buy_price=550.00
    )
    
    # Step 7: Set risk orders
    if stop_loss_price:
        stop_losses["NSE:SBIN-EQ"] = [StopLossConfig(545.00, 100)]
    if take_profit_price:
        take_profits["NSE:SBIN-EQ"] = [TakeProfitConfig(560.00, 100)]
    
    # Step 8: Record execution
    order_history.append(ExecutedOrder(...))
    
    return True, "✅ BUY EXECUTED", order
```

### Sell Order Execution Flow

```python
async def market_sell(symbol, quantity):
    
    # Step 1: Get bid price (buyer's bid price)
    price_quote = await price_stream.get_current_price(symbol)
    execution_price = price_quote.bid_price  # 549.50
    
    # Step 2: Validate position
    position = positions.get(symbol)
    if position.quantity < 100:
        return False, "Insufficient quantity", None
    
    # Step 3: Calculate proceeds
    order_value = 100 × 549.50 = ₹54,950
    commission = 54,950 × 0.0005 = ₹27.48
    proceeds = 54,950 - 27.48 = ₹54,922.52
    
    # Step 4: Calculate P&L
    cost_basis = 100 × 550.00 = ₹55,000
    realized_pnl = (549.50 - 550.00) × 100 - 27.48 = ₹-77.48
    pnl_percent = -77.48 / 55,000 × 100 = -0.14%
    
    # Step 5: Credit wallet
    wallet_balance += 54,922.52  # ₹499,972.50 + 54,922.52 = ₹554,895.02
    
    # Step 6: Close position
    if position.quantity == 100:
        del positions["NSE:SBIN-EQ"]  # Position closed
    
    # Step 7: Record execution
    order_history.append(ExecutedOrder(...))
    
    return True, "✅ SELL EXECUTED: ... P&L: ₹-77.48", order
```

---

## 7. P&L Calculation

### Unrealized P&L (Open Positions)

```
For position in NSE:SBIN-EQ:
  Quantity: 100
  Average Buy Price: 550.00
  Current Price: 560.00

Unrealized P&L = (Current Price - Avg Buy Price) × Quantity
                = (560.00 - 550.00) × 100
                = ₹1,000

Unrealized P&L % = (Unrealized P&L / Total Cost) × 100
                 = (1,000 / 55,000) × 100
                 = 1.82%
```

### Realized P&L (Closed Trades)

```
Buy:  100 × 550.00 = ₹55,000 (cost basis)
Sell: 100 × 549.50 = ₹54,950 (proceeds)
Commission: ₹27.50 (buy) + ₹27.48 (sell) = ₹54.98

Realized P&L = Proceeds - Cost Basis - Commission
             = 54,950 - 55,000 - 54.98
             = ₹-104.98

Realized P&L % = (-104.98 / 55,000) × 100
               = -0.19%
```

### Total Portfolio P&L

```
Total Realized P&L   = Sum of all closed trades = ₹10,000
Total Unrealized P&L = Sum of all open positions = ₹65,000
Total P&L            = ₹75,000

Total P&L % = (Total P&L / Initial Balance) × 100
            = (75,000 / 500,000) × 100
            = 15.00%

Portfolio Value = Wallet Balance + Unrealized P&L
                = 450,000 + 65,000
                = ₹515,000
```

---

## 8. Risk Management

### Stop-Loss Mechanism

```python
# User sets stop-loss at order placement
await market_buy(
    symbol="NSE:SBIN-EQ",
    quantity=100,
    stop_loss_price=545.00  # Trigger at 545.00 or below
)

# On every price update, engine checks:
current_price = 544.95

if current_price <= stop_loss_price:  # 544.95 <= 545.00
    # Auto-execute sell to limit losses
    await market_sell("NSE:SBIN-EQ", 100)
    # Sells at current bid: 544.50
    # Loss limited to: (544.50 - 550.00) × 100 = ₹-550
```

### Take-Profit Mechanism

```python
# User sets take-profit at order placement
await market_buy(
    symbol="NSE:SBIN-EQ",
    quantity=100,
    take_profit_price=560.00  # Trigger at 560.00 or above
)

# On every price update, engine checks:
current_price = 560.50

if current_price >= take_profit_price:  # 560.50 >= 560.00
    # Auto-execute sell to lock in profits
    await market_sell("NSE:SBIN-EQ", 100)
    # Sells at current bid: 560.00
    # Profit: (560.00 - 550.00) × 100 = ₹1,000
```

### Risk Monitoring Dashboard

API endpoint `/api/live-trading/risk-orders` returns:

```json
{
  "stop_losses": {
    "NSE:SBIN-EQ": [
      {
        "trigger_price": 545.00,
        "quantity": 100
      }
    ]
  },
  "take_profits": {
    "NSE:SBIN-EQ": [
      {
        "trigger_price": 560.00,
        "quantity": 100
      }
    ]
  }
}
```

---

## 9. Testing & Debugging

### Unit Testing Example

```python
import pytest
from decimal import Decimal
from live_market_trading import (
    LiveTradingEngine,
    LivePriceStream,
    PriceQuote
)
from datetime import datetime

@pytest.mark.asyncio
async def test_market_buy():
    """Test market buy execution"""
    
    # Setup
    price_stream = LivePriceStream()
    engine = LiveTradingEngine(
        wallet_balance=Decimal('500000'),
        price_stream=price_stream
    )
    
    # Create price quote
    quote = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('549.50'),
        ask_price=Decimal('550.00'),
        last_price=Decimal('549.75'),
        volume=100000,
        timestamp=datetime.now()
    )
    
    # Update price in stream
    await price_stream.update_price("NSE:SBIN-EQ", quote)
    
    # Execute buy
    success, msg, order = await engine.market_buy(
        symbol="NSE:SBIN-EQ",
        quantity=100
    )
    
    # Assertions
    assert success == True
    assert order.order_id == "BUY-1"
    assert order.executed_price == Decimal('550.00')
    assert order.quantity == 100
    
    # Check wallet updated
    expected_cost = Decimal('55000') * Decimal('1.0005')
    assert engine._wallet_balance == Decimal('500000') - expected_cost


@pytest.mark.asyncio
async def test_stop_loss_trigger():
    """Test auto-execution of stop-loss"""
    
    # Setup & buy
    price_stream = LivePriceStream()
    engine = LiveTradingEngine(Decimal('500000'), price_stream)
    
    # Buy at 550
    quote1 = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('549.50'),
        ask_price=Decimal('550.00'),
        last_price=Decimal('549.75'),
        volume=100000,
        timestamp=datetime.now()
    )
    await price_stream.update_price("NSE:SBIN-EQ", quote1)
    await engine.market_buy("NSE:SBIN-EQ", 100, stop_loss_price=Decimal('545.00'))
    
    # Price drops below stop-loss
    quote2 = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('544.50'),
        ask_price=Decimal('545.00'),
        last_price=Decimal('544.75'),
        volume=150000,
        timestamp=datetime.now()
    )
    await price_stream.update_price("NSE:SBIN-EQ", quote2)
    
    # Check risk orders (triggers stop-loss)
    await engine.check_risk_orders("NSE:SBIN-EQ", Decimal('544.75'))
    
    # Assertions
    assert "NSE:SBIN-EQ" not in engine._positions  # Position closed
    assert len(engine._order_history) == 2  # BUY + SELL
    assert engine._order_history[1].order_type.value == "MARKET_SELL"
```

### Debugging Checklist

- [ ] WebSocket connected? Check `/api/live-trading/health`
- [ ] Prices updating? Check `price_stream._price_cache`
- [ ] Orders executing? Check `/api/live-trading/orders`
- [ ] Positions tracking? Check `/api/live-trading/positions`
- [ ] P&L calculating? Check `/api/live-trading/portfolio`
- [ ] Stop-losses working? Check risk order logs
- [ ] Wallet updating? Check balance in portfolio response

---

## 10. Production Deployment

### Environment Variables

```
# .env
FYERS_AUTH_TOKEN=your_auth_token_here
FYERS_USER_ID=your_user_id_here
INITIAL_WALLET_BALANCE=500000
COMMISSION_RATE=0.0005
LOG_LEVEL=INFO
```

### Production Configuration

```python
# config.py

TRADING_CONFIG = {
    'initial_balance': int(os.getenv('INITIAL_WALLET_BALANCE', 500000)),
    'commission_rate': float(os.getenv('COMMISSION_RATE', 0.0005)),
    'max_price_staleness': 30,  # seconds before marking price stale
    'order_timeout': 10,  # seconds to wait for execution
    'websocket_retries': 5,
    'websocket_retry_delay': 5,
    'logging_level': os.getenv('LOG_LEVEL', 'INFO')
}
```

### Database Integration (Optional)

For production, persist order history & positions:

```python
# Save order to database on execution
@engine.on_order_executed
async def save_order_to_db(order):
    db.orders.insert_one({
        'order_id': order.order_id,
        'symbol': order.symbol,
        'quantity': order.quantity,
        'executed_price': float(order.executed_price),
        'timestamp': order.executed_timestamp,
        'status': order.status.value
    })
```

### Monitoring & Alerts

```python
# Monitor wallet balance
if wallet_balance < initial_balance * 0.25:  # Lost 75%
    send_alert("Warning: Portfolio down 75%")

# Monitor P&L
if total_pnl < -initial_balance * 0.10:  # Lost 10%
    send_alert("Warning: P&L at -10%")

# Monitor connection
if not price_stream.is_connected():
    send_alert("CRITICAL: Price feed disconnected")
```

---

## Summary

### What's Implemented

✅ Real-time market order execution at live prices
✅ High-precision P&L calculation (Decimal arithmetic)
✅ Automatic stop-loss & take-profit execution
✅ WebSocket integration with Fyers API
✅ REST API endpoints for all operations
✅ In-memory price stream with subscriptions
✅ Position tracking & average buy price calculation
✅ Commission deduction (0.05%)
✅ Order history & reporting
✅ Portfolio summary with unrealized P&L

### Production Ready

- Uses asyncio for non-blocking I/O
- Thread-safe with locks
- Error handling & graceful degradation
- Auto-reconnect logic
- Comprehensive logging
- Type hints throughout
- Modular architecture

### Next Steps

1. Integrate with Fyers WebSocket in production
2. Add database persistence for orders/positions
3. Implement advanced risk management (portfolio limits)
4. Add notifications (email/SMS on SL/TP triggers)
5. Build dashboard to visualize live P&L
6. Add more order types (limit orders, trailing stops)
7. Performance testing with high-frequency updates
