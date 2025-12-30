# Quick P&L Reference Card

## 🎯 Where to See Your P&L

### Quick View (Order Placement)
**Location**: "Place New Order" section
**Updates**: Every 5 seconds
**Shows**: Real-time P&L summary while trading

### Detailed View (Paper Trading Tracker)
**Location**: Main Dashboard → "Paper Trading Tracker"
**Shows**: 
- 5 P&L cards (Portfolio Value, Total P&L, Realized, Unrealized, Cash)
- 3 Status indicators
- Complete trade history table
- Historical charts and statistics

---

## 📊 The 5 P&L Cards

```
┌──────────────────────────────────────────────────────────────────┐
│                       P&L DASHBOARD                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📘 Portfolio Value    🟢/🔴 Total P&L    🔵 Realized    🟪 Unrealized    🟩 Cash
│  ₹11,500             +₹1,500 (+15%)      +₹1,200        +₹300         ₹5,000
│  Initial: ₹10,000    Gain/Loss %         From Closed    From Open     Available
│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔢 Understanding P&L Numbers

### Example Trade
```
Symbol:    NSE:SBIN-EQ
Bought:    ₹500 (qty: 10)
Sold:      ₹550 (qty: 10)

RESULT:
├─ Realized P&L: +₹500 ✓ PROFIT
├─ P&L %:        +10%
└─ Status:       ✓ Closed Trade
```

### Open Position (Not Sold Yet)
```
Symbol:    NSE:INFY-EQ
Bought:    ₹1,800 (qty: 5)
Current:   ₹1,850

UNREALIZED:
├─ Unrealized P&L: +₹250
├─ P&L %:          +2.78%
└─ Status:         📈 Still open (can change)
```

---

## 🎨 Color Guide

| Color  | Meaning | When You See It |
|--------|---------|-----------------|
| 🟢 Green | Profit | When P&L > 0 |
| 🔴 Red | Loss | When P&L < 0 |
| 🔵 Blue | Portfolio Info | Total value, cash |
| 🟦 Cyan | Realized Gains | Profit from closed trades |
| 🟧 Orange | Realized Losses | Loss from closed trades |
| 🟪 Purple | Unrealized Gains | Current profit on open positions |
| 🟥 Pink | Unrealized Losses | Current loss on open positions |
| 🟩 Teal | Available Cash | Money to trade with |

---

## 📈 Trade History Table Columns

| Column | What It Shows | Example |
|--------|---------------|---------|
| Symbol | Stock name | NSE:SBIN-EQ |
| Qty | How many bought | 10 |
| Entry Price | Price when bought | ₹500 |
| Exit Price | Price when sold | ₹550 |
| P&L Amount | Profit/Loss in rupees | +₹500 or -₹200 |
| P&L % | Return as percentage | +10% or -4% |
| Status | ✓ Profit or ✗ Loss | ✓ Profit |
| Date | When trade closed | Dec 26, 2025 2:30 PM |

---

## ✅ Quick Checklist

Before placing a trade, check:
- [ ] Portfolio Value > Order Cost? (Do I have enough cash?)
- [ ] Current P&L situation (Am I up or down?)
- [ ] Realized P&L (How much have I locked in?)
- [ ] Unrealized P&L (What are my open positions worth?)

---

## 🚨 Important Notes

1. **Unrealized P&L Can Change** - Updates with market price
2. **Only Closed Trades in History** - Open positions won't show until sold
3. **Cash Decreases on BUY** - Cash increases on SELL
4. **Return % is Overall** - Based on total capital, not individual trade

---

## 💡 Tips

✓ **Do**: Review your closed trades to find patterns
✓ **Do**: Monitor unrealized losses to avoid holding losers too long
✓ **Do**: Track return % over time to measure true performance
✓ **Do**: Update portfolio value frequently (auto-refreshes every 5 sec)

✗ **Don't**: Panic on negative unrealized P&L (just means price dropped)
✗ **Don't**: Hold losers hoping they'll recover
✗ **Don't**: Focus only on amount, also check percentage returns

---

## 🔄 How P&L Gets Updated

| Action | What Happens |
|--------|--------------|
| Place BUY order | Cash decreases, open position created |
| Place SELL order (new) | Creates new open position or closes existing |
| Market price changes | Unrealized P&L updates |
| Close all units | Realized P&L recorded, position removed |
| Refresh button | Manually updates display |

---

**Remember**: Paper trading P&L shows you exactly how much you'd make/lose with real money. Use it to practice before trading live! 🚀
