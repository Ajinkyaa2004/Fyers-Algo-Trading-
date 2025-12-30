# 🎯 Live Trading Dashboard - Quick Reference Card

## 🚀 Start (30 seconds)
```bash
# Windows
start_live_trading.bat

# Mac/Linux  
chmod +x start_live_trading.sh && ./start_live_trading.sh
```

**Then open**: http://127.0.0.1:3000

---

## 📍 3 New Dashboard Pages

### 1️⃣ **💹 Live Trading Desk**
**Path**: Sidebar → Live Trading Desk

**What it does:**
- Shows portfolio value, cash, P&L
- Place buy/sell orders
- Monitor open positions
- Track order history

**Quick Action:**
```
BUY:   Place Buy Order → Enter symbol/qty → Confirm
SELL:  Place Sell Order → Enter symbol/qty → Confirm
```

**Key Metrics:**
| Metric | Example |
|--------|---------|
| Portfolio Value | ₹525,000 |
| Available Cash | ₹450,000 |
| Used Margin | ₹75,000 |
| Total P&L | ₹25,000 |

---

### 2️⃣ **📈 Market Data**
**Path**: Sidebar → Market Data

**What it does:**
- 16 stocks live ticker
- Technical indicators
- Trading signals
- Filter & search

**Quick Action:**
```
FILTER:  Click "Gainers" / "Losers" / "All"
SORT:    Click "Change" / "Symbol" / "Price" / "Volume"
SEARCH:  Type stock name
```

**Key Signals:**
| Signal | RSI | Meaning |
|--------|-----|---------|
| 🟢 BUY | <30 | Oversold, buy |
| 🔴 SELL | >70 | Overbought, sell |
| 🟡 HOLD | 30-70 | Wait |

---

### 3️⃣ **📊 Live Charts**
**Path**: Sidebar → Live Charts

**What it does:**
- Candlestick charts
- Multiple timeframes
- OHLC data
- Real-time updates

**Quick Action:**
```
SELECT:      Click stock button
TIMEFRAME:   Click 1min/5min/15min/1h/1d
CHART TYPE:  Click candlestick/line/ohlc
```

**Reading Charts:**
| Color | Meaning |
|-------|---------|
| 🟢 Green | Close > Open (Up) |
| 🔴 Red | Close < Open (Down) |
| 📊 Volume | Trading activity |

---

## 🎮 Trading Workflow

### **Step 1: Check Price**
```
Live Charts → Select stock → Check current price
OR
Market Data → Search stock → See price & signals
```

### **Step 2: Place Buy**
```
Live Trading Desk
  → Click "Place Buy Order"
  → Symbol: NSE:SBIN-EQ
  → Quantity: 10
  → Stop Loss: 490 (optional)
  → Take Profit: 510 (optional)
  → Confirm
```

### **Step 3: Monitor Position**
```
Live Trading Desk → Active Positions
  → See: 10 @ ₹505
  → Current P&L shows
  → Updates every 5 sec
```

### **Step 4: Exit Trade**
```
Live Trading Desk
  → Click "Place Sell Order"
  → Quantity: 10
  → Confirm
  → See P&L calculated
  → Order history updated
```

---

## 📊 Key Metrics Reference

### **Portfolio**
- **Portfolio Value** = Cash + (Positions × Current Price)
- **P&L** = (Current Price - Avg Buy Price) × Quantity
- **Return %** = P&L / Avg Buy Price × 100

### **Technical Indicators**
- **RSI** = Oversold (<30) / Overbought (>70)
- **MA20** = 20-period moving average (short-term trend)
- **MA50** = 50-period moving average (long-term trend)
- **Volume** = Trading activity (confirmation)

### **Candles**
- **Open** = First price
- **High** = Peak price
- **Low** = Bottom price
- **Close** = Final price

---

## ⚙️ Configuration

### **Set Initial Wallet**
```bash
# Edit: backend/.env
INITIAL_WALLET_BALANCE=1000000
# Then restart backend
```

### **Connect Real Fyers Data**
```bash
# Get token
python get_fyers_token.py

# Edit: backend/.env
FYERS_AUTH_TOKEN=abc123...
FYERS_USER_ID=xyz789...

# Restart backend
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Page won't load | Check backend: `curl http://127.0.0.1:5000/api/live-trading/health` |
| Order failed | Increase wallet: `INITIAL_WALLET_BALANCE=5000000` |
| Charts empty | Try different stock or refresh page |
| Prices not updating | Click "Refresh Data" button |
| Orders not showing | Check backend logs in terminal |

---

## 💡 Pro Tips

### **For Quick Trades**
- Use 5min or 15min charts
- Watch RSI for entry signals
- Set tight stop-loss (1-2%)
- Use take-profit at 2-3% gain

### **For Day Trading**
- Use 15min or 1h charts
- Buy when Price > MA20
- Sell when RSI > 70
- Risk max 1% per trade

### **For Swing Trading**
- Use 1h or 1d charts
- Buy when Price > MA50
- Sell when Price < MA20
- Hold 1-5 days

---

## 📱 Mobile Access

All features work on mobile:
- Responsive design
- Touch-friendly buttons
- Swipeable charts
- Full functionality

---

## 🔗 Important URLs

| Page | URL |
|------|-----|
| Frontend | http://127.0.0.1:3000 |
| Backend | http://127.0.0.1:5000 |
| Health | http://127.0.0.1:5000/api/live-trading/health |

---

## 📋 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F12 | Open dev tools (debug) |
| Ctrl+R | Refresh page |
| Ctrl+Shift+Delete | Clear cache |

---

## 🎯 Common Questions

**Q: How do I start trading?**
A: Buy first → Monitor position → Sell to exit → Check P&L

**Q: Can I use real money?**
A: Yes, after testing with paper trading and setting real token

**Q: What's the minimum trade size?**
A: 1 share (check available cash)

**Q: Can I set alerts?**
A: Yes, use Take Profit & Stop Loss orders

**Q: Is data real-time?**
A: Yes, updates every 2-5 seconds

**Q: Can I trade at night?**
A: No, market closes at 3:30 PM IST

---

## 📚 More Documentation

- **Full Guide**: LIVE_TRADING_DASHBOARD_GUIDE.md
- **User Manual**: LIVE_TRADING_USAGE.md
- **API Docs**: backend/LIVE_TRADING_IMPLEMENTATION.md
- **Deployment**: backend/DEPLOYMENT_CHECKLIST.md

---

## ✅ Before Going Live

- [ ] Test buy/sell with small amounts
- [ ] Monitor positions for 1 hour
- [ ] Check P&L calculations
- [ ] Verify order execution
- [ ] Review all 3 dashboards
- [ ] Check market data accuracy
- [ ] Test on mobile
- [ ] Read full guides

---

## 🎊 Quick Start Summary

```bash
1. start_live_trading.bat          # or .sh
2. Wait 5 seconds
3. Open http://127.0.0.1:3000
4. Login
5. Click "Live Trading Desk"
6. Click "Place Buy Order"
7. Fill form → Confirm
8. See position in Active Positions
9. Go to "Market Data" → Find price
10. Go back → Click "Place Sell Order"
11. Confirm → See P&L
12. Done! 🎉
```

---

**Version**: 1.0 | **Date**: Dec 29, 2025 | **Status**: ✅ Ready
