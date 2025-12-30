# Paper Trading P&L (Profit & Loss) Guide

## Overview
Your paper trading system now displays comprehensive P&L information so you can track exactly how much you're **making or losing** in your simulated trades.

---

## P&L Metrics Explained

### 1. **Total P&L** 
- **What it shows**: Your overall profit or loss across all trades
- **Calculation**: Realized P&L + Unrealized P&L
- **Display**: Green if profit 📈, Red if loss 📉
- **Example**: If you made ₹500 on closed trades and have ₹200 unrealized gain, Total P&L = ₹700

### 2. **Realized P&L**
- **What it shows**: Profit/Loss from trades you've already **closed/exited**
- **When it happens**: When you fully sell a position
- **Example**: You bought SBIN at ₹500, sold at ₹550 → Realized P&L = ₹50 (if qty=1)

### 3. **Unrealized P&L**
- **What it shows**: Current profit/loss from **open positions** (not closed yet)
- **Calculation**: (Current Price - Average Entry Price) × Quantity
- **Changes daily**: Updates with market price movements
- **Example**: You bought SBIN at ₹500, current price ₹520 → Unrealized P&L = ₹20

### 4. **Return %**
- **What it shows**: Your percentage gain/loss relative to initial capital
- **Calculation**: (Total P&L / Initial Capital) × 100
- **Example**: Started with ₹10,000, Total P&L = ₹1,000 → Return = 10%

### 5. **Portfolio Value**
- **What it shows**: Current total worth of your paper trading account
- **Calculation**: Cash + Open Positions Value
- **Example**: Cash ₹5,000 + Stock positions ₹6,000 = ₹11,000 portfolio value

---

## Where to See P&L Information

### 📊 **Option 1: Order Placement Component** (Real-time Summary)
When you open the **"Place New Order"** section, you see a quick P&L card showing:
- Portfolio Value
- Total P&L (amount + %)
- Realized P&L
- Unrealized P&L

This updates **every 5 seconds** so you always see current status while placing trades.

### 🎯 **Option 2: Paper Trading Tracker Dashboard** (Detailed View)
Click on **"Paper Trading Tracker"** for the comprehensive view:

#### **P&L Dashboard Section**
Shows 5 main cards:
- Portfolio Value (blue)
- Total P&L (green/red)
- Realized P&L (cyan/orange)
- Unrealized P&L (purple/pink)
- Available Cash (teal)

#### **Status Indicators**
- Number of closed trades
- Current status (✓ Profit or ✗ Loss)
- Number of open positions
- Return percentage

#### **Closed Trades Table**
Displays every completed trade with:
- Symbol name
- Quantity traded
- Entry price (what you bought at)
- Exit price (what you sold at)
- P&L Amount (₹ profit/loss)
- P&L % (percentage gain/loss)
- Status badge (✓ Profit in green, ✗ Loss in red)
- Trade date & time

---

## How to Interpret the Numbers

### ✅ **Profit Scenario**
```
Bought: NSE:SBIN-EQ at ₹500
Sold:   NSE:SBIN-EQ at ₹550
Qty:    10

Realized P&L = (₹550 - ₹500) × 10 = ₹500 ✓ PROFIT
P&L % = (₹500 / ₹5000) × 100 = 10% return
```

### ❌ **Loss Scenario**
```
Bought: NSE:SBIN-EQ at ₹500
Sold:   NSE:SBIN-EQ at ₹480
Qty:    10

Realized P&L = (₹480 - ₹500) × 10 = -₹200 ✗ LOSS
P&L % = (-₹200 / ₹5000) × 100 = -4% loss
```

### 🔄 **Open Position** (Unrealized)
```
Bought:     NSE:SBIN-EQ at ₹500
Current:    NSE:SBIN-EQ at ₹520
Qty:        10
Status:     OPEN (not sold yet)

Unrealized P&L = (₹520 - ₹500) × 10 = ₹200 (if you sold NOW)
P&L % = (₹200 / ₹5000) × 100 = 4% (if you sold NOW)
```

---

## Color Coding Guide

| Color | Meaning | Example |
|-------|---------|---------|
| 🟢 **Green** | Profit/Gain | +₹500, +10% |
| 🔴 **Red** | Loss | -₹200, -4% |
| 🔵 **Blue** | Portfolio Info | Total Value |
| 🟦 **Cyan** | Realized (Closed) | P&L from exits |
| 🟪 **Purple** | Unrealized (Open) | Current holdings |
| 🟩 **Teal** | Cash Available | Buying power |

---

## Real-Time Updates

### ⚡ **Auto-Refresh Rate**
- **Order Placement Card**: Updates every 5 seconds
- **Paper Trading Dashboard**: Updates every 5 seconds
- **Trade History Table**: Click "Refresh" to manually update

### 📈 **What Changes**
- Unrealized P&L updates as market prices change
- New trades appear in the table immediately after closing
- Portfolio value updates after each trade

---

## Tracking Your Performance

### 🎯 **Key Metrics to Monitor**
1. **Win Rate**: Percentage of profitable trades
2. **Avg Win vs Avg Loss**: Average profit per winning trade vs average loss
3. **Total Return %**: Overall performance relative to initial capital
4. **Realized vs Unrealized**: Locked-in gains vs paper gains

### 📊 **Example Performance Snapshot**
```
Initial Capital:    ₹10,000
Current Value:      ₹11,500
Total P&L:          +₹1,500 (+15%)
  - Realized:       +₹1,200 (from 5 closed trades)
  - Unrealized:     +₹300 (from 2 open positions)

Trades Closed:      5
Open Positions:     2
Success Rate:       60% (3 wins, 2 losses)
```

---

## Tips for Using P&L Data

### ✅ **Do's**
- ✓ Review closed trades regularly to identify patterns
- ✓ Compare realized vs unrealized to understand risk
- ✓ Track your return % over time
- ✓ Use profit targets and loss limits

### ❌ **Don'ts**
- ✗ Don't panic on negative unrealized P&L (you haven't exited yet)
- ✗ Don't trade just to "break even" on a losing position
- ✗ Don't ignore the P&L % metric - focus on percentage, not just amounts

---

## Integration with Trading

When placing orders, you can see:
- Whether you have enough cash for the BUY order
- Your current profit/loss situation
- Whether to take profits or cut losses

Example:
```
You have ₹11,500 portfolio value
You want to buy ₹2,000 worth of stock
System checks: Available cash ₹5,000 > ₹2,000? ✓ ALLOWED
```

---

## Summary

Your paper trading now gives you **complete visibility** into:
- **How much you're making/losing** ✓
- **Realized vs unrealized gains** ✓
- **Individual trade P&L** ✓
- **Overall portfolio performance** ✓
- **Real-time updates** ✓

**Start trading and watch your P&L grow! 🚀**

---

## Need Help?

If you need to reset your paper trading portfolio:
1. Go to Paper Trading Tracker
2. Click "Reset Portfolio" button
3. Confirm the action
4. Your account resets to ₹10,000 with no trades

---

**Last Updated**: December 26, 2025
**Version**: 1.0
