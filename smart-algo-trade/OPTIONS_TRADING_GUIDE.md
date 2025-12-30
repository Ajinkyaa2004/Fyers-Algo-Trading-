# Options Trading Guide

## 📈 Overview

Your Smart Algo Trade platform now supports **Options Trading** in addition to equity trading. You can trade CALL options, PUT options, and regular equities all from the same interface.

---

## 🎯 What Are Options?

### CALL Option 📈
- Right to **BUY** an underlying asset at a fixed price (strike price)
- Profit when the asset price goes **UP**
- Used for bullish trades
- Premium increases with rising prices

### PUT Option 📉
- Right to **SELL** an underlying asset at a fixed price (strike price)
- Profit when the asset price goes **DOWN**
- Used for bearish trades
- Premium increases with falling prices

### Strike Price
- The fixed price at which you can buy (CALL) or sell (PUT)
- Example: NIFTY50 Strike 19500 means:
  - CALL: Right to buy NIFTY50 at ₹19500
  - PUT: Right to sell NIFTY50 at ₹19500

### Expiry Date
- The date when the options contract expires
- Common expiry: Weekly or Monthly
- After expiry, the contract becomes worthless
- Example: 31-Dec-2025 (if within market hours)

---

## 🚀 How to Trade Options

### Step 1: Open Order Form
Navigate to the **"Place New Order"** section in your dashboard.

### Step 2: Select Instrument Type
You'll see three buttons at the top:
```
📊 EQUITY  |  📈 CALL  |  📉 PUT
```

Click **📈 CALL** or **📉 PUT** based on your strategy.

### Step 3: Enter Underlying Asset
- For CALL/PUT: Use index/underlying symbol
  - Example: `NIFTY50`, `BANKNIFTY`, `FINNIFTY`
  - Or specific stock: `NSE:RELIANCE-EQ`, `NSE:INFY-EQ`

### Step 4: Set Strike Price
When you select CALL or PUT, new fields appear:
- **Strike Price**: e.g., 19500 for NIFTY50
- **Expiry Date**: Pick from calendar or type manually

### Step 5: Fill Order Details
- **Quantity**: Number of contracts (1 contract = 1 lot)
  - NIFTY50: 1 lot = 50 units
  - BANKNIFTY: 1 lot = 40 units
  - Individual stocks: Varies
- **Price**: Premium per contract
  - From market price or your quoted price
- **Type**: LIMIT or MARKET
  - LIMIT: Your quoted price
  - MARKET: Best available price

### Step 6: Choose Side
- **BUY**: You pay premium, profit if prediction correct
- **SELL**: You receive premium, profit if prediction wrong (risky!)

### Step 7: Place Order
Click **"Place Order"** button to execute.

---

## 📚 Trading Examples

### Example 1: Bullish CALL Trade
**Scenario**: You think NIFTY50 will go from 19400 to 19600+

```
Step 1: Select Instrument Type → 📈 CALL
Step 2: Symbol → NIFTY50
Step 3: Strike Price → 19500
Step 4: Expiry Date → 31-Dec-2025
Step 5: Quantity → 2 contracts
Step 6: Price → ₹150 (per contract premium)
Step 7: Side → BUY
Step 8: Order Type → MARKET
```

**What happens:**
- You PAY: 2 × ₹150 = ₹300 total premium
- Profit if NIFTY50 > 19500 + Premium (19650)
- Loss limited to ₹300 if NIFTY50 < 19500 at expiry
- Max profit: Unlimited

---

### Example 2: Bearish PUT Trade
**Scenario**: You think NIFTY50 will drop from 19400 to 19200

```
Step 1: Select Instrument Type → 📉 PUT
Step 2: Symbol → NIFTY50
Step 3: Strike Price → 19300
Step 4: Expiry Date → 31-Dec-2025
Step 5: Quantity → 1 contract
Step 6: Price → ₹200 (per contract premium)
Step 7: Side → BUY
Step 8: Order Type → MARKET
```

**What happens:**
- You PAY: 1 × ₹200 = ₹200 total premium
- Profit if NIFTY50 < 19300 - Premium (19100)
- Loss limited to ₹200 if NIFTY50 > 19300 at expiry
- Max profit: ₹19300 - Premium per contract

---

### Example 3: Income Strategy (CALL Selling)
**Scenario**: You want to generate income by selling premium

```
Step 1: Select Instrument Type → 📈 CALL
Step 2: Symbol → BANKNIFTY
Step 3: Strike Price → 42500
Step 4: Expiry Date → 30-Dec-2025
Step 5: Quantity → 1 contract
Step 6: Price → ₹350 (per contract)
Step 7: Side → SELL ⚠️ (Risky - Unlimited loss)
Step 8: Order Type → MARKET
```

**What happens:**
- You RECEIVE: 1 × ₹350 = ₹350 premium
- Profit if BANKNIFTY < 42500 + Premium (42850)
- Loss UNLIMITED if BANKNIFTY > 42850
- Recommended only for experienced traders

⚠️ **WARNING**: Selling options (naked calls/puts) is extremely risky!

---

## 💡 Common Strategies

### 1. Long Call (Bullish)
```
BUY CALL
- Cost: Premium paid
- Max Loss: Premium paid
- Max Profit: Unlimited
- Breakeven: Strike + Premium
```

### 2. Long Put (Bearish)
```
BUY PUT
- Cost: Premium paid
- Max Loss: Premium paid
- Max Profit: Strike - Premium
- Breakeven: Strike - Premium
```

### 3. Call Spread (Bullish, Limited Risk)
```
BUY CALL (Lower Strike) + SELL CALL (Higher Strike)
- Cost: Premium paid - Premium received
- Max Loss: Cost of spread
- Max Profit: Difference between strikes - Cost
- Lower cost, Lower risk, Lower reward
```

### 4. Put Spread (Bearish, Limited Risk)
```
BUY PUT (Higher Strike) + SELL PUT (Lower Strike)
- Cost: Premium paid - Premium received
- Max Loss: Difference between strikes - Net Credit
- Max Profit: Net credit received
- Good for downside protection
```

---

## 📊 Key Differences: Equity vs Options

| Aspect | Equity (Stock) | CALL Option | PUT Option |
|--------|---|---|---|
| **What you own** | Shares of company | Right to BUY | Right to SELL |
| **Cost** | Full stock price | Premium (small %) | Premium (small %) |
| **Leverage** | 1x | High (5-10x) | High (5-10x) |
| **Expiry** | None (indefinite) | Fixed date | Fixed date |
| **Risk** | Loss limited to capital | Loss limited (long) | Loss limited (long) |
| **Time Decay** | None | Decreases | Decreases |
| **Tax** | STCG/LTCG | Speculative | Speculative |

---

## ⚠️ Important Warnings

### Risk #1: Time Decay
- Options lose value as expiry approaches
- Especially rapid in last few days
- Out-of-money options become worthless at expiry

### Risk #2: Volatility Crush
- High volatility → Option premiums high
- Low volatility → Option premiums low
- Earnings, news events cause major swings

### Risk #3: Liquidity Risk
- Far-dated options have lower liquidity
- May not find buyers/sellers for your order
- Bid-ask spread can be high

### Risk #4: Unlimited Loss (Short Options)
- Selling naked calls: Loss is unlimited
- Selling naked puts: Loss up to strike price
- Use spreads or stop losses to limit risk

### Risk #5: Leverage Amplifies Losses
- 10x leverage = 10x losses if wrong
- ₹100 premium loss with 10x leverage = ₹1000 loss
- Use position sizing: Risk only 1-2% per trade

---

## 🎓 Before Trading Options

### Required Knowledge
- [ ] Understand what CALL and PUT are
- [ ] Know how strike price works
- [ ] Understand expiry and time decay
- [ ] Know Greeks (Delta, Gamma, Theta, Vega) - optional but helpful
- [ ] Understand leverage and margin

### Required Skills
- [ ] Can predict market direction (bullish/bearish)
- [ ] Can calculate risk/reward ratios
- [ ] Can manage positions (exit with stop loss)
- [ ] Can read option Greeks and charts
- [ ] Can handle volatility emotionally

### Get Experience First
1. **Start with paper trading** (demo account)
2. **Try simple strategies** (long calls/puts only)
3. **Trade small size** (1-2 lots) initially
4. **Avoid selling options** until experienced
5. **Use stop losses** religiously

---

## 📱 UI Guide

### Order Form Sections

#### 1. Instrument Type Buttons
```
[📊 EQUITY] [📈 CALL] [📉 PUT]
```
- Click to toggle between equity and options trading
- Form fields adjust based on selection

#### 2. For EQUITY
```
Symbol: NSE:SBIN-EQ
Quantity: 10 (shares)
Price: ₹500
```

#### 3. For OPTIONS (CALL/PUT)
```
Symbol: NIFTY50 (or index/stock name)
Strike Price: 19500 (shown only for CALL/PUT)
Expiry Date: 31-Dec-2025 (calendar picker)
Quantity: 2 (contracts/lots)
Price: ₹150 (premium per contract)
```

#### 4. Order Summary
Shows different details:
- **EQUITY**: Total value = Quantity × Price
- **OPTIONS**: Strike, Expiry, Option type (CALL/PUT)

---

## 🔧 Paper Trading vs Live Trading

### Paper Trading (Demo)
- ✅ No real money risk
- ✅ Unlimited capital (₹10,000 demo)
- ✅ Perfect for learning
- ✅ Instant execution
- ✅ No slippage

**Recommendation**: Practice options here for 2-4 weeks before going live

### Live Trading (Real Money)
- ⚠️ Real money at risk
- ⚠️ Limited to your account balance
- ⚠️ Real market conditions
- ⚠️ Slippage and delays possible
- ⚠️ Emotional challenges

**Recommendation**: Start small (1-2 contracts) and scale gradually

---

## 📈 Strategy Recommendations

### For Beginners
**Only trade LONG OPTIONS (BUY)**
- ✅ Limited risk
- ✅ Defined loss upfront
- ✅ Simpler psychology
- ✅ No margin requirement (usually)

**Recommended**: Long calls for bullish, long puts for bearish

### For Intermediate
**Add spreads to your arsenal**
- ✅ Lower cost than outright
- ✅ Limited risk and profit both
- ✅ Better risk/reward ratios
- ✅ Reduces time decay impact

**Recommended**: Bull call spreads, bear put spreads

### For Advanced
**Consider selling options strategically**
- ✅ Time decay works for you
- ✅ Higher probability of profit
- ✅ Generate income
- ❌ Requires experience
- ❌ Risk management critical

**Recommended**: Covered calls, cash-secured puts only

---

## 🆘 Troubleshooting

### Q: Why can't I see strike price field?
**A**: Select CALL or PUT instrument type first. Strike field only shows for options.

### Q: What's a reasonable premium price?
**A**: Use market data:
- In-the-money (ITM): Usually ₹100-500+
- At-the-money (ATM): Usually ₹50-200
- Out-of-the-money (OTM): Usually ₹10-100
- Check live market quotes for accurate values

### Q: How many contracts should I buy?
**A**: Position sizing rule:
- Risk per trade: 1-2% of portfolio
- Example: ₹10,000 portfolio → Risk ₹100-200 max
- Premium ₹100 → Buy 1-2 contracts max

### Q: Can I sell options immediately after buying?
**A**: Yes, if there's liquidity. Close your position anytime:
1. Click Place Order
2. Select opposite side (BUY becomes SELL, vice versa)
3. Same strike and expiry
4. Execute at market or limit price

### Q: What happens at expiry?
**A**: Contract automatically settles:
- **CALL**: If ST > Strike → Exercised, you own shares
- **PUT**: If ST < Strike → Exercised, you sell shares
- Most traders close before expiry instead

### Q: Can I use stop loss?
**A**: Yes, same as equity:
- Place SELL order at lower price (for bought calls)
- Place BUY order at lower price (for bought puts)
- Or use platform's stop loss feature if available

---

## 📚 Learning Resources

### Books
- "The Options Playbook" - Brian Overby
- "Option Volatility and Pricing" - Sheldon Natenberg
- "The Complete Guide to Options Trading" - Jim Graham

### Online Courses
- NSE Academy (Free Indian options education)
- Zerodha Varsity (Free, very comprehensive)
- TradingView tutorials (Free chart analysis)

### Websites
- NSE India official site (Options data)
- Fyers (Your broker, real-time options data)
- OptionChain tools (Free option chain viewers)

---

## ✅ Quick Checklist Before Trading Options

- [ ] Selected correct instrument type (CALL/PUT/EQUITY)
- [ ] Entered underlying symbol correctly
- [ ] Set strike price (for options)
- [ ] Selected expiry date (for options)
- [ ] Confirmed quantity (lot size)
- [ ] Set entry price appropriately
- [ ] Chosen correct side (BUY/SELL)
- [ ] Set order type (LIMIT/MARKET)
- [ ] Reviewed total cost
- [ ] Verified trading mode (Paper/Live)
- [ ] Checked available capital/margin
- [ ] Set mental stop loss
- [ ] Ready to execute

---

## 🎯 Key Takeaways

1. **Start Simple**: Buy calls when bullish, puts when bearish
2. **Limit Risk**: Only buy options (long) initially
3. **Use Stops**: Always have exit plan before entering
4. **Position Size**: Risk only 1-2% per trade
5. **Paper First**: Practice extensively in paper trading
6. **Understand Greeks**: Learn impact of time, volatility
7. **Avoid Greed**: Don't sell naked options as beginner
8. **Keep Journal**: Track all trades for learning

---

## 📞 Support

For issues with options trading in Smart Algo Trade:
1. Check this guide thoroughly
2. Verify symbol and strike price format
3. Check available margin/capital
4. Ensure expiry date is in valid format
5. Try in paper trading first
6. Contact support with trade details

---

**Remember**: Options are powerful tools but come with higher risk. Start small, learn continuously, and never risk more than you can afford to lose!

Happy Trading! 🚀

