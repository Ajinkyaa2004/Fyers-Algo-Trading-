# Smart Algo Trade - Fast Start Guide

## ⚡ 30-Second Setup

```bash
# Terminal 1: Backend
cd smart-algo-trade/backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001

# Terminal 2: Frontend
cd smart-algo-trade/frontend
npm run dev

# Open in browser
http://127.0.0.1:3000
```

---

## ✅ System Status (LIVE NOW)

- **Backend**: http://127.0.0.1:8001 [✅ RUNNING]
- **Frontend**: http://127.0.0.1:3000 [✅ RUNNING]
- **Live Quotes**: [✅ ACTIVE]
- **Historical Data**: 30+ days [✅ READY]
- **Trading**: [✅ ENABLED]
- **Mock Data**: [✅ ENABLED]

---

## 📊 What You Can Do Right Now

### View Market Data
```bash
curl "http://127.0.0.1:8001/api/portfolio/quotes?symbols=NSE:SBIN-EQ,NSE:INFY-EQ"
```

### Place Order
Navigate to: **Live Trading** → Select Stock → Choose BUY/SELL → Place Order

### View Holdings
Navigate to: **Portfolio** → See all holdings with P&L

### Analyze Charts
Navigate to: **Market Analysis** → Select Symbol → View Historical Data

---

## 🎯 Current Portfolio Demo

```
Total Margin: Rs 750,000
Available: Rs 500,000

Holdings:
- SBIN: 100 shares @ Rs550 | P&L: +Rs1,025
- RELIANCE: 25 shares @ Rs3150 | P&L: +Rs1,262
- INFY: 50 shares @ Rs1780 | P&L: +Rs1,538

Total P&L: Rs 3,825
```

---

## 🔑 Top 5 Things to Know

1. **Mock Data Enabled** - Use demo funds to learn
2. **Real API Ready** - Add Fyers credentials when ready
3. **30 Days History** - Full candlestick data available
4. **All Orders Work** - Place, modify, cancel orders
5. **Charts Included** - Technical indicators built-in

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [LIVE_TRADING_SETUP.md](LIVE_TRADING_SETUP.md) | Complete setup & configuration |
| [ADVANCED_TRADING_GUIDE.md](ADVANCED_TRADING_GUIDE.md) | Trading strategies & examples |
| [LIVE_TRADING_READY.md](LIVE_TRADING_READY.md) | Full feature overview |
| [API_REFERENCE.md](API_REFERENCE.md) | API documentation |

---

## 🚀 Next: Enable Real Trading

1. Get credentials: https://www.fyersec.com
2. Update `backend/.env`:
   ```env
   FYERS_CLIENT_ID=your_id
   FYERS_SECRET_KEY=your_secret
   ```
3. Set in `backend/app/api/data.py`:
   ```python
   USE_MOCK_DATA = False
   ```
4. Restart backend
5. Start live trading!

---

## 🎮 Navigation

- **Dashboard**: Market overview
- **Live Trading**: Place orders
- **Market Analysis**: Charts & indicators
- **Portfolio**: Holdings & P&L
- **Orders**: Order management

---

## 💡 Pro Tips

✅ Start with small orders
✅ Use limit orders to avoid slippage
✅ Check margin before trading
✅ Monitor positions closely
✅ Diversify portfolio
✅ Use technical indicators

---

**Status**: Production Ready 🚀
**Version**: 2.0
