# Trading Mode Quick Reference

## 🎯 Quick Toggle Guide

### How to Switch Trading Mode
1. Look at the **top banner** of the dashboard
2. Find the **big toggle button** 
3. Click to switch between modes
4. Mode preference saves automatically

---

## 📊 Paper Trading (Demo) - Default Mode

### Recognition
```
🟨 YELLOW indicator
"PAPER TRADING (DEMO)"
Safe Testing Mode
```

### Use This For
✅ Learning how to trade
✅ Testing strategies
✅ Practicing order placement
✅ Understanding P&L
✅ No risk to real capital

### Initial Capital
💰 **₹10,000 demo money**

### How Orders Work
1. Enter symbol, quantity, price
2. Click "Place Order"
3. ✅ Order executes instantly (simulated)
4. Your portfolio updates immediately
5. Check "Paper Trading Simulator" section

---

## 🔴 Live Trading (Real Money) - Advanced

### Recognition
```
🔴 RED indicator
"⚠️ LIVE TRADING (REAL MONEY)"
Real Capital at Risk
```

### Use This For
⚠️ Real trading with actual money
⚠️ When you're confident
⚠️ Only after paper trading success

### Initial Capital
💵 **Whatever you fund in Fyers**

### How Orders Work
1. Enter symbol, quantity, price
2. Click "Place Order"
3. ⚠️ Real money is charged
4. Order hits live market
5. Fyers account updated
6. CANNOT be undone (except counter-trade)

---

## 🚀 Step-by-Step: Paper Trading Example

### Step 1: Verify Paper Mode
- Check top banner shows 🟨 YELLOW
- Status shows "PAPER TRADING (DEMO)"

### Step 2: Place Buy Order
```
Symbol:    NSE:SBIN-EQ
Quantity:  10
Price:     ₹550
Side:      BUY
Type:      LIMIT
```
✅ Click "Place Order"

### Step 3: Order Executes
```
✅ Order executed successfully
💰 Cost: ₹5,500
💵 Remaining cash: ₹4,500
```

### Step 4: Monitor Position
- Go to "Paper Trading Simulator"
- See:
  - Position: 10 SBIN
  - Entry: ₹550
  - Current: ₹550+
  - P&L: Real-time updates

### Step 5: Close Trade (Profit)
```
Symbol:    NSE:SBIN-EQ
Quantity:  10
Price:     ₹560
Side:      SELL
Type:      MARKET
```
✅ Click "Place Order"

### Result
```
✅ Profit: ₹100 (₹550 → ₹560)
✅ Return: 1.82%
💰 Cash back: ₹10,000
```

---

## ⚠️ Step-by-Step: Live Trading (Advanced)

### Before You Switch
❌ **NOT RECOMMENDED FOR BEGINNERS**
✅ Only if:
- Paper trading successful
- Risk management understood
- Market knowledge solid
- Account is funded

### Step 1: Locate Toggle
- Top banner of dashboard
- Look for the mode selector

### Step 2: Read Warning
When you click to switch, warning appears:
```
⚠️ WARNING
You are trading with REAL money.
All executed orders will affect your actual 
trading account and real capital will be 
debited/credited.
```

### Step 3: Confirm
- Understanding risk? Click toggle
- Not ready? Don't toggle (stay in demo)

### Step 4: Verify Live Mode
- Banner turns 🔴 RED
- Status shows "⚠️ LIVE TRADING"

### Step 5: Place Order (Real)
```
Symbol:    NSE:SBIN-EQ
Quantity:  10
Price:     ₹550
Side:      BUY
Type:      MARKET
```
⚠️ Click "Place Order"
- Real money WILL be debited
- Order hits LIVE market
- Cannot be cancelled (only counter-trade)

---

## 🎛️ Mode Selector Panel

### Top Banner Components

```
LEFT SIDE:
├─ Mode Indicator (Yellow/Red)
├─ Mode Name
└─ Description

MIDDLE:
├─ Toggle Button (DEMO ←→ REAL)
└─ Mode Status

RIGHT SIDE:
├─ Current Portfolio Value
└─ Current Mode Label
```

### Color Coding
🟨 **YELLOW** = Safe Demo Mode
🔴 **RED** = Real Money Mode

---

## ✅ Paper Trading Checklist

Before you switch to Live Trading:

- [ ] Paper trading for at least 1 week
- [ ] At least 5-10 successful trades
- [ ] Consistent profit in demo
- [ ] Understanding of order types
- [ ] Risk management strategy defined
- [ ] Stop loss discipline practiced
- [ ] Position sizing calculated
- [ ] Money management plan ready
- [ ] Fyers account funded
- [ ] .env credentials configured

---

## 📈 Trading Tips

### Paper Trading (Safe)
✅ Trade frequently - learn from mistakes
✅ Test different strategies
✅ Try all order types
✅ Practice risk management
✅ Keep detailed notes
✅ Review trades regularly
✅ Aim for consistent returns

### Live Trading (Careful)
⚠️ Trade less frequently - quality over quantity
⚠️ Use smaller position sizes
⚠️ Always use stop losses
⚠️ Follow your trading plan
⚠️ Don't overtrade
⚠️ Review each trade carefully
⚠️ Risk only 1-2% per trade

---

## 🔄 Switching Mode Data

### What Transfers?
```
Paper → Live:
├─ Strategy knowledge ✅
├─ Discipline ✅
├─ Order placement skills ✅
└─ Risk management ✅

What Doesn't Transfer:
├─ Demo money ❌
├─ Paper positions ❌
├─ Demo trades history ❌
└─ Demo P&L ❌
```

### Your Live Account Starts Fresh
- Portfolio: Begins at current balance
- Positions: Empty (start fresh)
- Orders: Empty
- P&L: Calculated from day 1

---

## 🆘 Quick Troubleshooting

### Problem: Can't Switch Modes
**Solution:**
- Refresh page
- Check if logged in
- Try clicking toggle again

### Problem: Orders Not Executing
**Paper Mode:**
- Check symbol format (NSE:SBIN-EQ)
- Verify cash available
- Check quantity > 0

**Live Mode:**
- Market open? (9:15 - 3:30 PM IST)
- Account funded?
- Fyers credentials correct?

### Problem: Mode Resets
**Solution:**
- Browser cache issue
- Clear localStorage
- Reload page

---

## 📱 Mobile Trading

### Paper Trading (Mobile-Friendly)
✅ Same toggle at top
✅ Responsive design
✅ Works on all devices
✅ Auto-saves preference

### Live Trading (Mobile)
⚠️ Possible but risky
⚠️ Small screen - double-check orders
⚠️ Connection stable?
⚠️ Extra caution needed

---

## 💡 Pro Tips

### Paper Trading
1. **Keep a Trading Journal**
   - Entry: Why you traded
   - Exit: Why you exited
   - P&L: Profit/loss amount
   - Lesson: What you learned

2. **Set Rules**
   - Max loss per trade: 2%
   - Max capital per trade: 10%
   - Stop loss: Mandatory
   - Take profit: Plan it

3. **Backtest First**
   - Review past data
   - See what worked
   - Validate strategy
   - Then trade it

### Live Trading
1. **Size Down**
   - Demo: 10 shares/lot
   - Live: 1-2 shares/lot
   - Reduce risk 80%

2. **Add Delays**
   - Demo: Execute instantly
   - Live: Wait 5 seconds
   - Confirm order details
   - Prevent mistakes

3. **Use Alerts**
   - Set price targets
   - Set stop losses
   - Monitor positions
   - Exit with discipline

---

## 🎓 Learning Path

```
Week 1-2: Paper Trading
├─ Basic orders (BUY/SELL)
├─ Order types (LIMIT/MARKET)
├─ Position management
└─ Simple strategies

Week 3-4: Paper Trading Advanced
├─ Intraday trading
├─ Multiple positions
├─ Advanced strategies
└─ Risk management

Week 5+: Ready for Live?
├─ Consistent profits ✅
├─ Discipline proven ✅
├─ Risk management solid ✅
└─ Maybe try Live...

Live Trading: Execution
├─ Smaller positions
├─ Same discipline
├─ Real money lessons
└─ Gradual scaling
```

---

## 📊 Dashboard Integration

### Where You'll See Modes

**1. Top Navigation Bar**
- Mode toggle button
- Current status
- Portfolio value

**2. Order Placement Component**
- Mode badge in form
- Visual indicator
- Cash/funds display

**3. Trading Component**
- Mode indicator in header
- Status in form
- P&L in real-time

**4. Portfolio Dashboard**
- Reflects current mode
- Shows balances
- Updates live

---

## ⚡ Quick Decision Tree

```
Just Starting Out?
    ├─ YES → Use PAPER TRADING 🟨
    │        └─ Learn, practice, no risk
    │
    └─ NO → Have trading experience?
             ├─ YES → Paper Trading 1st 🟨
             │        └─ Validate strategy
             │
             └─ NO → Not ready for Live

Ready for Real Money?
    ├─ Consistent profits? ✅
    ├─ Risk mgmt? ✅
    ├─ Discipline? ✅
    ├─ Account funded? ✅
    │
    └─ YES to all? → Use LIVE TRADING 🔴 ⚠️
```

---

**Remember:**
- 🟨 Paper Trading = Risk-FREE Learning
- 🔴 Live Trading = Real Money = Real Risk
- Always start with paper trading first!

