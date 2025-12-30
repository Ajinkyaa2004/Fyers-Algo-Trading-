# Quick Start: Paper Trading in 5 Minutes

## 1️⃣ Find the Feature

On your **Dashboard**, you'll see two sections:

```
┌─────────────────────────────────────────┐
│  📊 Place New Order (with toggle)       │
│                                         │
│  Toggle: [🟨] PAPER TRADING (enabled)   │  ← Default (Safe!)
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚡ Paper Trading Simulator             │
│  DEMO MODE                              │
│                                         │
│  Portfolio Summary                      │
│  Open Positions                         │
│  Closed Trades                          │
└─────────────────────────────────────────┘
```

## 2️⃣ Place Your First Order

### Buy Order
```
1. Fill in the form:
   Symbol: NSE:INFY
   Quantity: 10
   Price: 1500
   Side: BUY

2. Click "Place Order"

3. See result:
   ✅ Order executed
   💰 Cash: ₹100,000 → ₹85,000
   📊 Position: 10 @ ₹1,500
```

## 3️⃣ Monitor Your Position

Scroll down to **Paper Trading Simulator**:

```
Portfolio Summary:
├─ Initial Capital: ₹100,000
├─ Current Value: ₹101,000
├─ Cash: ₹85,000
├─ Positions Value: ₹16,000
├─ Total P&L: ₹1,000 ✅
└─ Return: +1.0%

Open Positions:
├─ NSE:INFY
│  ├─ Quantity: 10
│  ├─ Avg Price: ₹1,500
│  ├─ Current Price: ₹1,600  (let's assume)
│  └─ P&L: ₹1,000 (6.67%)
```

## 4️⃣ Close the Position

### Sell Order
```
1. In order form:
   Symbol: NSE:INFY
   Quantity: 10
   Price: 1600
   Side: SELL

2. Click "Place Order"

3. See result:
   ✅ Position closed
   💵 Cash: ₹85,000 → ₹101,000
   📈 Closed Trade added to history
   P&L: ₹1,000 (6.67% return)
```

## 5️⃣ Reset & Try Again

```
Click "Reset" button
→ Confirms deletion
→ Portfolio reset to ₹100,000
→ All positions cleared
→ Ready for next strategy test
```

---

## Common Scenarios

### Scenario 1: Multiple Positions
```
Buy NSE:INFY (10 @ ₹1,500)    → Cash: 85,000
Buy NSE:TCS (5 @ ₹3,000)      → Cash: 70,000
Buy NSE:RELIANCE (8 @ ₹2,000) → Cash: 54,000

Portfolio Value:
├─ Cash: ₹54,000
├─ INFY Position: ₹15,500
├─ TCS Position: ₹15,000
├─ RELIANCE Position: ₹16,000
└─ Total: ₹100,500
```

### Scenario 2: Partial Close
```
Bought: 10 shares @ ₹1,500
Sell: 5 shares @ ₹1,550

Result:
├─ Position remaining: 5 @ ₹1,500
├─ P&L on sale: (1,550-1,500)×5 = ₹250
├─ Remaining position P&L: Floating
```

### Scenario 3: Loss & Recovery
```
Buy: 10 @ ₹2,000 (Price drops to ₹1,800)
Unrealized P&L: -₹2,000 ❌

Wait... (Price rises to ₹2,100)
Sell: 10 @ ₹2,100
Realized P&L: +₹1,000 ✅
```

---

## Key Metrics Explained

| Metric | What It Is | Example |
|--------|-----------|---------|
| **Initial Capital** | Starting virtual money | ₹100,000 |
| **Current Value** | Total account worth now | ₹101,500 |
| **Cash** | Buying power left | ₹50,000 |
| **Positions Value** | Worth of all holdings | ₹51,500 |
| **Realized P&L** | Profit from closed trades | ₹1,000 |
| **Unrealized P&L** | Current profit on open | ₹500 |
| **Total P&L** | Realized + Unrealized | ₹1,500 |
| **Return %** | Gain % on capital | 1.5% |

---

## Toggle Guide

### Paper Trading (Default) ✅
```
Button: 🟨 PAPER TRADING (enabled)
Color: Yellow/Bright
Status: Safe ✓
Orders: Use virtual money
Real Money: ❌ Not at risk
```

### Real Trading (Advanced) ⚠️
```
Button: 🔴 REAL TRADING (enabled)
Color: Red/Dark
Status: ⚠️ Warning
Orders: Use REAL money
Real Money: ✓ AT RISK!
```

**To Switch:**
1. Click the toggle button
2. Colors reverse
3. Orders follow new mode

---

## Examples

### Example 1: Quick Test

**Goal:** Test if order placement works

```
1. Buy 1 share @ ₹100
   Result: ✅ Shows in portfolio

2. Sell 1 share @ ₹105
   Result: ✅ P&L calculated (+₹5)

3. Check closed trade
   Result: ✅ Trade in history

Status: ✅ Order placement working!
```

### Example 2: Strategy Test

**Goal:** Test buy-hold-sell strategy

```
1. BUY 5 shares @ ₹1000
   (Simulating entry)

2. WAIT (positions show in tracker)

3. SELL 5 shares @ ₹1100
   (Simulating exit)

4. Check P&L
   Return: (1100-1000)×5 = ₹500 profit

Status: ✅ Strategy test complete
```

### Example 3: Multi-Symbol Test

**Goal:** Test trading multiple stocks

```
1. Buy INFY 10 @ 1500   → P&L calculated
2. Buy TCS  5 @ 3000    → P&L calculated
3. Buy RELIANCE 8 @ 2000 → P&L calculated

4. View portfolio summary
   Shows all 3 positions
   Shows combined P&L
   Shows total capital used

5. Close positions one by one
   Each generates a trade record
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Toggle shows real trading" | Click to switch to paper (yellow) |
| "Insufficient cash error" | Check cash available, reduce qty |
| "No position to sell" | Buy first before selling |
| "Order not showing" | Click refresh in tracker |
| "P&L not updating" | Wait 5 seconds (auto-refresh) |
| "Data lost on restart" | Data saves automatically |

---

## Ready? Let's Go! 🚀

1. **Open Dashboard**
2. **Find "Place New Order" section**
3. **Make sure toggle is 🟨 PAPER TRADING**
4. **Fill in your first order**
5. **Click "Place Order"**
6. **View results in Paper Trading Simulator below**

## Your First Trade

```
Symbol:   NSE:INFY
Quantity: 1
Price:    1500
Side:     BUY

→ Click "Place Order"
→ ✅ Order executed!
→ Scroll down to see position
→ Ready to test more!
```

---

## Important Reminders

✅ **Paper Trading:**
- Uses virtual money
- No real capital at risk
- Risk-free testing
- Perfect for learning

⚠️ **Real Trading:**
- Uses real money
- Capital at risk
- Only when ready
- Need to toggle deliberately

**Default:** Paper Trading is ON
**Safest:** Keep it on during testing

---

## Next Steps

### When Paper Trading Works Well:
✅ You consistently make profits
✅ Your strategy shows positive returns
✅ You understand the mechanics
✅ You're ready for real trading

### Then Switch to Real Trading:
1. In "Place New Order" form
2. Click toggle to switch OFF
3. Toggle becomes red (⚠️)
4. Orders now use real money
5. **Be careful! Real money at stake!**

---

**Happy Paper Trading! 📊**

Remember: This is risk-free learning. Test everything here before you trade real money!
