# Live Trading Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality

- [ ] All Python files have no syntax errors
  ```bash
  python -m py_compile backend/live_market_trading.py
  python -m py_compile backend/fyers_websocket.py
  python -m py_compile backend/live_trading_api.py
  ```

- [ ] Type hints are consistent
  ```bash
  pip install mypy
  mypy backend/live_market_trading.py --ignore-missing-imports
  ```

- [ ] No hardcoded secrets
  - [ ] No auth tokens in code
  - [ ] No API keys in code
  - [ ] No wallet balances hardcoded
  - [ ] All credentials from environment

- [ ] Import statements work
  ```python
  from live_market_trading import LiveTradingEngine, LivePriceStream
  from fyers_websocket import FyersWebSocketManager
  from live_trading_api import register_live_trading_routes
  ```

### ✅ Dependencies Installed

```bash
# Core trading engine
pip install websockets          # WebSocket support
pip install flask               # REST API
pip install python-dotenv       # Environment config

# Testing (optional but recommended)
pip install pytest              # Unit tests
pip install pytest-asyncio      # Async test support
pip install pytest-cov          # Coverage reports

# Production server (choose one)
pip install gunicorn            # WSGI server (simple)
pip install hypercorn           # ASGI server (async)
pip install uvicorn             # ASGI alternative

# Monitoring (optional)
pip install prometheus-client   # Metrics
pip install sentry-sdk          # Error tracking
```

### ✅ Environment Variables

Create `.env` file in project root:

```bash
# Required for Fyers integration
FYERS_AUTH_TOKEN=your_auth_token_here
FYERS_USER_ID=your_user_id_here

# Application configuration
INITIAL_WALLET_BALANCE=500000
COMMISSION_RATE=0.0005
LOG_LEVEL=INFO
FLASK_ENV=production

# Optional for production
SECRET_KEY=generate_with_secrets.token_hex()
DEBUG=False
```

Verify variables are set:
```bash
echo $FYERS_AUTH_TOKEN      # Should print token
echo $FYERS_USER_ID         # Should print user ID
```

### ✅ Database Setup (if using persistence)

If you want to persist orders to database:

```bash
# MongoDB (optional)
pip install pymongo
# Configure MongoDB connection string in config

# PostgreSQL (optional)
pip install psycopg2
# Create database and run migrations
```

---

## Integration Testing

### ✅ Unit Tests

Run all tests:
```bash
pytest backend/tests/ -v

# Or specific test
pytest backend/tests/test_trading_engine.py::test_market_buy -v

# With coverage
pytest backend/tests/ --cov=backend/live_market_trading
```

Expected results:
```
test_market_buy PASSED
test_market_sell PASSED
test_stop_loss_trigger PASSED
test_take_profit_trigger PASSED
test_pnl_calculation PASSED
test_insufficient_balance PASSED
test_invalid_position PASSED
================== 7 passed in 0.45s ==================
```

### ✅ Flask API Tests

```bash
# Start Flask app
python app_with_live_trading.py &

# Test health check
curl http://localhost:5000/api/live-trading/health
# Response: {"status": "healthy", "engine_ready": true, ...}

# Test endpoints
curl -X GET http://localhost:5000/api/live-trading/portfolio
curl -X GET http://localhost:5000/api/live-trading/positions
curl -X GET http://localhost:5000/api/live-trading/orders
```

### ✅ WebSocket Connection

Test Fyers connection:

```python
# test_websocket.py
import asyncio
from fyers_websocket import FyersWebSocketManager

async def test_connection():
    ws = FyersWebSocketManager(
        auth_token=os.getenv('FYERS_AUTH_TOKEN'),
        user_id=os.getenv('FYERS_USER_ID')
    )
    
    if await ws.connect():
        print("✅ Connected to Fyers")
        
        if await ws.subscribe_to_symbol("NSE:SBIN-EQ"):
            print("✅ Subscribed to NSE:SBIN-EQ")
        
        # Receive one message
        msg = await ws.websocket.recv()
        print(f"✅ Received: {msg}")
        
        await ws.disconnect()
    else:
        print("❌ Connection failed")

asyncio.run(test_connection())
```

### ✅ Order Execution Test

```python
# test_trading.py
import asyncio
from decimal import Decimal
from datetime import datetime
from live_market_trading import (
    LiveTradingEngine, LivePriceStream, PriceQuote
)

async def test_trading():
    # Setup
    price_stream = LivePriceStream()
    engine = LiveTradingEngine(Decimal('500000'), price_stream)
    
    # Update price
    quote = PriceQuote(
        symbol="NSE:SBIN-EQ",
        bid_price=Decimal('549.50'),
        ask_price=Decimal('550.00'),
        last_price=Decimal('549.75'),
        volume=100000,
        timestamp=datetime.now()
    )
    await price_stream.update_price("NSE:SBIN-EQ", quote)
    
    # Buy
    success, msg, order = await engine.market_buy("NSE:SBIN-EQ", 100)
    assert success, f"Buy failed: {msg}"
    print(f"✅ Buy successful: {order.order_id}")
    
    # Check position
    positions = engine.get_active_positions()
    assert len(positions) == 1
    assert positions[0]['quantity'] == 100
    print("✅ Position tracked correctly")
    
    # Check P&L
    pnl = await engine.get_portfolio_pnl()
    print(f"✅ P&L calculated: ₹{pnl['total_unrealized_pnl']}")

asyncio.run(test_trading())
```

Run and verify all pass ✅

---

## Performance Testing

### ✅ Load Testing

```bash
# Test with multiple concurrent orders
pip install locust

# Create locustfile.py with trading operations
# Run: locust -f locustfile.py --host=http://localhost:5000

# Expected performance:
# - 100+ price updates/second
# - <100ms order execution
# - <50ms P&L calculation
```

### ✅ Memory Testing

```bash
# Monitor memory usage
pip install memory-profiler

python -m memory_profiler app_with_live_trading.py

# Should be <100MB for typical usage
# 1000 symbols + 100 positions = ~5MB additional
```

### ✅ Latency Testing

```python
import time

# Measure order execution time
start = time.time()
success, msg, order = await engine.market_buy("NSE:SBIN-EQ", 100)
latency = (time.time() - start) * 1000  # ms

print(f"Order execution latency: {latency}ms")
# Expected: <100ms
```

---

## Security Checklist

### ✅ Credential Management

- [ ] Auth token NOT in code
- [ ] Auth token NOT in logs
- [ ] Auth token in environment variable
- [ ] .env file NOT committed to git

```bash
# Verify .env is in .gitignore
grep ".env" .gitignore
```

- [ ] Password/keys use strong rotation policy
- [ ] Credentials expire and can be refreshed

### ✅ API Security

- [ ] Input validation on all endpoints
  ```python
  # Example: validate quantity is positive
  if quantity <= 0:
      return {"error": "Invalid quantity"}, 400
  ```

- [ ] Rate limiting enabled
  ```python
  from flask_limiter import Limiter
  limiter = Limiter(app, key_func=lambda: request.remote_addr)
  @app.route('/api/live-trading/buy')
  @limiter.limit("100 per hour")
  def buy():
      ...
  ```

- [ ] Error messages don't leak sensitive info
  ✗ Bad: "Failed at line 42: wallet_id=12345"
  ✓ Good: "Order execution failed"

- [ ] HTTPS only in production (if over network)
  ```python
  if not app.config['DEBUG']:
      from flask_talisman import Talisman
      Talisman(app)
  ```

### ✅ Data Protection

- [ ] Database encrypted (if using)
- [ ] API logs don't contain prices/balances
- [ ] Backups encrypted
- [ ] Access logs monitored
- [ ] Failed login attempts logged

---

## Configuration Management

### ✅ Production Config File

Create `config.py`:

```python
import os
from decimal import Decimal

class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    
class ProductionConfig(Config):
    """Production settings"""
    FYERS_AUTH_TOKEN = os.getenv('FYERS_AUTH_TOKEN')
    FYERS_USER_ID = os.getenv('FYERS_USER_ID')
    INITIAL_WALLET_BALANCE = Decimal(os.getenv('INITIAL_WALLET_BALANCE', '500000'))
    COMMISSION_RATE = Decimal(os.getenv('COMMISSION_RATE', '0.0005'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    MAX_PRICE_STALENESS = 30  # seconds
    WEBSOCKET_RETRIES = 5
    WEBSOCKET_RETRY_DELAY = 5

class DevelopmentConfig(Config):
    """Development settings"""
    DEBUG = True
    TESTING = False

# Use: app.config.from_object('config.ProductionConfig')
```

### ✅ Logging Configuration

```python
import logging
from logging.handlers import RotatingFileHandler

# Create logs directory
os.makedirs('logs', exist_ok=True)

# Configure logging
handler = RotatingFileHandler(
    'logs/trading.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)

logging.getLogger('').addHandler(handler)
logging.getLogger('').setLevel(logging.INFO)
```

---

## Monitoring & Alerting

### ✅ Health Monitoring

```python
# Add endpoint that checks all critical systems
@app.route('/api/system/health', methods=['GET'])
async def system_health():
    return {
        'status': 'healthy',
        'trading_engine': {
            'ready': trading_engine is not None,
            'wallet_balance': float(trading_engine._wallet_balance),
            'positions': len(trading_engine._positions)
        },
        'price_stream': {
            'connected': price_stream.is_connected(),
            'cached_symbols': len(price_stream._price_cache),
            'subscribers': sum(len(v) for v in price_stream._subscribers.values())
        },
        'timestamp': datetime.now().isoformat()
    }
```

### ✅ Error Alerts

```python
# Send alert on critical errors
import smtplib

def send_alert(subject, message):
    """Send email alert on critical error"""
    if os.getenv('ALERT_EMAIL'):
        # Send email to operator
        pass

# Use:
try:
    await engine.market_buy(...)
except Exception as e:
    send_alert("Trading Error", str(e))
```

### ✅ Metrics Collection

```python
# Track key metrics
trades_executed = 0
total_pnl = Decimal('0')
errors_count = 0
last_price_update = None

# Expose for monitoring
@app.route('/api/metrics')
def metrics():
    return {
        'trades_executed': trades_executed,
        'total_pnl': float(total_pnl),
        'errors': errors_count,
        'last_price_update': last_price_update
    }
```

---

## Deployment Process

### ✅ Step 1: Pre-deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run tests
pytest backend/tests/ -v

# 4. Check configuration
echo "FYERS_AUTH_TOKEN=$FYERS_AUTH_TOKEN"

# 5. Verify no hardcoded secrets
grep -r "token=" backend/
grep -r "password=" backend/
# Should return 0 results
```

### ✅ Step 2: Start Services

```bash
# Option A: Development (quick testing)
python app_with_live_trading.py

# Option B: Production with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 \
    --timeout 120 \
    --log-level info \
    app_with_live_trading:app

# Option C: Production with supervisor (recommended)
# See: /etc/supervisor/conf.d/trading.conf
supervisorctl restart trading_app
```

### ✅ Step 3: Verify Deployment

```bash
# 1. Check health
curl http://localhost:5000/api/live-trading/health
# Should return: {"status": "healthy", ...}

# 2. Check price stream
curl http://localhost:5000/api/live-trading/health | jq .price_stream_connected
# Should return: true (after 30 seconds)

# 3. Check portfolio
curl http://localhost:5000/api/live-trading/portfolio
# Should return: {...portfolio data...}

# 4. Check logs
tail -f logs/trading.log
# Should show: "✅ Price streaming started in background"
```

### ✅ Step 4: Post-deployment

```bash
# 1. Monitor for errors
watch -n 5 'tail logs/trading.log'

# 2. Test with small order
curl -X POST http://localhost:5000/api/live-trading/buy \
  -H "Content-Type: application/json" \
  -d '{"symbol": "NSE:SBIN-EQ", "quantity": 10}'

# 3. Monitor system
ps aux | grep python
free -h
df -h

# 4. Set up monitoring alerts
# Configure email/Slack alerts for critical events
```

---

## Rollback Plan

If something goes wrong:

### ✅ Quick Rollback

```bash
# 1. Stop current process
pkill -f app_with_live_trading.py

# 2. Close all positions (if needed)
# Run script to market_sell all holdings

# 3. Revert to last working version
git checkout HEAD~1
git pull

# 4. Restart with previous code
python app_with_live_trading.py
```

### ✅ Rollback Checklist

- [ ] Stop trading immediately (circuit breaker)
- [ ] Close all open positions (or with take-profits)
- [ ] Verify wallet balance
- [ ] Revert code to last working commit
- [ ] Test endpoints before resuming
- [ ] Clear price cache and restart stream
- [ ] Document what went wrong

---

## Post-Deployment Validation

### ✅ Daily Checklist

- [ ] App running without errors
- [ ] Price stream connected
- [ ] At least 1 trade executed successfully
- [ ] P&L calculated correctly
- [ ] Stop-losses working (test with small position)
- [ ] No memory leaks (check memory growth)
- [ ] No price feed gaps (monitor for disconnects)
- [ ] Logs show normal operation

### ✅ Weekly Checklist

- [ ] Test failover/recovery process
- [ ] Verify backups are working
- [ ] Review error logs for patterns
- [ ] Check performance metrics
- [ ] Update documentation if needed
- [ ] Test rollback procedure

### ✅ Monthly Checklist

- [ ] Security audit (code review)
- [ ] Performance optimization review
- [ ] Disaster recovery drill
- [ ] Credential rotation
- [ ] Database maintenance (if used)
- [ ] Update dependencies to latest secure versions

---

## Emergency Procedures

### ❌ If Price Feed Disconnects

```
1. System automatically attempts to reconnect (max 5 retries)
2. If still disconnected after 2.5 minutes:
   - No new orders are accepted
   - Existing positions are held
   - Manual intervention required
3. To restore:
   - Check Fyers API status
   - Verify internet connection
   - Restart WebSocket manager
   - Resume trading when reconnected
```

### ❌ If Order Fails to Execute

```
1. Check error message in API response
2. Verify:
   - Wallet balance is sufficient
   - Position exists (for sells)
   - Price feed is connected
3. Retry the order
4. If still fails: contact support
```

### ❌ If Position Tracking is Wrong

```
1. Check order history: /api/live-trading/orders
2. Verify average price calculation
3. Check commission was deducted
4. Recalculate manually and compare
5. If mismatch: close position and investigate
```

### ❌ Critical: Multiple Failures

```
1. STOP: Stop all trading immediately
2. ASSESS: Check all systems for errors
3. NOTIFY: Alert operator/team
4. RECOVER: Follow rollback procedure
5. INVESTIGATE: Root cause analysis
6. FIX: Apply fix and redeploy after testing
```

---

## Final Checklist Before Going Live

- [ ] All tests passing (100% pass rate)
- [ ] Code reviewed and approved
- [ ] Security audit completed
- [ ] Performance tested and optimized
- [ ] Documentation complete
- [ ] Credentials configured (environment)
- [ ] Monitoring and alerts set up
- [ ] Backup and recovery tested
- [ ] Rollback procedure documented
- [ ] Team trained on deployment
- [ ] Emergency contacts available
- [ ] Initial wallet balance verified
- [ ] Test trades executed successfully
- [ ] Stop-loss tested and working
- [ ] Take-profit tested and working
- [ ] P&L calculations verified
- [ ] Error messages are helpful
- [ ] Logs are being recorded
- [ ] Health check endpoint working
- [ ] All API endpoints responsive

✅ **Ready for Production Deployment!**

---

## Support Contacts

- **Technical Issues**: Check logs, run health check, review docs
- **Fyers API Issues**: Visit https://support.fyers.in
- **Trading Support**: Refer to LIVE_TRADING_IMPLEMENTATION.md
- **Quick Issues**: See LIVE_TRADING_QUICK_REFERENCE.md

---

**Last Updated**: December 29, 2024
**Status**: Ready for Production ✅
