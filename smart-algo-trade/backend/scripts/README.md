# WebSocket & Options Analysis Scripts

Standalone Python scripts for real-time market data collection and options trading analysis using Fyers API V3.

## Overview

Three complementary scripts for different market data and options analysis needs:

### 1. Real-Time Tick Streaming (`realtime_tick_streaming.py`)
**Purpose:** Stream live LTP (Last Traded Price) updates in real-time

**Use Cases:**
- Live price monitoring dashboards
- Real-time order placement
- Risk management systems
- Instant alert systems

**Output:** Console output with timestamp and symbol price
```
[2025-12-27T14:30:45.123456] NSE:SBIN-EQ: ₹500.50
[2025-12-27T14:30:45.234567] NSE:ADANIENT-EQ: ₹1250.75
```

**Run:**
```bash
python backend/scripts/realtime_tick_streaming.py
```

---

### 2. OHLC Bar Collection (`ohlc_bar_collection.py`)
**Purpose:** Aggregate tick data into OHLC (Open, High, Low, Close) bars

**Use Cases:**
- Backtesting trading strategies
- Technical analysis
- Historical data generation
- Charting and visualization

**Features:**
- Configurable timeframes (1-min, 5-min, 15-min, hourly, etc.)
- Automatic CSV export per symbol
- Tick volume tracking
- In-memory buffering
- Automatic reconnection

**Output:** CSV files in `backend/data/ohlc_bars/`
```
NSE_SBIN-EQ_OHLC.csv:
timestamp,symbol,open,high,low,close,volume,timeframe_minutes
2025-12-27 14:30:00,NSE:SBIN-EQ,500.00,502.50,499.75,501.50,245,1
2025-12-27 14:31:00,NSE:SBIN-EQ,501.50,503.00,500.50,502.75,312,1
```

**Run:**
```bash
python backend/scripts/ohlc_bar_collection.py
```

---

## Configuration

### Symbols
Edit the `symbols` list in either script:

```python
# In realtime_tick_streaming.py (line ~80)
symbols = ['NSE:SBIN-EQ', 'NSE:ADANIENT-EQ']

# In ohlc_bar_collection.py (line ~110)
symbols = ['MCX:CRUDEOIL24MARFUT', 'NSE:ADANIENT-EQ', 'NSE:NIFTY50-INDEX']
```

### Timeframe (OHLC Only)
Change the `TIMEFRAME_MINUTES` variable:

```python
# In ohlc_bar_collection.py (line ~32)
TIMEFRAME_MINUTES = 1  # Options: 1, 5, 15, 60, etc.
```

---

## Requirements

**Credentials Files:**
- `smart-algo-trade/client_id.txt` - Your Fyers client ID
- `smart-algo-trade/access_token.txt` - Your Fyers access token

**Python Packages:**
```bash
pip install fyers-apiv3 pandas
```

---

## Output & Storage

### Logs
- `backend/logs/realtime_tick_streaming.log`
- `backend/logs/ohlc_bar_collection.log`

### Data
- `backend/data/ohlc_bars/` - OHLC CSV files

---

## API Alternative

For programmatic control, use the REST API endpoints in the backend:

```bash
# Start OHLC collection via API
POST /api/websocket/ohlc/start?symbols=NSE:SBIN-EQ,NSE:ADANIENT-EQ&timeframe=5

# Get collection status
GET /api/websocket/ohlc/status

# Retrieve collected bars
GET /api/websocket/ohlc/data?symbol=NSE:SBIN-EQ

# Stop collection
POST /api/websocket/ohlc/stop
```

---

## Comparison: Standalone Scripts vs API

| Feature | Standalone Scripts | API Endpoints |
|---------|-------------------|---------------|
| **Use Case** | Direct data collection | Integrated backend system |
| **Access** | Command-line execution | HTTP requests |
| **Monitoring** | Console output | REST endpoints |
| **Integration** | Standalone | Part of FastAPI app |
| **Best For** | Testing, backtesting | Production trading |

---

## Common Issues

**Error: "Credential files not found"**
- Ensure `client_id.txt` and `access_token.txt` exist in `smart-algo-trade/` directory

**WebSocket disconnects frequently**
- Set `reconnect=True` (enabled by default)
- Check network connectivity
- Verify token hasn't expired

**No data appearing**
- Verify symbols exist and are tradeable
- Check market hours
- Ensure subscription was successful

**CSV not updating**
- Check `backend/data/ohlc_bars/` directory exists
- Verify file permissions
- Check logs for write errors

---

## Performance Notes

- **Memory Usage:** Last 100 ticks per symbol buffered in RAM
- **CSV Performance:** Appends row-by-row (no batch writes)
- **Network:** Auto-reconnects on disconnection
- **Logging:** Set to INFO level (change to DEBUG for more details)

---

## Next Steps

1. **Test Scripts:** Run with your Fyers credentials
2. **Collect Data:** Let scripts run to generate CSV files
3. **Backtesting:** Use CSVs in your trading strategies
4. **Monitor:** Track logs for errors or performance issues

---

## 3. Options Analysis (`options_analysis.py`)
**Purpose:** Comprehensive options chain analysis and ATM calculation

**Use Cases:**
- Option contract discovery and filtering
- ATM (At-The-Money) strike calculation
- NSE option chain data retrieval
- Options strategy research

**Features:**
- Fetch and cache Fyers instrument list
- Filter options by symbol, type (CE/PE), and expiry
- Calculate closest expiry contracts
- Automatic ATM strike identification
- NSE India option chain data integration
- CSV export of instrument list and option chains

**Run:**
```bash
python backend/scripts/options_analysis.py
```

**Output:**
```
[1] Loading instrument list...
✓ Loaded 50000+ instruments

[2] Fetching BANKNIFTY option contracts...
✓ Found 45 CE contracts

[3] Fetching BANKNIFTY spot price...
Spot price NSE:NIFTYBANK-INDEX: ₹50000

[4] Calculating ATM contracts...
============================================================
ATM Contracts for BANKNIFTY
============================================================
Spot Price: ₹50000
ATM Strike: ₹50000
Expiry: 2025-12-31

Call Contracts (CE):
   symbol  strike          token              updatedAt
  BANKNIFTY   50000  X_BANKNIFTY_50000_CE  2025-12-27

Put Contracts (PE):
   symbol  strike          token              updatedAt
  BANKNIFTY   50000  X_BANKNIFTY_50000_PE  2025-12-27
============================================================
```

---

## API Alternative - Options Chain Endpoints

Use REST API for programmatic options analysis:

```bash
# Refresh instrument list
POST /api/options/refresh-instruments

# Get expiry dates
GET /api/options/instruments/expiries?symbol=BANKNIFTY

# Get strike prices
GET /api/options/instruments/strikes?symbol=BANKNIFTY&option_type=CE&expiry_number=0

# Get all contracts
GET /api/options/contracts?symbol=BANKNIFTY&option_type=CE

# Get contracts for closest expiry
GET /api/options/contracts/closest-expiry?symbol=BANKNIFTY&expiry_number=0

# Get spot price
GET /api/options/spot-price?symbol=NSE:NIFTYBANK-INDEX

# Calculate ATM strike
GET /api/options/atm-strike?symbol=BANKNIFTY&spot_price=50000

# Get ATM contracts (CE + PE)
GET /api/options/atm-contracts?symbol=BANKNIFTY&spot_price=50000&expiry_number=0

# Get NSE option chain
GET /api/options/nse-option-chain?symbol=BANKNIFTY&expiry=31-Jan-2024
```

---

## Data Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| Instrument List | `backend/data/options/instrument_list.csv` | CSV | Cached FyersAPI instruments |
| Option Chain | `backend/data/options/{SYMBOL}_{EXPIRY}_chain.csv` | CSV | NSE option chain data |
| Logs | `backend/logs/options_analysis.log` | LOG | Analysis logs |

---

## Key Concepts

### ATM (At-The-Money)
- Strike price closest to current spot price
- Used as reference for straddle/strangle strategies
- Calculated using strike interval (typically ₹100 for BANKNIFTY)

### Expiry
- Closest expiry: Duration = 0 (default)
- Next closest: Duration = 1
- Furthest available: Duration = max

### Strike Prices
- Call (CE): Price to buy the underlying
- Put (PE): Price to sell the underlying
- Interval varies by symbol (₹100 for indices, ₹1 for stocks)

---

**Created:** Phase 14 & 15 - WebSocket Data Collection + Options Analysis
**Last Updated:** 2025-12-27
