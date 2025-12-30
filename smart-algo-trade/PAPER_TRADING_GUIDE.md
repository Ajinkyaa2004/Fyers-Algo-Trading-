# Paper Trading (Demo Mode) - Complete Guide

## What is Paper Trading?

Paper Trading allows you to test trading strategies with **virtual money** while the live market is open. You can:
- ✅ Place buy/sell orders without real capital
- ✅ Track performance and P&L
- ✅ Test order placement logic
- ✅ Learn trading mechanics risk-free
- ✅ Build confidence before trading with real money

**Key Feature: No real money is spent or earned - 100% SAFE FOR TESTING**

---

## Where to Access Paper Trading

### 1. **Order Placement Form** 
   - Location: Dashboard → "Place New Order" section
   - Toggle: Switch between Paper Trading and Real Trading
   - Default: **Paper Trading ON** (safe by default)

### 2. **Paper Trading Dashboard**
   - Location: Dashboard → "Paper Trading Simulator" section
   - Shows: Portfolio stats, open positions, closed trades, P&L

---

## Features

### Portfolio Management
- **Initial Capital**: ₹100,000 (virtual money)
- **Current Value**: Total account value (cash + positions)
- **Cash Available**: Remaining buying power
- **P&L Tracking**: Real-time profit/loss (Realized + Unrealized)
- **Return %**: Percentage return on initial capital

### Trading
- **Place Orders**: Buy/Sell any symbol with virtual money
- **Order Types**: LIMIT or MARKET
- **Position Tracking**: See all open positions with entry price and current P&L
- **Round-trip Tracking**: Closed trades show entry price, exit price, and return %

### Metrics
| Metric | Description |
|--------|-------------|
| **Initial Capital** | Starting virtual money (₹100,000) |
| **Current Value** | Cash + Positions Value |
| **Cash** | Available buying power |
| **Positions Value** | Total value of open positions |
| **Realized P&L** | Profit/Loss from closed trades |
| **Unrealized P&L** | Current profit/loss on open positions |
| **Total P&L** | Realized + Unrealized P&L |
| **Return %** | Percentage gain/loss on capital |

---

## How to Use

### Step 1: Place an Order
1. Go to Dashboard
2. Find "Place New Order" section
3. **Enable Paper Trading Toggle** (should be yellow/highlighted)
4. Fill in order details:
   - Symbol: e.g., `NSE:INFY`, `NSE:TCS`
   - Quantity: Number of shares
   - Price: Entry price
   - Side: BUY or SELL
   - Type: LIMIT or MARKET

5. Click "Place Order"
6. Success message shows order details and remaining cash

### Step 2: Monitor Portfolio
1. Scroll down to "Paper Trading Simulator" section
2. View:
   - Portfolio summary (Capital, Value, P&L)
   - Open positions with live P&L
   - Closed trades with return percentage

### Step 3: Close Positions
1. To sell/close a position, create a SELL order
2. System will check if you have the quantity
3. Closed trade appears in "Closed Trades" table
4. P&L is calculated and added to realized P&L

### Step 4: Reset Portfolio
- Click "Reset" button in Paper Trading Simulator
- Confirms before deleting all trades
- Restarts with fresh ₹100,000 virtual capital

---

## Example Trade Flow

### Buy Order
```
Symbol: NSE:INFY
Quantity: 10
Price: ₹1,500
Side: BUY

Result:
- ₹15,000 deducted from cash
- Position created: 10 shares @ ₹1,500 avg
- Cash remaining: ₹85,000
```

### Sell Order (Closing Position)
```
Symbol: NSE:INFY
Quantity: 10
Price: ₹1,600
Side: SELL

Result:
- Position closed
- P&L = (₹1,600 - ₹1,500) × 10 = ₹1,000 profit
- Cash returned: ₹85,000 + ₹16,000 = ₹101,000
- Trade added to "Closed Trades"
```

### Partial Close
```
If you have 10 shares @ ₹1,500 and SELL only 5:

Result:
- 5 shares remain open @ ₹1,500
- Partial P&L calculated on sold units
- Cash added from sale
```

---

## Real Trading vs Paper Trading

### Paper Trading (Default)
```
✅ Virtual money only
✅ No real capital at risk
✅ Orders execute instantly
✅ Perfect for testing
✅ Full feature testing
✅ Risk-free learning
```

### Real Trading
```
⚠️ USES REAL MONEY
⚠️ Real capital at risk
⚠️ Market conditions apply
⚠️ Actual commissions charged
⚠️ Only enable when ready!
```

**To Switch to Real Trading:**
1. Open "Place New Order" form
2. Click the toggle to switch OFF paper trading
3. Confirm you want to use real money
4. Toggle will turn red and show "⚠️ REAL TRADING"

---

## Backend API Endpoints

All requests use:
```
Base URL: http://127.0.0.1:8001/api/paper-trading
```

### Place Order
```
POST /place-order
Parameters:
- symbol: string (e.g., "NSE:INFY")
- quantity: int
- price: float
- side: "BUY" or "SELL"
- order_type: "LIMIT" or "MARKET"

Response:
{
  "success": true,
  "message": "Order executed successfully",
  "order": {...},
  "cash_remaining": 85000
}
```

### Get Portfolio
```
GET /portfolio

Response:
{
  "status": "success",
  "data": {
    "initial_capital": 100000,
    "current_value": 101000,
    "cash": 85000,
    "positions_value": 16000,
    "realized_pnl": 1000,
    "unrealized_pnl": 0,
    "total_pnl": 1000,
    "return_percent": 1.0,
    "positions": {...},
    "open_positions_count": 1,
    "closed_trades": 1
  }
}
```

### Get Orders
```
GET /orders?limit=50

Response: List of all executed orders
```

### Get Trades
```
GET /trades?limit=50

Response: List of closed round-trip trades
```

### Reset Portfolio
```
POST /reset

Response:
{
  "success": true,
  "message": "Paper trading portfolio reset",
  "portfolio": {...}
}
```

---

## Important Notes

1. **Paper Trading Data**: Stored locally in `data/paper_trading.json`
2. **No Commissions**: Virtual trading has no commission fees
3. **Market Hours**: Can trade anytime (no market hours restriction for paper trading)
4. **Symbol Format**: Must use Fyers format (e.g., `NSE:INFY`, `NSE:TCS`)
5. **Instant Execution**: Orders execute immediately at specified price
6. **No Slippage**: Paper trading doesn't simulate real market conditions like slippage

---

## Testing Strategy

### 1. Test Order Placement
- Buy at various price levels
- Sell to close positions
- Check P&L calculations

### 2. Test Multiple Positions
- Open multiple positions simultaneously
- Monitor total portfolio value
- Check cash management

### 3. Test Market Scenarios
- Buy and hold strategy
- Day trading (multiple buys/sells)
- Risk management (partial closes)

### 4. Validate Portfolio Stats
- Confirm P&L calculations
- Check average price calculations
- Verify position tracking

---

## Switching to Real Trading

Only proceed when:
- ✅ Paper trading shows consistent profits
- ✅ You understand the market
- ✅ Risk management is in place
- ✅ You're ready for real capital at risk

**To Enable Real Trading:**
1. In Order Placement form, click red toggle
2. Toggle will show "⚠️ REAL TRADING"
3. Orders will use real Fyers API account
4. Your actual trading account will be debited/credited

---

## Troubleshooting

### "Insufficient cash" Error
- Available cash: See in portfolio summary
- Reduce order size or buy fewer shares
- Close some positions to free up cash

### "No position to sell" Error
- You haven't bought that symbol yet
- Open positions list shows what you own
- Buy first, then sell to close

### Orders Not Executing
- Check symbol format (must be `NSE:SYMBOL` format)
- Verify quantity and price are positive numbers
- Check if paper trading toggle is enabled

### P&L Not Updating
- Click "Refresh" button in Paper Trading Simulator
- Portfolio updates every 5 seconds automatically
- Closed trades show in "Closed Trades" table

---

## Data Persistence

Paper trading data is saved to: `data/paper_trading.json`

Contains:
- All orders placed
- Current positions
- Closed trades history
- Current cash and portfolio value
- P&L calculations

If you restart the app, your paper trading history is preserved!

---

## Tips for Effective Testing

1. **Start Small**: Buy 1-2 shares to test logic
2. **Track Performance**: Monitor P&L percentage
3. **Log Trades**: Write down your strategy and results
4. **Test Error Cases**: Try invalid orders to see error handling
5. **Test Market Times**: Place orders at different times
6. **Multiple Symbols**: Test with various stock symbols
7. **Compare Strategies**: Try different entry/exit logic

Ready to paper trade? Go to Dashboard and find "Place New Order" section! 🚀
