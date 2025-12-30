# Advanced Trading with Smart Algo Trade

## 🚀 Complete Trading Workflow

This guide provides real-world examples of how to use the Smart Algo Trade system for live and paper trading.

## 1️⃣ Starting Fresh: Initialize Your Trading Day

### Morning Checklist

```bash
# 1. Start servers
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001

# 2. In another terminal
cd frontend
npm run dev

# 3. Open http://127.0.0.1:3000
```

### Check Account Status

```python
import requests

base = "http://127.0.0.1:8001/api/portfolio"

# Get profile
profile = requests.get(f"{base}/profile").json()
print(f"Account: {profile['data']['name']}")

# Get margins
margins = requests.get(f"{base}/margins").json()
funds = margins['data']
print(f"Available Margin: ₹{funds['availableMargin']}")
print(f"Used Margin: ₹{funds['usedMargin']}")
```

## 2️⃣ Analyzing Market Data

### Get Live Stock Quotes

```python
import requests

symbols = "NSE:SBIN-EQ,NSE:RELIANCE-EQ,NSE:INFY-EQ"
quotes = requests.get(
    "http://127.0.0.1:8001/api/portfolio/quotes",
    params={"symbols": symbols}
).json()

for quote in quotes['data']:
    print(f"{quote['symbol']}: ₹{quote['ltp']} ({quote['change_percent']}%)")
```

### Fetch Historical Data for Technical Analysis

```python
import requests
import pandas as pd

# Get daily data
response = requests.get(
    "http://127.0.0.1:8001/api/portfolio/history",
    params={
        "symbol": "NSE:SBIN-EQ",
        "resolution": "D"  # Daily
    }
).json()

# Convert to DataFrame
candles = response['data']
df = pd.DataFrame(candles)
df['date'] = pd.to_datetime(df['timestamp'], unit='s')

# Simple Moving Averages
df['SMA_20'] = df['close'].rolling(20).mean()
df['SMA_50'] = df['close'].rolling(50).mean()

# RSI (14-period)
def calculate_rsi(data, period=14):
    delta = data.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

df['RSI'] = calculate_rsi(df['close'])

# Print analysis
print(df[['date', 'close', 'SMA_20', 'SMA_50', 'RSI']].tail(10))
```

## 3️⃣ Placing Orders

### Simple Market Order

```python
import requests
import json

order_data = {
    "symbol": "NSE:SBIN-EQ",
    "qty": 10,
    "type": "MARKET",
    "side": "BUY",
    "productType": "CNC",  # CNC = Cash & Carry (Delivery)
    "validity": "DAY"
}

response = requests.post(
    "http://127.0.0.1:8001/api/portfolio/place-order",
    json=order_data
).json()

print(json.dumps(response, indent=2))
```

### Limit Order with Specific Price

```python
order_data = {
    "symbol": "NSE:RELIANCE-EQ",
    "qty": 5,
    "type": "LIMIT",
    "side": "BUY",
    "productType": "CNC",
    "limitPrice": 3150.00,  # Buy only at this price or lower
    "validity": "DAY"
}

response = requests.post(
    "http://127.0.0.1:8001/api/portfolio/place-order",
    json=order_data
).json()

order_id = response['data'].get('id')
print(f"Order placed: {order_id}")
```

### Intraday Trade (MIS - Margin Intraday Square-off)

```python
order_data = {
    "symbol": "NSE:INFY-EQ",
    "qty": 20,
    "type": "LIMIT",
    "side": "BUY",
    "productType": "MIS",  # MIS = Intraday, must close by end of day
    "limitPrice": 1780.00,
    "validity": "DAY",
    "disclosedQty": 10  # Show only 10 qty at a time (hide rest)
}

response = requests.post(
    "http://127.0.0.1:8001/api/portfolio/place-order",
    json=order_data
).json()

print(response)
```

## 4️⃣ Managing Positions

### View All Current Positions

```python
import requests

response = requests.get(
    "http://127.0.0.1:8001/api/portfolio/positions"
).json()

positions = response['data']['net']
for pos in positions:
    pnl_color = "📈" if pos['pnl'] > 0 else "📉"
    print(f"{pnl_color} {pos['symbol']}: {pos['quantity']} @ ₹{pos['last_price']}")
    print(f"   P&L: ₹{pos['pnl']} ({pos['pnl_percent']}%)")
```

### Check Holdings (Long-term Positions)

```python
import requests

response = requests.get(
    "http://127.0.0.1:8001/api/portfolio/holdings"
).json()

holdings = response['data']
total_pnl = 0

for holding in holdings:
    print(f"{holding['symbol']}: {holding['quantity']} shares")
    print(f"  Avg Price: ₹{holding['average_price']}")
    print(f"  Current: ₹{holding['last_price']}")
    print(f"  P&L: ₹{holding['pnl']} ({holding['pnl_percent']}%)")
    total_pnl += holding['pnl']

print(f"\nTotal Portfolio P&L: ₹{total_pnl}")
```

## 5️⃣ Modifying & Cancelling Orders

### Modify Pending Order

```python
import requests

# Get pending orders first
orders = requests.get(
    "http://127.0.0.1:8001/api/portfolio/orders"
).json()

pending_orders = [o for o in orders['data'] if o['status'] == 'OPEN']

if pending_orders:
    order = pending_orders[0]
    order_id = order['id']
    
    # Modify the order
    modify_data = {
        "id": order_id,
        "type": "LIMIT",
        "limitPrice": 551.00,  # Change price
        "qty": 5  # Change quantity
    }
    
    response = requests.put(
        "http://127.0.0.1:8001/api/portfolio/modify-order",
        json=modify_data
    ).json()
    
    print(f"Order {order_id} modified")
```

### Cancel Order

```python
import requests

order_id = "your_order_id"

response = requests.delete(
    f"http://127.0.0.1:8001/api/portfolio/cancel-order/{order_id}"
).json()

print(f"Order cancelled: {response['status']}")
```

## 6️⃣ Strategy Examples

### Strategy 1: SMA Crossover Bot

```python
import requests
import pandas as pd
import time

def get_historical_data(symbol):
    response = requests.get(
        "http://127.0.0.1:8001/api/portfolio/history",
        params={"symbol": symbol, "resolution": "D"}
    ).json()
    
    df = pd.DataFrame(response['data'])
    df['SMA_20'] = df['close'].rolling(20).mean()
    df['SMA_50'] = df['close'].rolling(50).mean()
    return df

def check_signal(symbol):
    df = get_historical_data(symbol)
    
    # Get latest candles
    last = df.iloc[-1]
    prev = df.iloc[-2]
    
    # Golden cross: SMA20 > SMA50
    if prev['SMA_20'] <= prev['SMA_50'] and last['SMA_20'] > last['SMA_50']:
        return "BUY"
    
    # Death cross: SMA20 < SMA50
    if prev['SMA_20'] >= prev['SMA_50'] and last['SMA_20'] < last['SMA_50']:
        return "SELL"
    
    return None

def execute_trade(symbol, signal):
    if signal == "BUY":
        order = {
            "symbol": symbol,
            "qty": 5,
            "type": "MARKET",
            "side": "BUY",
            "productType": "CNC"
        }
    elif signal == "SELL":
        order = {
            "symbol": symbol,
            "qty": 5,
            "type": "MARKET",
            "side": "SELL",
            "productType": "CNC"
        }
    
    response = requests.post(
        "http://127.0.0.1:8001/api/portfolio/place-order",
        json=order
    ).json()
    
    return response

# Monitor symbols
symbols = ["NSE:SBIN-EQ", "NSE:INFY-EQ", "NSE:RELIANCE-EQ"]

for symbol in symbols:
    signal = check_signal(symbol)
    if signal:
        print(f"{symbol}: {signal} signal detected")
        result = execute_trade(symbol, signal)
        print(f"Trade executed: {result}")
```

### Strategy 2: RSI Oversold/Overbought

```python
def calculate_rsi(prices, period=14):
    deltas = prices.diff()
    gains = deltas.where(deltas > 0, 0)
    losses = -deltas.where(deltas < 0, 0)
    
    avg_gain = gains.rolling(period).mean()
    avg_loss = losses.rolling(period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def rsi_strategy(symbol):
    response = requests.get(
        "http://127.0.0.1:8001/api/portfolio/history",
        params={"symbol": symbol, "resolution": "D"}
    ).json()
    
    df = pd.DataFrame(response['data'])
    df['RSI'] = calculate_rsi(df['close'])
    
    last_rsi = df['RSI'].iloc[-1]
    
    if last_rsi < 30:  # Oversold
        return "BUY"
    elif last_rsi > 70:  # Overbought
        return "SELL"
    
    return None
```

## 7️⃣ Portfolio Analytics

### Calculate Daily P&L

```python
import requests

def get_portfolio_pnl():
    # Get holdings
    holdings_resp = requests.get(
        "http://127.0.0.1:8001/api/portfolio/holdings"
    ).json()
    
    # Get positions
    positions_resp = requests.get(
        "http://127.0.0.1:8001/api/portfolio/positions"
    ).json()
    
    holdings = holdings_resp['data']
    positions = positions_resp['data']['net']
    
    total_pnl = 0
    daily_pnl = 0
    
    # Holdings P&L (Long-term)
    for holding in holdings:
        total_pnl += holding['pnl']
    
    # Positions P&L (Intraday)
    for position in positions:
        daily_pnl += position['pnl']
    
    return {
        "total_pnl": total_pnl,
        "daily_pnl": daily_pnl,
        "total": total_pnl + daily_pnl
    }

pnl = get_portfolio_pnl()
print(f"Holdings P&L: ₹{pnl['total_pnl']}")
print(f"Today's P&L: ₹{pnl['daily_pnl']}")
print(f"Total P&L: ₹{pnl['total']}")
```

### Risk Analysis

```python
def analyze_risk(symbol):
    response = requests.get(
        "http://127.0.0.1:8001/api/portfolio/history",
        params={"symbol": symbol, "resolution": "D"}
    ).json()
    
    df = pd.DataFrame(response['data'])
    
    # Volatility (standard deviation of returns)
    returns = df['close'].pct_change()
    volatility = returns.std() * 100
    
    # Max drawdown
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative - running_max) / running_max * 100
    max_drawdown = drawdown.min()
    
    return {
        "volatility": volatility,
        "max_drawdown": max_drawdown,
        "daily_volatility": returns.std() * 100
    }

risk = analyze_risk("NSE:SBIN-EQ")
print(f"Volatility: {risk['volatility']:.2f}%")
print(f"Max Drawdown: {risk['max_drawdown']:.2f}%")
```

## 🎯 Best Practices

1. **Always Start Small**: Test strategies with small quantities
2. **Use Stop Losses**: Always set exit strategies
3. **Check Margins**: Ensure sufficient funds before placing orders
4. **Log All Trades**: Keep detailed trading journal
5. **Monitor Risk**: Track portfolio volatility and drawdowns
6. **Diversify**: Don't put all capital in one position
7. **Use Limit Orders**: Avoid slippage with limit orders when possible

## 📚 API Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Trade executed |
| 400 | Bad Request | Check order parameters |
| 401 | Unauthorized | Reauthenticate |
| 500 | Server Error | Check backend logs |

---

**Last Updated**: December 2024
**Version**: 1.0 - Ready for Live Trading
