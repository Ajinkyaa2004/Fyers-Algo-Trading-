# Live Trading Setup & Usage Guide

## 🎯 Overview

This guide explains how to set up and use the Smart Algo Trade live trading system with real-time market data, historical analysis, and order execution capabilities.

## ✅ Current Status

- ✅ **Backend Server**: Running on http://127.0.0.1:8001
- ✅ **Frontend Application**: Running on http://127.0.0.1:3000
- ✅ **Market Data**: Live quotes and historical data available
- ✅ **Holdings & Positions**: Real-time portfolio data
- ✅ **Order Management**: Place, modify, and cancel orders
- ✅ **Demo Data**: Mock data enabled for testing without live credentials

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd c:\Users\yash\Downloads\smart-algo-trade\smart-algo-trade\backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

### 2. Start the Frontend Application

In another terminal:

```bash
cd c:\Users\yash\Downloads\smart-algo-trade\smart-algo-trade\frontend
npm run dev
```

The app will open at **http://127.0.0.1:3000**

### 3. Access Live Trading Features

Navigate to:
- **Dashboard**: Overview of portfolio and market indices
- **Live Trading**: Place and manage orders
- **Market Analysis**: View historical data and technical indicators
- **Portfolio**: Holdings, positions, and P&L tracking

## 📊 Available Endpoints

### Market Data

#### Get Live Quotes
```bash
GET /api/portfolio/quotes?symbols=NSE:SBIN-EQ,NSE:RELIANCE-EQ
```

Response:
```json
{
  "status": "success",
  "data": [
    {
      "symbol": "NSE:SBIN-EQ",
      "ltp": 550.25,
      "change_percent": 0.5,
      "high_price": 555.0,
      "low_price": 545.0,
      "open_price": 548.0,
      "prev_close_price": 547.0,
      "volume": 2500000,
      "bid": 550.20,
      "ask": 550.30,
      "bid_size": 50000,
      "ask_size": 75000
    }
  ]
}
```

#### Get Detailed Quotes
```bash
GET /api/portfolio/quotes-detailed?symbols=NSE:SBIN-EQ
```

Returns comprehensive quote data with bid/ask spread, LTP, and volume information.

#### Get Historical Candlestick Data
```bash
GET /api/portfolio/history?symbol=NSE:SBIN-EQ&resolution=D
```

Supported resolutions:
- `D` = Daily (default)
- `W` = Weekly
- `M` = Monthly
- `1` = 1-minute
- `5` = 5-minute
- `15` = 15-minute
- `60` = 1-hour

Response:
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": 1766912363,
      "open": 545.00,
      "high": 555.25,
      "low": 540.50,
      "close": 551.75,
      "volume": 3200000
    }
  ]
}
```

#### Get Market Depth (Order Book)
```bash
GET /api/portfolio/depth?symbol=NSE:SBIN-EQ
```

Returns bid and ask levels with quantities.

### Portfolio Data

#### Get Holdings
```bash
GET /api/portfolio/holdings
```

Returns all stock holdings with quantity, average price, current price, and P&L.

#### Get Positions
```bash
GET /api/portfolio/positions
```

Returns intraday (MIS) positions with net and day breakdowns.

#### Get Account Margins
```bash
GET /api/portfolio/margins
```

Returns available margin, used margin, and total margin information.

#### Get Order History
```bash
GET /api/portfolio/orders
```

Returns all executed, pending, and cancelled orders.

#### Get User Profile
```bash
GET /api/portfolio/profile
```

Returns user information and account details.

### Order Management

#### Place New Order
```bash
POST /api/portfolio/place-order

{
  "symbol": "NSE:SBIN-EQ",
  "qty": 10,
  "type": "LIMIT",
  "side": "BUY",
  "productType": "CNC",
  "limitPrice": 550.00,
  "validity": "DAY",
  "disclosedQty": 10,
  "offlineOrder": false
}
```

#### Modify Existing Order
```bash
PUT /api/portfolio/modify-order

{
  "id": "order_id",
  "type": "LIMIT",
  "limitPrice": 552.00,
  "qty": 10
}
```

#### Cancel Order
```bash
DELETE /api/portfolio/cancel-order/{order_id}
```

## 🔐 Using Real Fyers Credentials

### Step 1: Get Fyers API Credentials

1. Sign up at [Fyers Broker](https://www.fyersec.com)
2. Navigate to API Settings in your account
3. Create an App and get:
   - `Client ID`
   - `Client Secret`
   - `Redirect URI` (set to `http://127.0.0.1:8001/api/auth/callback`)

### Step 2: Configure Credentials

Update `.env` file in `backend/`:

```env
FYERS_CLIENT_ID=YOUR_CLIENT_ID
FYERS_SECRET_KEY=YOUR_CLIENT_SECRET
FYERS_REDIRECT_URI=http://127.0.0.1:8001/api/auth/callback
```

### Step 3: Enable Live Trading

In `backend/app/api/data.py`, change:

```python
USE_MOCK_DATA = False  # Enable live API calls
```

### Step 4: Authenticate

Navigate to `/login` on the frontend to complete OAuth2 authentication with Fyers.

## 📈 Using Live Market Data on Frontend

### 1. Market Indices (Dashboard)

The dashboard automatically fetches and displays:
- NIFTY 50
- NIFTY BANK
- NIFTY IT

Updates in real-time as market data arrives.

### 2. Historical Charts

In Market Analysis section:
1. Select a symbol (e.g., NSE:SBIN-EQ)
2. Choose timeframe (1min, 5min, 15min, hourly, daily, weekly, monthly)
3. View candlestick chart with OHLC data
4. Add technical indicators (SMA, RSI, MACD)

### 3. Portfolio Analysis

View:
- **Holdings**: Long-term positions with daily P&L
- **Positions**: Intraday trades with unrealized P&L
- **Orders**: Order status and execution details

## 🎮 Trading Operations

### Place Buy Order

1. Go to **Live Trading** tab
2. Enter symbol (e.g., NSE:SBIN-EQ)
3. Select **BUY** and quantity
4. Choose order type: **LIMIT** or **MARKET**
5. For LIMIT orders, enter price
6. Click **PLACE ORDER**

### Modify Existing Order

1. View pending order in **Orders** list
2. Click **MODIFY**
3. Update price/quantity
4. Click **CONFIRM**

### Cancel Order

1. Find order in **Orders** list
2. Click **CANCEL**
3. Order will be cancelled immediately

## 📊 Technical Analysis Features

### Available Indicators

- **SMA** (Simple Moving Average): 20, 50, 200 day
- **RSI** (Relative Strength Index): 14 period
- **MACD** (Moving Average Convergence Divergence)
- **BOLLINGER BANDS**: 20-day with 2 standard deviations
- **Volume Profile**: Real-time volume analysis

### Using Indicators

1. Open chart in Market Analysis
2. Click **Add Indicator**
3. Select indicator type
4. Adjust parameters if needed
5. Indicator plots on chart automatically

## 🔄 Real-Time Data Streaming

The system uses WebSocket connections for:
- Live price updates
- Order status changes
- Position updates
- Margin changes

Data refreshes automatically without page reload.

## 📋 Symbol Reference

Popular NSE symbols:

| Symbol | Company |
|--------|---------|
| NSE:SBIN-EQ | State Bank of India |
| NSE:RELIANCE-EQ | Reliance Industries |
| NSE:TCS-EQ | Tata Consultancy Services |
| NSE:INFY-EQ | Infosys |
| NSE:HDFCBANK-EQ | HDFC Bank |
| NSE:WIPRO-EQ | Wipro |
| NSE:ITC-EQ | ITC Limited |

Search symbols using the symbol search feature in the app.

## ⚙️ Configuration Options

### Backend Configuration

**File**: `backend/.env`

```env
# Fyers API
FYERS_CLIENT_ID=your_client_id
FYERS_SECRET_KEY=your_secret_key
FYERS_REDIRECT_URI=http://127.0.0.1:8001/api/auth/callback

# Server
PYTHONUNBUFFERED=1

# Database (Optional)
DATABASE_URL=sqlite:///smart_algo_trade.db
```

### Frontend Configuration

**File**: `frontend/.env.local` (create if needed)

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

## 🐛 Troubleshooting

### Market Data Showing "Loading..."

1. Check backend is running: `http://127.0.0.1:8001/api/portfolio/quotes?symbols=NSE:SBIN-EQ`
2. Verify mock data is enabled: `USE_MOCK_DATA = True` in `data.py`
3. Check browser console for errors

### Orders Not Placing

1. Verify authentication is complete
2. Check order parameters are valid
3. Ensure sufficient margin in account
4. Check backend logs for API errors

### Historical Data Not Loading

1. Verify symbol format (NSE:SBIN-EQ)
2. Check resolution parameter is valid (D, W, M, 1, 5, 15, 60)
3. Look at network tab for API response

### Connection Refused Errors

1. Ensure backend server is running on port 8001
2. Check no firewall is blocking connections
3. Restart server if needed

## 📚 Additional Resources

- [Fyers API Documentation](https://api.fyersec.com/)
- [Project Repository](../README.md)
- [API Reference](../API_REFERENCE.md)
- [Technical Analysis Guide](../INDICATORS_USAGE_GUIDE.md)

## 🎯 Next Steps

1. ✅ Set up and run the application
2. ✅ Test with mock data
3. 📋 Get Fyers API credentials
4. 🔐 Configure real credentials
5. 📈 Start live trading
6. 💹 Monitor P&L and positions
7. 📊 Analyze performance

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review browser console (F12)
3. Check backend API responses using curl or Postman
4. Review configuration in `.env` file

---

**Last Updated**: December 2024
**Version**: 2.0 - Live Trading Ready
