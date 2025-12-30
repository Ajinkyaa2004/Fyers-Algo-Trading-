# Options Trading Quick Reference

## 🎯 Instrument Selection

### Button Location
Top of "Place New Order" form

### Three Options
```
📊 EQUITY    → Stock/Index trading
📈 CALL      → Bullish options trade  
📉 PUT       → Bearish options trade
```

---

## 📈 CALL Option (Bullish)

### When to Use
- You think price will go UP
- Want exposure with less capital
- Want defined risk

### How It Works
```
You BUY CALL
↓
Pay Premium (₹100-500)
↓
If Price > Strike → Profit ✅
If Price < Strike → Loss limited to premium ❌
```

### Example
```
NIFTY50 currently: ₹19400
BUY 1 CALL at Strike ₹19500, Premium ₹150

Scenarios:
- Price goes to 19600: Profit ₹(19600-19500-150) = -₹50 → Breakeven
- Price goes to 19700: Profit ₹(19700-19500-150) = ₹50 ✅
- Price goes to 19000: Loss = -₹150 (premium lost)
```

**Best For**: Small traders, limited capital, defined risk

---

## 📉 PUT Option (Bearish)

### When to Use
- You think price will go DOWN
- Want exposure with less capital
- Want defined risk

### How It Works
```
You BUY PUT
↓
Pay Premium (₹100-500)
↓
If Price < Strike → Profit ✅
If Price > Strike → Loss limited to premium ❌
```

### Example
```
NIFTY50 currently: ₹19400
BUY 1 PUT at Strike ₹19300, Premium ₹150

Scenarios:
- Price goes to 19200: Profit ₹(19300-19200-150) = -₹50 → Breakeven
- Price goes to 19000: Profit ₹(19300-19000-150) = ₹150 ✅
- Price goes to 19600: Loss = -₹150 (premium lost)
```

**Best For**: Downside protection, hedging, bearish view

---

## 🔑 Key Fields

### Symbol (Underlying)
```
For EQUITY:
└─ NSE:SBIN-EQ
└─ NSE:INFY-EQ  
└─ NSE:RELIANCE-EQ

For OPTIONS:
└─ NIFTY50
└─ BANKNIFTY
└─ FINNIFTY
└─ NIFTYNXT50
```

### Strike Price
```
Price at which you can buy (CALL) or sell (PUT)

NIFTY50 = 19400 (current)
Available Strikes:
- 19200 (OTM for Call, ITM for Put)
- 19300 (OTM for Call, ITM for Put)
- 19400 (ATM - At The Money)
- 19500 (ITM for Call, OTM for Put)
- 19600 (ITM for Call, OTM for Put)
```

### Expiry Date
```
Contract expires on this date

Common Types:
- Weekly: 31-Dec-2025 (Expires Friday)
- Monthly: 31-Jan-2026 (Expires last Thursday)
- Quarterly: 31-Mar-2026 (Expires last day)

Near expiry: Higher time decay
Far expiry: Lower time decay
```

### Quantity
```
Number of contracts (1 contract = 1 lot)

NIFTY50: 1 lot = 50 index units
BANKNIFTY: 1 lot = 40 bank units
Stocks: Varies (10, 50, 100, etc.)

Cost = Quantity × Strike Price × Lot Size
```

### Premium (Price)
```
Price you pay per contract

Example: Premium ₹150 = Pay ₹150 per contract
For 2 contracts = ₹150 × 2 = ₹300 total

Source: Market quotes, or set limit price
```

---

## 💰 Cost Calculation

### For CALL/PUT
```
Total Cost = Premium × Quantity

Example:
Premium = ₹200 per contract
Quantity = 2 contracts
Total Cost = ₹200 × 2 = ₹400
```

### Vs Equity
```
EQUITY: Cost = Price × Quantity
├─ BUY 10 SBIN @ ₹500 = ₹5000

OPTIONS: Cost = Premium × Quantity  
├─ BUY 2 NIFTY CALL @ ₹200 = ₹400
└─ Much cheaper! 10x leverage potential
```

---

## 🎯 Trading Step-by-Step

### Step 1: Select Instrument
```
Click: [📈 CALL] or [📉 PUT]
```

### Step 2: Enter Symbol
```
Type: NIFTY50 (for index options)
Type: NSE:RELIANCE-EQ (for stock options)
```

### Step 3: Set Strike Price
```
Input: 19500
Remember: 
- ATM = Strike ≈ Current Price
- ITM = Profitable strikes
- OTM = Cheaper, smaller profit potential
```

### Step 4: Pick Expiry Date
```
Click calendar: Select 31-Dec-2025
Or type date in YYYY-MM-DD format
```

### Step 5: Enter Premium
```
Input: 200 (your bid/ask price)
Or check market price first
```

### Step 6: Set Quantity
```
Input: 1 (conservative for beginners)
Recommendation: 1-2 contracts max
```

### Step 7: Choose Side
```
[BUY] ← For beginners (limited risk)
[SELL] ← Advanced only (unlimited risk)
```

### Step 8: Select Order Type
```
[LIMIT] - Your quoted price (safer)
[MARKET] - Best available (instant)
```

### Step 9: Execute
```
Click: [Place Order]
Monitor: Order Status
Exit: Click SELL with same strike to close
```

---

## 📊 Profit/Loss Examples

### CALL BUY Example
```
BUY 1 NIFTY CALL
Strike: 19500
Premium Paid: ₹200
Quantity: 1

AT EXPIRY:
If Nifty = 19400: Loss = -₹200 (max loss)
If Nifty = 19500: Loss = -₹200 (still at loss)
If Nifty = 19700: Profit = ₹(19700-19500-200) = 0
If Nifty = 19800: Profit = ₹(19800-19500-200) = ₹100
If Nifty = 20000: Profit = ₹(20000-19500-200) = ₹300
```

### PUT BUY Example
```
BUY 1 NIFTY PUT
Strike: 19300
Premium Paid: ₹200
Quantity: 1

AT EXPIRY:
If Nifty = 19400: Loss = -₹200 (max loss)
If Nifty = 19300: Loss = -₹200 (still at loss)
If Nifty = 19100: Profit = ₹(19300-19100-200) = 0
If Nifty = 19000: Profit = ₹(19300-19000-200) = ₹100
If Nifty = 18800: Profit = ₹(19300-18800-200) = ₹300
```

---

## 🚨 Risk Warnings

### ⚠️ Time Decay
Each day that passes:
```
Option premium decreases (especially last week)
Example:
Day 1: Premium = ₹200
Day 5: Premium = ₹150 (no price movement)
Day 10: Premium = ₹75 (last week!)
```

### ⚠️ Direction Risk
```
You BUY CALL but price goes DOWN
└─ You lose your entire premium
└─ No matter by how much

Risk Management:
- Use Stop Loss at -50% of premium
- Exit if wrong direction confirmed
- Don't hold to expiry on losing trades
```

### ⚠️ Volatility Risk
```
High Volatility → Premiums expensive
Low Volatility → Premiums cheap
Event Day → Huge swings possible

Solution:
- Check IV (Implied Volatility)
- Avoid trading before earnings/news
- Buy options in low IV, sell in high IV
```

### ⚠️ Expiry Risk
```
Last day: Extreme time decay
Last hour: Cannot recover losses
Last minute: Only intrinsic value

Best Practice:
- Exit 2-3 days before expiry
- Don't hold losing trades to expiry
- Close winners early, take profit
```

---

## ✅ Quick Checklist

Before clicking "Place Order":

- [ ] Instrument type correct (CALL/PUT)
- [ ] Symbol spelled correctly
- [ ] Strike price reasonable
- [ ] Expiry date in future (valid)
- [ ] Premium price market-like
- [ ] Quantity appropriate (1-2 for beginners)
- [ ] Side is BUY (if beginner)
- [ ] Trading mode verified (Paper/Live)
- [ ] Capital available
- [ ] Stop loss mentally set
- [ ] Ready to execute

---

## 🔄 How to Close Position

### If WINNING
```
1. Go to Place Order
2. Select instrument: CALL/PUT (same)
3. Keep symbol, strike, expiry SAME
4. Change side: BUY → SELL
5. Set price higher (to lock profit)
6. Click "Place Order"
7. Done! Position closed, profit locked
```

### If LOSING
```
1. Go to Place Order
2. Select instrument: CALL/PUT (same)
3. Keep symbol, strike, expiry SAME
4. Change side: BUY → SELL
5. Set market price (take loss quickly)
6. Click "Place Order"
7. Done! Cut loss, save capital for next trade
```

---

## 📈 Strategy Comparison

| Strategy | Risk | Profit | When Use | Difficulty |
|----------|------|--------|----------|-----------|
| **Long CALL** | Limited | Unlimited | Bullish | Easy ✅ |
| **Long PUT** | Limited | Limited | Bearish | Easy ✅ |
| **Call Spread** | Limited | Limited | Bullish | Medium |
| **Put Spread** | Limited | Limited | Bearish | Medium |
| **Short CALL** | Unlimited | Limited | Income | Hard ❌ |
| **Short PUT** | Very High | Limited | Income | Hard ❌ |
| **Straddle** | Limited | Very High | High Volatility | Hard |
| **Iron Condor** | Limited | Limited | Flat Market | Hard |

**Recommendation for Beginners**: Long CALL and Long PUT only

---

## 💡 Pro Tips

### 1. Start with Nifty/BankNifty
```
Why?
- Highest liquidity (easiest to buy/sell)
- Tightest bid-ask spread
- Best execution prices
- Most information available
```

### 2. Trade Weekly Expiry First
```
Why?
- Easier to understand time decay
- Faster learning curve
- Less capital needed
- Quick feedback on trades
```

### 3. Buy ITM or ATM Options Only
```
In-The-Money (ITM):
- Higher cost but safer
- More intrinsic value
- Less affected by volatility
- Better for beginners

Out-of-The-Money (OTM):
- Lower cost but riskier
- More affected by volatility
- Need to be right on price
- Higher probability of loss

Recommendation: Start with ATM
```

### 4. Use Position Sizing
```
Rule of Thumb:
- Risk 1-2% of capital per trade
- Capital = ₹10,000
- Risk = ₹100-200 per trade
- Premium ₹100 → 1 contract max
- Premium ₹50 → 2-3 contracts max
```

### 5. Set Stop Loss
```
Example:
BUY CALL, Premium ₹200
Set Stop Loss at 50% = ₹100 loss

If premium drops to ₹100 → EXIT
Don't hold hoping for recovery
```

---

## 🎓 Learning Path

### Week 1-2: Basics
- [ ] Understand CALL/PUT concepts
- [ ] Paper trade long calls/puts
- [ ] Learn about strikes and premiums
- [ ] Track 5-10 trades (paper)

### Week 3-4: Intermediate
- [ ] Understand time decay
- [ ] Learn about greeks (Delta, Theta, Vega)
- [ ] Paper trade spreads
- [ ] Analyze past trades

### Week 5-6: Ready for Live?
- [ ] Consistent profits in paper
- [ ] Clear strategy and rules
- [ ] Risk management discipline
- [ ] Emotional control demonstrated

### Week 7+: Live Trading
- [ ] Start with 1-2 contracts
- [ ] Same strategy as paper
- [ ] Track all trades
- [ ] Scale up gradually over months

---

## 📱 Quick Reference: Form Fields

### Visible for EQUITY
```
✓ Symbol
✓ Quantity  
✓ Price
✓ Order Type
✓ Side
✓ Product Type
✗ Strike Price (hidden)
✗ Expiry Date (hidden)
```

### Visible for CALL/PUT
```
✓ Symbol
✓ Quantity
✓ Price (Premium)
✓ Order Type
✓ Side
✓ Strike Price (VISIBLE)
✓ Expiry Date (VISIBLE)
✗ Product Type (hidden)
```

---

## 🎯 Golden Rules

1. **Start Small**: 1 contract, ₹50-200 premium
2. **Buy Only**: Never sell as beginner
3. **Use Stops**: Always have exit plan
4. **Avoid Expiry**: Exit before last 3 days
5. **Trade Nifty**: Highest liquidity
6. **Paper First**: 2-4 weeks minimum
7. **Record Trades**: Learn from each trade
8. **Risk 1-2%**: Never risk more than this
9. **Take Profits**: Exit when target hit
10. **Cut Losses**: Exit when wrong immediately

---

**Remember**: With great leverage comes great responsibility! Start small, learn continuously, and always protect your capital.

Good luck! 🚀

