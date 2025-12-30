# Live Trading & Paper Trading Mode - Complete Guide

## Overview

The Smart Algo Trade platform now has a **prominent trading mode selector** that allows you to seamlessly switch between:

1. **Paper Trading (Demo Mode)** - Trade with virtual money (₹10,000 demo funds)
2. **Live Trading** - Trade with real money from your Fyers account

---

## Where to Find the Trading Mode Selector

### 🎯 Main Trading Mode Banner (Top of Dashboard)
- **Location:** Top of every page when logged in
- **Visibility:** Always visible and sticky
- **Content:** Current trading mode, portfolio value, quick stats

### 📊 Order Placement Component
- **Location:** Dashboard → "Place Order" section
- **Visibility:** Shows current mode (DEMO or LIVE)
- **Features:** Visual indicator with color coding

### 🛠️ Trading Component
- **Location:** Live Trading tab
- **Visibility:** Mode badge in the order form header

---

## How to Switch Between Modes

### Step 1: Locate the Trading Mode Selector
On the top banner, look for the trading mode toggle button.

### Step 2: Current Mode Display
```
Paper Trading (Active):
├─ 🟨 Yellow button labeled "PAPER TRADING (DEMO)"
├─ 💰 "Trading with Demo Money (₹10,000)"
└─ Safe Testing Mode

Real Trading (Active):
├─ 🔴 Red button labeled "⚠️ LIVE TRADING (REAL MONEY)"
├─ ⚠️ "Trading with REAL Money"
└─ Real Capital at Risk
```

### Step 3: Toggle the Switch
Click the large toggle button:
- Left side: **DEMO** (Paper Trading)
- Right side: **REAL** (Live Trading)

### Step 4: Confirm Your Choice
- For Paper Trading: Immediate switch (safe)
- For Live Trading: Warning banner appears
  ```
  ⚠️ WARNING - LIVE TRADING ACTIVE
  You are trading with REAL money. All executed orders 
  will affect your actual trading account and real capital 
  will be debited/credited. Proceed with caution!
  ```

---

## Paper Trading (Demo Mode) - ✅ Recommended for Learning

### What is Paper Trading?
- Trade with **virtual money** (₹10,000 initial capital)
- No real capital at risk
- Orders execute instantly
- Perfect for testing strategies
- Learn market mechanics safely

### Features
✅ Virtual cash: ₹10,000 demo funds
✅ Real order execution logic (simulated)
✅ P&L tracking
✅ Position management
✅ Complete order history
✅ Zero financial risk

### How to Place a Paper Trade

1. **Ensure Paper Trading is ON** (yellow indicator)
2. **Fill Order Details:**
   - Symbol: e.g., `NSE:SBIN-EQ`
   - Quantity: Number of shares
   - Price: Entry/exit price
   - Side: BUY or SELL
   - Order Type: MARKET or LIMIT
3. **Click "Place Order"**
4. **Order executes immediately** (demo)
5. **See position in portfolio**
6. **View P&L in real-time**

### Example Trade Sequence

```
Initial Capital: ₹10,000
Cash Available: ₹10,000

Trade 1: BUY 10 SBIN @ ₹550
├─ Cost: ₹5,500
├─ Cash Remaining: ₹4,500
└─ Position: 10 SBIN @ ₹550

Trade 2: SELL 10 SBIN @ ₹560
├─ Proceeds: ₹5,600
├─ Profit: ₹100 (1.82%)
├─ Cash After: ₹5,100 + ₹4,500 = ₹9,600
└─ Closed Trade ✓

Trade 3: BUY 5 INFY @ ₹1,500
├─ Cost: ₹7,500
├─ Insufficient! (need ₹7,500, have ₹4,600)
└─ Trade REJECTED - Not enough cash
```

### Where to Monitor Paper Trades
- **Dashboard** → "Paper Trading Simulator" section
- View:
  - Portfolio summary
  - Open positions
  - Closed trades
  - P&L and returns

---

## Live Trading (Real Money) - ⚠️ For Experienced Traders

### Prerequisites
- ✅ Paper trading showing consistent profits
- ✅ Understanding of market risks
- ✅ Risk management strategy in place
- ✅ Fyers account with funded balance

### Risks
⚠️ REAL capital will be debited/credited
⚠️ Market orders execute at market price
⚠️ Losses are PERMANENT
⚠️ Brokerage fees apply
⚠️ Market volatility affects execution

### How to Enable Live Trading

1. **Click the Trading Mode Toggle**
2. **Warning banner appears:**
   ```
   ⚠️ LIVE TRADING ACTIVE
   You are trading with REAL money. All executed orders 
   will affect your actual trading account and real capital 
   will be debited/credited. Proceed with caution!
   ```
3. **Switch to Live:**
   - Toggle button changes to RED
   - Indicator shows "⚠️ LIVE TRADING (REAL MONEY)"
   - Orders will use your Fyers account

### How to Place a Live Trade

1. **Verify Live Mode is ACTIVE** (red indicator)
2. **Fill Order Details:**
   - Same as Paper Trading
   - But orders will hit real market
3. **Click "Place Order"**
4. **Order executes on Fyers API**
5. **Real money is debited/credited**

### Important: Account Requirements

**For Live Trading to work, ensure:**
- ✅ Fyers credentials configured in `.env`
- ✅ Account is funded
- ✅ Market is open (9:15 AM - 3:30 PM IST, Weekdays)
- ✅ You have buying power for the order

---

## API Endpoints Used

### Paper Trading Endpoints
```
POST   /api/paper-trading/place-order
       └─ Place order with demo money

GET    /api/paper-trading/portfolio
       └─ Get demo account portfolio

GET    /api/paper-trading/orders
       └─ Get demo trading orders

GET    /api/paper-trading/trades
       └─ Get completed demo trades
```

### Live Trading Endpoints
```
POST   /api/portfolio/place-order
       └─ Place order with real money (Fyers)

GET    /api/portfolio/holdings
       └─ Get real holdings

GET    /api/portfolio/positions
       └─ Get real positions

POST   /api/portfolio/modify-order
       └─ Modify real orders
```

---

## Visual Indicators

### Paper Trading Mode
```
┌─────────────────────────────────────────────────────┐
│  🟨 PAPER TRADING (DEMO)  Safe Testing Mode         │
│  💰 Trading with Demo Money (₹10,000)              │
│  No real capital at risk                            │
└─────────────────────────────────────────────────────┘
```

### Live Trading Mode
```
┌─────────────────────────────────────────────────────┐
│  🔴 ⚠️ LIVE TRADING (REAL MONEY)  Real Capital Risk│
│  ⚠️ Trading with REAL Money                         │
│  Real capital WILL be charged                       │
│                                                     │
│  ⚠️ WARNING - LIVE TRADING ACTIVE                  │
│  You are trading with REAL money. All executed     │
│  orders will affect your actual trading account    │
│  and real capital will be debited/credited.        │
│  Proceed with caution!                             │
└─────────────────────────────────────────────────────┘
```

---

## Best Practices

### ✅ DO
- ✅ Start with Paper Trading
- ✅ Test strategies thoroughly
- ✅ Use stop losses on live trades
- ✅ Trade during market hours
- ✅ Monitor positions in real-time
- ✅ Keep paper trading as backup
- ✅ Use position sizing wisely

### ❌ DON'T
- ❌ Jump to Live Trading immediately
- ❌ Risk more than you can afford
- ❌ Trade without testing first
- ❌ Ignore risk management
- ❌ Trade during off-market hours
- ❌ Place orders without confirmation
- ❌ Trade with 100% of capital

---

## Troubleshooting

### Issue: Can't Switch to Paper Trading
**Solution:**
- Check if you're logged in
- Reload the page
- Clear browser cache
- Check localStorage settings

### Issue: Orders Not Executing in Live Mode
**Solution:**
- Verify Fyers credentials in .env
- Check if market is open
- Confirm account has sufficient funds
- Check order format (symbol must be correct)
- See console for detailed error

### Issue: Demo Money Not Updated
**Solution:**
- Refresh the page
- Check Paper Trading Simulator section
- Clear localStorage: `localStorage.clear()`
- Reload dashboard

### Issue: Mode Resets After Reload
**Solution:**
- Mode is saved to localStorage
- Check browser console for errors
- Clear browser cache and reload
- Check if cookies are enabled

---

## Data Persistence

### Paper Trading Data
- Stored in: `backend/data/paper_trading.json`
- Persists across sessions
- Can be reset via "Reset Portfolio" button

### Trading Mode Preference
- Stored in: Browser localStorage
- Key: `tradingMode`
- Values: `PAPER` or `LIVE`
- Persists across sessions

### Live Trading Data
- Stored in: Fyers account
- Real-time updates
- Syncs with broker

---

## Security Notes

### Paper Trading
- Safe to use any symbol
- No real money involved
- Reset portfolio anytime

### Live Trading
- Requires Fyers authentication
- Sensitive credentials in .env
- Real capital at risk
- Orders are PERMANENT once executed
- Cannot be undone (except by counter-trade)

---

## Examples

### Paper Trading Example
```
Mode: DEMO (Paper Trading)
Initial: ₹10,000

Order 1: BUY 20 SBIN @ ₹550
└─ Executed ✓ (Cash: ₹9,000)

Order 2: BUY 10 TCS @ ₹3,500
└─ Executed ✓ (Cash: ₹5,500)

Order 3: SELL 20 SBIN @ ₹560
└─ Executed ✓ (Profit: ₹200, Cash: ₹16,700)

Portfolio:
├─ Holdings: 10 TCS
├─ Realized P&L: ₹200
├─ Open P&L: ₹500
└─ Total Value: ₹17,200
```

### Live Trading Example
```
Mode: LIVE (Real Money)
Account: ₹500,000

Order 1: BUY 10 SBIN @ ₹550
└─ Executed ✓ (Debit: ₹5,500)

Order 2: BUY 5 INFY @ ₹1,500
└─ Executed ✓ (Debit: ₹7,500)

Order 3: SELL 10 SBIN @ ₹560
└─ Executed ✓ (Credit: ₹5,600)

Account:
├─ Holdings: SBIN, INFY, ...
├─ Cash Used: ₹500,000 - ₹13,400
└─ Buying Power: ₹486,600
```

---

## Mode Switching Workflow

```
┌─────────────────┐
│ Start: Any Mode │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ Click Trading Mode Toggle  │
└────────┬───────────────────┘
         │
         ▼
    ┌──────────┐
    │  Paper?  │ YES ──→ ✅ Switch to DEMO
    └────┬─────┘
         │
        NO
         │
         ▼
    ┌──────────────────────────┐
    │ Show Warning Banner      │
    │ ⚠️ Live Trading Active! │
    └────────┬─────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Confirm: Real Money?    │
    │ YES ──→ 🔴 LIVE MODE   │
    │ NO ──→ Stay in Paper    │
    └──────────────────────────┘
```

---

## Summary

| Feature | Paper Trading | Live Trading |
|---------|--------------|--------------|
| **Capital** | ₹10,000 (Demo) | Real Account Balance |
| **Risk** | ❌ None | ✅ Real Capital |
| **Orders** | Instant (Simulated) | Real (Market) |
| **Fees** | ❌ None | ✅ Brokerage |
| **Data** | Local JSON | Fyers Account |
| **Speed** | Fast | Depends on Market |
| **Best For** | Learning/Testing | Real Trading |
| **Recommendation** | Start Here ⭐ | When Ready ⚠️ |

---

**Last Updated:** December 29, 2025
**Status:** ✅ Live Trading & Paper Trading Ready

