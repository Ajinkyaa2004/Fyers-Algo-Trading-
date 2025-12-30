# Quick Start Guide - Smart Algo Trade

## ⚡ 5-Minute Setup

### 1. Backend Setup
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```
✅ Backend running on `http://127.0.0.1:8001`

### 2. Frontend Setup
```bash
# From project root
npm run dev
```
✅ Frontend running on `http://127.0.0.1:3000`

---

## 🔐 Login Flow

1. Navigate to `http://127.0.0.1:3000`
2. Click **"Login with Fyers"**
3. Enter your Fyers credentials
4. You'll be redirected back to the app
5. Dashboard will display automatically

---

## 📊 Available Pages

### Dashboard
- Portfolio overview
- Quick stats
- Navigation to other sections

### My Profile
- User account details
- Portfolio summary
- Account limits

### Portfolio
- Holdings with P&L
- Open positions
- Order history
- Margins & funds

### Live Market
- Symbol search
- Real-time quotes
- Market depth (bid/ask)
- Price history (daily/weekly/monthly)

### Strategies
- Risk profile setup
- Strategy selection
- **Live Trading Panel**
  - Place buy/sell orders
  - Limit/market orders
  - INTRADAY/DELIVERY products
  - Order history

---

## 💰 Trading (Live Trading Panel)

### Step 1: Enter Symbol
```
NSE:SBIN-EQ    (Format: EXCHANGE:SYMBOL)
```

### Step 2: Set Quantity
```
Qty: 1
```

### Step 3: Choose Order Type
```
BUY  or  SELL
```

### Step 4: Select Order Type
```
MARKET  or  LIMIT
```

### Step 5: Set Other Parameters
```
Product: INTRADAY / DELIVERY / MTF
Validity: DAY / IOC
Limit Price: (Only for LIMIT orders)
```

### Step 6: Place Order
```
Click "Place BUY/SELL Order"
```

---

## 📈 Market Data Features

### Search Symbol
- Enter symbol (e.g., "SBIN")
- Get matching results
- Click to select

### View Quotes
- Real-time LTP (Last Traded Price)
- Bid/Ask prices
- Last traded quantity & time
- Price change percentage

### Market Depth
- Top 5 bid levels
- Top 5 ask levels
- Quantity at each level

### Price History
- Daily/Weekly/Monthly candles
- OHLCV data
- Scrollable table
- Last 30+ days

---

## 🔌 API Testing

### Test Quotes
```bash
curl "http://127.0.0.1:8001/api/portfolio/quotes?symbols=NSE:SBIN-EQ"
```

### Test Place Order
```bash
curl -X POST http://127.0.0.1:8001/api/portfolio/place-order \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NSE:SBIN-EQ",
    "qty": 1,
    "type": 2,
    "side": 1,
    "productType": "INTRADAY",
    "limitPrice": 0,
    "stopPrice": 0,
    "validity": "DAY",
    "disclosedQty": 0,
    "offlineOrder": false
  }'
```

### Test Depth
```bash
curl "http://127.0.0.1:8001/api/portfolio/depth?symbol=NSE:SBIN-EQ"
```

### Test History
```bash
curl "http://127.0.0.1:8001/api/portfolio/history?symbol=NSE:SBIN-EQ&resolution=D"
```

---

## 🛠️ Troubleshooting

### Backend Won't Start
```bash
# Check if port 8001 is in use
netstat -ano | findstr :8001

# Kill process
taskkill /PID <PID> /F

# Restart
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# Restart
npm run dev
```

### Login Issues
- Check `.env` file has valid credentials
- Ensure internet connection
- Check Fyers API status
- Try logging out and in again

### Order Placement Issues
- Verify symbol exists (use search)
- Check available margin
- Ensure market is open (9:15-15:30 IST)
- Check order quantity is valid

---

## 📝 Order Parameters

### Type
- `1` = Limit Order (specify price)
- `2` = Market Order (best available price)

### Side
- `1` = BUY
- `-1` = SELL

### Product Type
- `INTRADAY` - Close by EOD (intraday position)
- `DELIVERY` - Multi-day holding
- `MTF` - Margin for Today

### Validity
- `DAY` - Valid for one trading day
- `IOC` - Immediate or Cancel

---

## 🎯 Example Order Flow

1. **Search Symbol**
   - Go to Live Market
   - Search "SBIN"
   - Note the symbol: `NSE:SBIN-EQ`

2. **Check Quote**
   - View current price in Market Data
   - Check bid/ask spread

3. **Place Order**
   - Go to Strategies → Live Trading
   - Enter `NSE:SBIN-EQ`
   - Enter quantity `1`
   - Select `BUY`
   - Select `MARKET`
   - Click "Place BUY Order"

4. **View Order Status**
   - Order appears in Recent Orders
   - Check Portfolio → Orders for confirmation

---

## 📊 Dashboard Components

### Portfolio Summary
- Total equity
- Used margin
- Available margin
- P&L (today + total)

### Holdings Widget
- Stock name
- Quantity held
- Average cost
- Current price
- P&L per stock

### Open Positions
- Intraday trades
- Net positions
- Buy/Sell breakdown

### Recent Orders
- Symbol
- Type (Buy/Sell)
- Quantity
- Status (Pending/Complete/Cancelled)
- Order ID

---

## 🔄 Session Management

### Auto-Save
- Session persists in `backend/data/fyers_session.json`
- Automatic logout on browser close (optional)
- Re-login required for new browser window

### Logout
- Click user icon → Logout
- Session cleared from backend
- Redirects to login page

---

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

All features work on mobile with touch-optimized controls.

---

## 🚀 Next Steps

1. ✅ **Completed:** Market data, quotes, depth, history, symbol search
2. ✅ **Completed:** Order placement, modification, cancellation
3. ⏳ **Optional:** Live WebSocket streams
4. ⏳ **Optional:** Advanced charting
5. ⏳ **Optional:** Technical indicators
6. ⏳ **Optional:** Automated strategies

---

## 📞 Support

For issues or feature requests:
1. Check API_REFERENCE.md for endpoint details
2. Review INTEGRATION_SUMMARY.md for architecture
3. Check backend logs: `backend/logs/`
4. Check browser console for frontend errors

---

**Last Updated:** December 25, 2025
**Version:** 3.0.1
