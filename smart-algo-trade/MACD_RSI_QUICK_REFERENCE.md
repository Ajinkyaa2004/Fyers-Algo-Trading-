# MACD & RSI Quick Reference

## MACD (Moving Average Convergence Divergence)

### What It Shows
Trend strength and momentum using EMA convergence/divergence

### Formula
```
MA_Fast = EWM(Close, span=12)
MA_Slow = EWM(Close, span=26)
MACD = MA_Fast - MA_Slow
Signal = EWM(MACD, span=9)
Histogram = MACD - Signal
```

### Signals
```
BUY:  MACD crosses above Signal
SELL: MACD crosses below Signal
```

### API
```bash
curl -X POST http://localhost:8000/api/indicators/calculate-macd \
  -H "Content-Type: application/json" \
  -d '{
    "ohlc_data": [...],
    "fast": 12,
    "slow": 26,
    "signal": 9
  }'
```

### Output
- `MA_Fast`: 12-period EMA
- `MA_Slow`: 26-period EMA
- `MACD`: MACD line
- `Signal`: Signal line
- `MACD_Histogram`: MACD - Signal

---

## RSI (Relative Strength Index)

### What It Shows
Momentum on 0-100 scale (overbought/oversold)

### Formula
```
Change = Close(t) - Close(t-1)
Gain = Change if > 0, else 0
Loss = |Change| if < 0, else 0
AvgGain = Rolling Mean of Gains
AvgLoss = Rolling Mean of Losses
RS = AvgGain / AvgLoss
RSI = 100 - (100 / (1 + RS))
```

### Signals
```
BUY:  RSI < 30 (Oversold)
SELL: RSI > 70 (Overbought)
```

### API
```bash
curl -X POST http://localhost:8000/api/indicators/calculate-rsi \
  -H "Content-Type: application/json" \
  -d '{
    "ohlc_data": [...],
    "period": 14
  }'
```

### Output
- `RSI`: Momentum 0-100 scale

---

## Combined Usage

### Entry Rule
```
Buy If:
- MACD > Signal (uptrend)
- RSI < 70 (not overbought)
- RSI > 30 (not oversold)

Sell If:
- MACD < Signal (downtrend)
- RSI > 30 (not oversold)
- RSI < 70 (not overbought)
```

---

## Examples

### Python
```python
import requests

# Get MACD
resp = requests.post(
    "http://localhost:8000/api/indicators/calculate-macd",
    json={"ohlc_data": data}
)
macd_data = resp.json()["data"]["indicators"]

# Get RSI
resp = requests.post(
    "http://localhost:8000/api/indicators/calculate-rsi",
    json={"ohlc_data": data}
)
rsi_data = resp.json()["data"]["indicators"]

# Latest values
latest_macd = macd_data[-1]
latest_rsi = rsi_data[-1]

print(f"MACD: {latest_macd['MACD']}")
print(f"Signal: {latest_macd['Signal']}")
print(f"RSI: {latest_rsi['RSI']}")
```

---

## Reference Table

| MACD | Signal | Action |
|------|--------|--------|
| > | > | Strong Uptrend |
| > | < | Bullish Crossover |
| < | > | Bearish Crossover |
| < | < | Strong Downtrend |

| RSI | Signal |
|-----|--------|
| <30 | Oversold |
| 30-70 | Neutral |
| >70 | Overbought |

---

## Status
✅ Both indicators fully implemented and integrated
✅ API endpoints active and tested
✅ Production ready
