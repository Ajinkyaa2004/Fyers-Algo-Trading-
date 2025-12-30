# Technical Indicators - Quick Reference Card

## 🎯 At a Glance

| Indicator | Purpose | Signal | Period | Status |
|-----------|---------|--------|--------|--------|
| **ADX** | Trend Strength (0-100) | ADX>25 = Trend | 14 | ✅ |
| **ATR** | Volatility Measurement | High ATR = Volatile | 14 | ✅ |
| **BB** | Support/Resistance | Bands = Limits | 20 | ✅ |

---

## 📊 ADX (Average Directional Index)

### What It Shows
Trend strength on a scale of 0-100

### Interpretation
```
0-25:   No Trend (Don't Trade)
25-50:  Moderate Trend (Tradeable)
50-75:  Strong Trend (Trade With Confidence)
75-100: Very Strong Trend (Maximum Confidence)
```

### Key Signals
```
✅ BUY:  ADX > 50 AND DI+ > DI-
❌ SELL: ADX > 50 AND DI- > DI+
⏸️  WAIT: ADX < 25 (No Trend)
```

### API
```bash
curl -X POST http://localhost:8000/api/indicators/calculate-adx \
  -H "Content-Type: application/json" \
  -d '{
    "ohlc_data": [...],
    "period": 14
  }'
```

### Output Fields
- `ADX`: Trend strength (0-100)
- `DI+`: Positive directional index
- `DI-`: Negative directional index

---

## 📈 ATR (Average True Range)

### What It Shows
How much the price typically moves in a period

### Use Cases
1. **Stop-Loss Placement**
   ```
   Stop Loss = Entry - (2 × ATR)
   ```

2. **Take-Profit Setting**
   ```
   Take Profit = Entry + (3 × ATR)
   ```

3. **Position Sizing**
   ```
   Shares = (Risk Amount) / (Entry - Stop Loss)
   ```

### Interpretation
```
High ATR:  Large price swings (High Volatility)
Low ATR:   Small price swings (Low Volatility)
```

### API
```bash
curl -X POST http://localhost:8000/api/indicators/calculate-atr \
  -H "Content-Type: application/json" \
  -d '{
    "ohlc_data": [...],
    "period": 14
  }'
```

### Output Fields
- `ATR`: Average True Range value
- `TR`: True Range (individual candle)

---

## 🎗️ Bollinger Bands

### What It Shows
Volatility bands and support/resistance levels

### Components
```
Upper Band = MA + (2 × StdDev)    [Resistance]
MA (Middle) = 20-period SMA       [Center]
Lower Band = MA - (2 × StdDev)    [Support]
```

### Trading Signals
```
⬆️  OVERBOUGHT:  Price touches Upper Band
⬇️  OVERSOLD:    Price touches Lower Band
🔄 SQUEEZE:      Bands very narrow (Breakout Coming)
↗️  WALKING:      Price walking upper band (Strong Uptrend)
```

### API
```bash
curl -X POST http://localhost:8000/api/indicators/calculate-bollinger-bands \
  -H "Content-Type: application/json" \
  -d '{
    "ohlc_data": [...],
    "period": 20,
    "std_dev": 2.0
  }'
```

### Output Fields
- `MA`: Moving Average (middle band)
- `BB_up`: Upper Bollinger Band
- `BB_dn`: Lower Bollinger Band
- `BB_width`: Band width (volatility)

---

## 🎬 Trading Strategy Example

### Step 1: Check Trend (ADX)
```python
ADX > 40?  → Continue to Step 2
ADX < 25?  → Wait (No Trend)
```

### Step 2: Determine Direction (DI+ vs DI-)
```python
DI+ > DI-?  → UPTREND (Step 3)
DI- > DI+?  → DOWNTREND (Step 3)
```

### Step 3: Confirm Entry (Bollinger Bands)
```python
UPTREND:   Price > MA  → BUY Signal ✅
DOWNTREND: Price < MA  → SELL Signal ✅
```

### Step 4: Set Risk (ATR)
```python
Stop Loss = Entry - (2 × ATR)
Take Profit = Entry + (3 × ATR)
Risk/Reward = (TP - Entry) / (Entry - SL)
```

---

## 📋 Parameter Defaults

| Indicator | Period | Standard Deviation | Use |
|-----------|--------|-------------------|-----|
| ADX | 14 | N/A | Default recommended |
| ATR | 14 | N/A | Default recommended |
| BB | 20 | 2.0 | Default recommended |

---

## ⚠️ Common Mistakes to Avoid

1. ❌ Trading when ADX < 25 (Too many false signals)
2. ❌ Using only one indicator (Use confirmation)
3. ❌ Ignoring ATR for position sizing (Risk management)
4. ❌ Overshooting with tight stops (Use ATR-based stops)
5. ❌ Trading with expired data (Use latest candles)

---

## ✅ Checklist Before Trading

- [ ] ADX > 25? (Trend exists)
- [ ] DI+ and DI- aligned with direction? (Trend confirmed)
- [ ] Price near BB or support/resistance? (Entry point)
- [ ] ATR calculated for position size? (Risk defined)
- [ ] Stop loss set 2×ATR away? (Risk managed)
- [ ] Take profit 3×ATR away? (Reward defined)

---

## 🔧 Code Snippet Examples

### Get ADX Value
```python
import requests

response = requests.post(
    "http://localhost:8000/api/indicators/calculate-adx",
    json={"ohlc_data": data, "period": 14}
)
latest = response.json()["data"]["indicators"][-1]
print(f"ADX: {latest['ADX']}")
```

### Calculate Stop Loss
```python
response = requests.post(
    "http://localhost:8000/api/indicators/calculate-atr",
    json={"ohlc_data": data, "period": 14}
)
latest = response.json()["data"]["indicators"][-1]
stop_loss = latest['close'] - (2 * latest['ATR'])
```

### Check Overbought/Oversold
```python
response = requests.post(
    "http://localhost:8000/api/indicators/calculate-bollinger-bands",
    json={"ohlc_data": data, "period": 20, "std_dev": 2.0}
)
latest = response.json()["data"]["indicators"][-1]
if latest['close'] >= latest['BB_up']:
    print("OVERBOUGHT - Consider Selling")
elif latest['close'] <= latest['BB_dn']:
    print("OVERSOLD - Consider Buying")
```

---

## 📞 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| NaN values | Insufficient data | Add more candles (20+ minimum) |
| ADX stuck at 0 | Old data | Use recent candles |
| False signals | ADX too low | Wait for ADX > 25 |
| Wide stops | High volatility | OK, use ATR value as is |

---

## 🎓 Learning Resources

### ADX
- Trend strength measurement
- Values 0-100 scale
- Created by J. Welles Wilder

### ATR
- Volatility measurement
- Risk management tool
- No directional bias

### Bollinger Bands
- Volatility bands
- Support/resistance
- Created by John Bollinger

---

## 📊 Performance Guidelines

### Recommended Minimum Data
- ADX: 15+ candles
- ATR: 15+ candles
- BB: 21+ candles

### Optimal Data Points
- Intraday: 100+ candles
- Daily: 50+ candles

### Update Frequency
- Intraday: Every new candle
- Daily: Once per day
- Weekly: Once per week

---

## 🚀 Next Steps

1. **Test**: Use sample data to verify calculations
2. **Backtest**: Test on historical data for profitability
3. **Paper Trade**: Trade with real signals on simulated account
4. **Live Trade**: Start with 1-2 contracts, scale up gradually

---

## 📞 API Reference

### All Endpoints

```
POST /api/indicators/calculate-adx
POST /api/indicators/calculate-atr
POST /api/indicators/calculate-bollinger-bands
POST /api/indicators/calculate-rsi
POST /api/indicators/calculate-macd
POST /api/indicators/calculate-ema?period=14
POST /api/indicators/calculate-sma?period=20
GET /api/indicators/indicators-info
```

### Required Fields
- `ohlc_data`: List of OHLC dictionaries
- `period`: Calculation period (14 or 20)

### Response Format
```json
{
    "status": "success",
    "data": {
        "indicators": [...]
    }
}
```

---

## ✨ Quick Decision Matrix

```
┌─────────────────────────────────────────────────┐
│ ADX  │ DI+ > DI- │ Price > MA │ Action          │
├──────┼───────────┼───────────┼─────────────────┤
│ >50  │ YES       │ YES       │ STRONG BUY ✅✅ │
│ >50  │ YES       │ NO        │ BUY (Pullback)  │
│ >50  │ NO        │ YES       │ CAUTION (Weak)  │
│ >50  │ NO        │ NO        │ STRONG SELL ✅✅│
│ 25-50│ YES       │ YES       │ BUY ✅          │
│ 25-50│ NO        │ NO        │ SELL ✅         │
│ <25  │ ANY       │ ANY       │ WAIT (No Trend) │
└─────────────────────────────────────────────────┘
```

---

**Version**: 1.0  
**Last Updated**: December 27, 2025  
**Status**: ✅ Production Ready

Keep this card handy for quick reference while trading!
