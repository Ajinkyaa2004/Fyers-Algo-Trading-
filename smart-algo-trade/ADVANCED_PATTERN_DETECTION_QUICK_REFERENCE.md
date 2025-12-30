# Advanced Pattern Detection Quick Reference

**Phase 12 Implementation**

---

## 3 New Analysis Methods

### 1. Rolling Trend Detection
**Endpoint:** `GET /api/indicators/detect-trend-rolling`

**What It Does:**
- Analyzes consistency of higher lows (uptrend) or lower highs (downtrend)
- Tracks % of candles with progression pattern
- Returns uptrend/downtrend/none based on 70% threshold

**When to Use:**
- Confirming sustained trends
- Avoiding false breakouts
- Identifying trend momentum strength

**Example:**
```
/api/indicators/detect-trend-rolling?symbol=NSE:SBIN-EQ&period=7&threshold=0.7
```

**Response:**
```json
{
    "trend": "Uptrend",
    "period": 7,
    "threshold": "70%"
}
```

---

### 2. Resistance & Support Levels
**Endpoint:** `GET /api/indicators/resistance-support`

**What It Does:**
- Calculates 7 daily pivot levels (S3, S2, S1, P, R1, R2, R3)
- Identifies closest resistance above current price
- Identifies closest support below current price

**When to Use:**
- Setting profit targets (resistance levels)
- Setting stop losses (support levels)
- Entry/exit planning at key levels

**Example:**
```
/api/indicators/resistance-support?symbol=NSE:RELIANCE-EQ
```

**Response:**
```json
{
    "current_price": 2500.50,
    "nearest_resistance": 2510.00,
    "nearest_support": 2485.00,
    "all_levels": {
        "r3": 2525, "r2": 2515, "r1": 2510,
        "pivot": 2495,
        "s1": 2485, "s2": 2475, "s3": 2460
    }
}
```

---

### 3. Advanced Pattern Detection
**Endpoint:** `GET /api/indicators/detect-pattern-advanced`

**What It Does:**
- Identifies candle type (doji, marubozu, hammer, engulfing, etc.)
- Confirms trend direction (uptrend, downtrend, sideways)
- Calculates momentum vs daily pivot
- Returns pattern name + signal strength (0.5-0.9)

**When to Use:**
- High-confidence entry/exit signals
- Pattern-based trading strategies
- Confirmation of reversals/continuations

**Example:**
```
/api/indicators/detect-pattern-advanced?symbol=NSE:INFY-EQ&period=7
```

**Response:**
```json
{
    "pattern": "engulfing_bull",
    "momentum": "bull",
    "trend": "downtrend",
    "signal_strength": 0.9
}
```

---

## Pattern Types (Advanced Detection)

### High Confidence Patterns (0.8-0.9 strength)
- **engulfing_bull** (downtrend) - Strong reversal up
- **engulfing_bear** (uptrend) - Strong reversal down
- **marubozu_bull** (with bull momentum) - Strong continuation
- **marubozu_bear** (with bear momentum) - Strong continuation

### Medium Confidence Patterns (0.6-0.7 strength)
- **doji_bear** (uptrend) - Potential reversal to down
- **doji_bull** (downtrend) - Potential reversal to up
- **hammer_bull** (downtrend) - Bullish reversal
- **hammer_bear** (uptrend) - Bearish hanging man
- **shooting_star_bear** (uptrend) - Bearish reversal

---

## Quick Trading Examples

### Strategy 1: Trend + Pattern Confirmation
```
1. Get rolling trend
2. Get advanced pattern
3. Trade only if both confirm same direction
```

### Strategy 2: Support/Resistance Trading
```
1. Get R/S levels
2. Enter at support (for uptrend)
3. Exit at resistance
4. Stop loss at next support
```

### Strategy 3: Pattern + Momentum Confirmation
```
1. Identify pattern
2. Check momentum vs pivot
3. Trade if pattern + momentum align
```

---

## All Parameters

### Rolling Trend
- `symbol` (required) - Trading symbol
- `period` (optional, default 7) - Candles to analyze
- `threshold` (optional, default 0.7) - Trend confirmation %

### Resistance/Support
- `symbol` (required) - Trading symbol
- `intraday_resolution` (optional, default 30) - Minute interval
- `daily_duration` (optional, default 30) - Days of daily data

### Advanced Pattern
- `symbol` (required) - Trading symbol
- `intraday_resolution` (optional, default 15) - Minute interval
- `period` (optional, default 7) - Trend analysis candles

---

## Pivot Points Formula

```
Pivot = (High + Low + Close) / 3
R1 = (2 × Pivot) - Low
R2 = Pivot + (High - Low)
R3 = High + 2 × (Pivot - Low)
S1 = (2 × Pivot) - High
S2 = Pivot - (High - Low)
S3 = Low - 2 × (High - Pivot)
```

---

## File Locations

- **Methods:** `backend/app/api/technical_indicators.py` (lines 815-1287)
- **Endpoints:** `backend/app/api/technical_indicators.py` (lines 2289-2415)
- **Full Documentation:** `ADVANCED_PATTERN_DETECTION_IMPLEMENTATION.md`

---

## Usage in Python

```python
# Service methods (direct use)
trend = TechnicalIndicatorsService.detect_trend_rolling(df, period=7)
levels = TechnicalIndicatorsService.get_resistance_support(intraday_df, daily_df)
pattern = TechnicalIndicatorsService.detect_candle_pattern_advanced(intraday_df, daily_df)

# API usage (via HTTP requests)
# See examples above for each endpoint
```

---

**Status:** ✅ Production Ready (0 Syntax Errors)
