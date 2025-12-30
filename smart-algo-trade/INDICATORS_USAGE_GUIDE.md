# Technical Indicators - Usage Guide

## Overview
Three advanced technical indicators from Aseem Singhal have been implemented and integrated into the FastAPI backend:
1. **ADX** (Average Directional Index) - Trend Strength
2. **ATR** (Average True Range) - Volatility Measurement
3. **Bollinger Bands** - Volatility Bands & Support/Resistance

---

## 1. ADX (Average Directional Index)

### What is ADX?
ADX measures the **strength of a trend** on a scale of 0-100.
- **0-25**: No/Weak trend
- **25-50**: Moderate trend (tradeable)
- **50-75**: Strong trend
- **75-100**: Very strong trend

### API Endpoint
```
POST /api/indicators/calculate-adx
```

### Request Format
```json
{
    "ohlc_data": [
        {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
        {"open": 102, "high": 107, "low": 101, "close": 106, "volume": 1200},
        ...
    ],
    "period": 14
}
```

### Response Format
```json
{
    "status": "success",
    "data": {
        "indicators": [
            {
                "timestamp": "2024-12-27T10:00:00",
                "open": 100,
                "high": 105,
                "low": 99,
                "close": 102,
                "volume": 1000,
                "ADX": 42.5,
                "DI+": 28.3,
                "DI-": 15.7,
                "TR": 6,
                "TRn": 5.8
            },
            ...
        ]
    }
}
```

### Key Output Columns
| Column | Description | Range |
|--------|-------------|-------|
| **ADX** | Trend strength | 0-100 |
| **DI+** | Positive directional indicator | 0-100 |
| **DI-** | Negative directional indicator | 0-100 |
| **TR** | True Range (individual) | Any |
| **TRn** | Smoothed True Range | Any |

### Trading Signals
```python
# Strong uptrend
if ADX > 50 and DI+ > DI-:
    action = "BUY"

# Strong downtrend
if ADX > 50 and DI- > DI+:
    action = "SELL"

# Weak trend - avoid trading
if ADX < 25:
    action = "WAIT"

# Trend reversal signal
if ADX is increasing and DI+ crosses above DI-:
    action = "BUY SIGNAL"

if ADX is increasing and DI- crosses above DI+:
    action = "SELL SIGNAL"
```

### Example Python Usage
```python
import requests
import json

# Fetch OHLC data (from historical_data.py)
ohlc_data = [
    {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
    {"open": 102, "high": 107, "low": 101, "close": 106, "volume": 1200},
    # ... 50+ more candles ...
]

# Call ADX endpoint
response = requests.post(
    "http://localhost:8000/api/indicators/calculate-adx",
    json={
        "ohlc_data": ohlc_data,
        "period": 14
    }
)

results = response.json()["data"]["indicators"]

# Extract latest ADX value
latest = results[-1]
adx_value = latest["ADX"]
di_plus = latest["DI+"]
di_minus = latest["DI-"]

print(f"ADX: {adx_value}")
print(f"DI+: {di_plus}, DI-: {di_minus}")

# Decision logic
if adx_value > 50:
    if di_plus > di_minus:
        print("Strong Uptrend - Consider BUY")
    else:
        print("Strong Downtrend - Consider SELL")
```

---

## 2. ATR (Average True Range)

### What is ATR?
ATR measures **market volatility**. It tells you the average range of price movement.
- **High ATR**: Large price swings (high volatility)
- **Low ATR**: Small price swings (low volatility)

### API Endpoint
```
POST /api/indicators/calculate-atr
```

### Request Format
```json
{
    "ohlc_data": [
        {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
        {"open": 102, "high": 107, "low": 101, "close": 106, "volume": 1200},
        ...
    ],
    "period": 14
}
```

### Response Format
```json
{
    "status": "success",
    "data": {
        "indicators": [
            {
                "timestamp": "2024-12-27T10:00:00",
                "open": 100,
                "high": 105,
                "low": 99,
                "close": 102,
                "volume": 1000,
                "TR": 6,
                "ATR": 5.2
            },
            ...
        ]
    }
}
```

### Key Output Columns
| Column | Description |
|--------|-------------|
| **TR** | True Range (individual candle) |
| **ATR** | Average True Range (smoothed over period) |

### Trading Applications

#### 1. Stop-Loss Placement
```python
# Place stop-loss based on ATR
entry_price = latest_close
atr_value = latest_atr

# Conservative: 1.5 * ATR
stop_loss = entry_price - (1.5 * atr_value)

# Moderate: 2 * ATR  
stop_loss = entry_price - (2 * atr_value)

# Aggressive: 3 * ATR
stop_loss = entry_price - (3 * atr_value)
```

#### 2. Position Sizing
```python
# Determine position size based on risk and ATR
account_size = 100000  # $100,000
risk_percentage = 0.02  # Risk 2% per trade
risk_amount = account_size * risk_percentage

entry_price = 100
atr_value = 5

stop_loss = entry_price - (2 * atr_value)
risk_per_share = entry_price - stop_loss

shares_to_trade = risk_amount / risk_per_share
```

#### 3. Volatility Assessment
```python
# Compare current ATR to average ATR
atr_sma_20 = average(last_20_atr_values)

current_atr = latest_atr

volatility_ratio = current_atr / atr_sma_20

if volatility_ratio > 1.5:
    print("Volatility Expansion - Price Breakout Likely")
elif volatility_ratio < 0.7:
    print("Volatility Compression - Explosive Move Possible")
```

### Example Python Usage
```python
import requests

# Fetch OHLC data
ohlc_data = [
    {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
    # ... more data ...
]

# Call ATR endpoint
response = requests.post(
    "http://localhost:8000/api/indicators/calculate-atr",
    json={
        "ohlc_data": ohlc_data,
        "period": 14
    }
)

results = response.json()["data"]["indicators"]
latest = results[-1]

current_price = latest["close"]
atr_value = latest["ATR"]

# Set stop-loss 2 ATR below entry
stop_loss = current_price - (2 * atr_value)
take_profit = current_price + (3 * atr_value)

print(f"Entry: {current_price}")
print(f"Stop Loss: {stop_loss}")
print(f"Take Profit: {take_profit}")
print(f"Risk/Reward Ratio: 1:{(take_profit - current_price) / (current_price - stop_loss):.2f}")
```

---

## 3. Bollinger Bands

### What are Bollinger Bands?
Bollinger Bands are volatility bands placed above and below a moving average.
- **Middle Band**: 20-period SMA (Simple Moving Average)
- **Upper Band**: Middle + 2 * Standard Deviation
- **Lower Band**: Middle - 2 * Standard Deviation

### API Endpoint
```
POST /api/indicators/calculate-bollinger-bands
```

### Request Format
```json
{
    "ohlc_data": [
        {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
        {"open": 102, "high": 107, "low": 101, "close": 106, "volume": 1200},
        ...
    ],
    "period": 20,
    "std_dev": 2.0
}
```

### Response Format
```json
{
    "status": "success",
    "data": {
        "indicators": [
            {
                "timestamp": "2024-12-27T10:00:00",
                "open": 100,
                "high": 105,
                "low": 99,
                "close": 102,
                "volume": 1000,
                "MA": 101.5,
                "BB_up": 110.2,
                "BB_dn": 92.8,
                "BB_width": 17.4
            },
            ...
        ]
    }
}
```

### Key Output Columns
| Column | Description |
|--------|-------------|
| **MA** | Middle Bollinger Band (20-period SMA) |
| **BB_up** | Upper Bollinger Band |
| **BB_dn** | Lower Bollinger Band |
| **BB_width** | Band Width (volatility measure) |

### Trading Signals

#### 1. Volatility Squeeze (Mean Reversion Setup)
```python
# Detect squeeze
bb_width_sma_20 = average(last_20_bb_widths)
current_bb_width = latest_bb_width

squeeze_ratio = current_bb_width / bb_width_sma_20

if squeeze_ratio < 0.5:
    print("Volatility Squeeze Detected")
    print("Expect: Explosive price move (breakout/breakdown)")
    print("Strategy: Wait for breakout and trade in breakout direction")
```

#### 2. Overbought/Oversold (Trend Reversal)
```python
close_price = latest_close
bb_up = latest_bb_up
bb_dn = latest_bb_dn
ma = latest_ma

# Price touches upper band = potential overbought
if close_price >= bb_up:
    print("Overbought - Expect reversal or pullback")
    print("Strategy: Sell or take profits")

# Price touches lower band = potential oversold
if close_price <= bb_dn:
    print("Oversold - Expect reversal or bounce")
    print("Strategy: Buy or add to position")
```

#### 3. Band Expansion (Trend Strength)
```python
# Wide bands = strong trend, narrow bands = weak trend
prev_bb_width = previous_bb_width
current_bb_width = latest_bb_width

width_change = (current_bb_width - prev_bb_width) / prev_bb_width

if width_change > 0.1:  # 10% expansion
    print("Bands Expanding - Trend is Strengthening")
elif width_change < -0.1:  # 10% contraction
    print("Bands Contracting - Trend is Weakening")
```

#### 4. Walk the Bands (Trend Continuation)
```python
# In strong uptrend, price often walks upper band
close_price = latest_close
bb_up = latest_bb_up
ma = latest_ma

if close_price > ma and (close_price - ma) > (bb_up - ma) * 0.7:
    print("Walking Upper Band - Strong Uptrend Continuation")
    print("Strategy: Hold longs, consider adding")
```

### Example Python Usage
```python
import requests

# Fetch OHLC data
ohlc_data = [
    {"open": 100, "high": 105, "low": 99, "close": 102, "volume": 1000},
    # ... more data ...
]

# Call Bollinger Bands endpoint
response = requests.post(
    "http://localhost:8000/api/indicators/calculate-bollinger-bands",
    json={
        "ohlc_data": ohlc_data,
        "period": 20,
        "std_dev": 2.0
    }
)

results = response.json()["data"]["indicators"]
latest = results[-1]

close = latest["close"]
bb_up = latest["BB_up"]
bb_dn = latest["BB_dn"]
bb_width = latest["BB_width"]
ma = latest["MA"]

# Trading decision
if close > bb_up:
    action = "SELL (Overbought at Upper Band)"
elif close < bb_dn:
    action = "BUY (Oversold at Lower Band)"
elif close > ma:
    action = "LONG (Above MA)"
else:
    action = "SHORT (Below MA)"

print(f"Price: {close}")
print(f"Upper Band: {bb_up}")
print(f"MA (Middle): {ma}")
print(f"Lower Band: {bb_dn}")
print(f"Band Width: {bb_width:.2f}")
print(f"Signal: {action}")
```

---

## Combined Strategy Example

### Trend Following with Confirmation
```python
import requests

# Get all three indicators
def get_trading_signal(symbol, resolution, duration=5):
    ohlc_data = fetch_ohlc(symbol, resolution, duration)
    
    # Get ADX for trend strength
    adx_response = requests.post(
        "http://localhost:8000/api/indicators/calculate-adx",
        json={"ohlc_data": ohlc_data, "period": 14}
    )
    adx_data = adx_response.json()["data"]["indicators"][-1]
    
    # Get ATR for volatility and stops
    atr_response = requests.post(
        "http://localhost:8000/api/indicators/calculate-atr",
        json={"ohlc_data": ohlc_data, "period": 14}
    )
    atr_data = atr_response.json()["data"]["indicators"][-1]
    
    # Get Bollinger Bands for support/resistance
    bb_response = requests.post(
        "http://localhost:8000/api/indicators/calculate-bollinger-bands",
        json={"ohlc_data": ohlc_data, "period": 20, "std_dev": 2.0}
    )
    bb_data = bb_response.json()["data"]["indicators"][-1]
    
    # Trading Logic
    signal = {
        "timestamp": adx_data["timestamp"],
        "price": adx_data["close"],
        "adx": adx_data["ADX"],
        "di_plus": adx_data["DI+"],
        "di_minus": adx_data["DI-"],
        "atr": atr_data["ATR"],
        "bb_up": bb_data["BB_up"],
        "bb_dn": bb_data["BB_dn"],
        "action": None,
        "stop_loss": None,
        "take_profit": None,
        "confidence": 0
    }
    
    # Step 1: Check trend strength (ADX)
    if adx_data["ADX"] > 40:  # Strong trend
        # Step 2: Determine direction (DI+ vs DI-)
        if adx_data["DI+"] > adx_data["DI-"]:
            # Step 3: Confirm with Bollinger Bands
            if adx_data["close"] > bb_data["MA"]:
                signal["action"] = "BUY"
                signal["stop_loss"] = adx_data["close"] - (2 * atr_data["ATR"])
                signal["take_profit"] = adx_data["close"] + (3 * atr_data["ATR"])
                signal["confidence"] = 0.85
        elif adx_data["DI-"] > adx_data["DI+"]:
            if adx_data["close"] < bb_data["MA"]:
                signal["action"] = "SELL"
                signal["stop_loss"] = adx_data["close"] + (2 * atr_data["ATR"])
                signal["take_profit"] = adx_data["close"] - (3 * atr_data["ATR"])
                signal["confidence"] = 0.85
    
    return signal

# Usage
signal = get_trading_signal("NSE:SBIN-EQ", "30")
print(f"Action: {signal['action']}")
print(f"Confidence: {signal['confidence']}")
print(f"Stop Loss: {signal['stop_loss']}")
print(f"Take Profit: {signal['take_profit']}")
```

---

## Performance Tips

### 1. Batch Requests
```python
# Instead of 3 separate requests, create a combined endpoint
# Load all three indicators in one API call
```

### 2. Caching
```python
# Cache indicator values for the same period
# Only recalculate when new candle arrives
```

### 3. Optimize Periods
```python
# Use standard periods:
# ADX/ATR: 14 (default)
# Bollinger Bands: 20 (default)
# These are industry standard
```

### 4. Real-time Updates
```python
# With websocket integration, get real-time signals
# Without needing to re-fetch historical data
```

---

## Troubleshooting

### Issue: NaN values in output
**Solution**: Ensure you have at least `period + 1` candles of data
```python
# Need 15 candles minimum for period=14
# Need 21 candles minimum for period=20
```

### Issue: Signals not aligning
**Solution**: Verify all indicators use same OHLC data and period
```python
# Use same ohlc_data array for all three endpoints
# Use consistent periods (14, 14, 20)
```

### Issue: High false signals
**Solution**: Use multiple confirmations
```python
# Don't trade on single indicator
# Require ADX confirmation (trend strength > 25)
# Require price near Bollinger Band (support/resistance)
# Confirm with ATR (volatility > average)
```

---

## Summary

| Indicator | Purpose | Best Use | Period |
|-----------|---------|----------|--------|
| **ADX** | Trend Strength | Confirm trend exists | 14 |
| **ATR** | Volatility | Position sizing, stops | 14 |
| **BB** | Support/Resistance | Entry/exit levels | 20 |

All three indicators work best together as a **confirmation system** rather than standalone signals.
