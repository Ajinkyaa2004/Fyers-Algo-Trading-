# Candlestick Chart - Quick Reference Card

## 🚀 30-Second Setup

```tsx
// 1. Import
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

// 2. Use (anywhere in your React app)
<AdvancedCandlestickChart symbol="NSE:INFY-EQ" />

// 3. Done! 🎉
```

---

## 📊 Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `symbol` | string | Required | Trading symbol (e.g., 'NSE:INFY-EQ') |
| `defaultTimeframe` | string | '1D' | Initial timeframe (1M, 5M, 15M, 1H, 4H, 1D, 1W, 1M) |
| `height` | number | 600 | Chart height in pixels |

---

## 🎮 User Controls

| Control | Action | Result |
|---------|--------|--------|
| Timeframe Buttons | Click 1M/5M/15M/1H/4H/1D/1W/1M | Reload data, update chart |
| Zoom In | Click +20% | Scale up (max 200%) |
| Zoom Out | Click -20% | Scale down (min 20%) |
| Reset | Click Reset button | Return to 100% zoom |
| Crosshair | Click 🎯 button | Toggle price tracking |
| Settings | Click ⚙️ button | Toggle indicators on/off |
| Mouse | Move over chart | Update crosshair position |

---

## 📈 Indicators Reference

| Indicator | Type | Color | Use Case |
|-----------|------|-------|----------|
| SMA20 | Trend | Green | Short-term trend |
| SMA50 | Trend | Blue | Medium-term trend |
| EMA12 | Trend | Orange | Fast response |
| RSI | Momentum | Purple | Overbought/oversold |
| BB | Volatility | Cyan | Support/resistance |
| MACD | Momentum | Gray | Trend confirmation |

### Indicator Interpretation

**SMA** (Moving Averages)
- Price above SMA → Uptrend
- Price below SMA → Downtrend
- Price crosses SMA → Potential reversal

**RSI** (Relative Strength Index)
- Below 30 → Oversold (buy signal)
- Above 70 → Overbought (sell signal)
- 30-70 → Normal range

**Bollinger Bands**
- Price at upper band → Resistance/overbought
- Price at lower band → Support/oversold
- Band widening → Increasing volatility

**MACD** (Moving Average Convergence)
- MACD > Signal → Bullish
- MACD < Signal → Bearish
- Crossover → Potential trade signal

---

## 🔗 API Endpoints

### WebSocket
**Connect to**:
```
ws://127.0.0.1:8001/ws/market-data
```

**Subscribe**:
```json
{
  "type": "subscribe",
  "channel": "candle",
  "symbol": "NSE:INFY-EQ",
  "timeframe": "1d"
}
```

### REST API
**Get Historical Data**:
```
GET /api/portfolio/history?symbol=NSE:INFY-EQ&resolution=1d&limit=100
```

**List Symbols**:
```
GET /api/portfolio/symbols
```

**List Resolutions**:
```
GET /api/portfolio/resolutions
```

---

## 🎨 Customization Cheat Sheet

### Change Colors
Edit `AdvancedCandlestickChart.tsx`:
```typescript
// Candlestick colors
const candleColor = candle.close >= candle.open ? '#22c55e' : '#ef4444';
```

### Change Height
```tsx
<AdvancedCandlestickChart height={1000} />
```

### Change Default Timeframe
```tsx
<AdvancedCandlestickChart defaultTimeframe="1H" />
```

### Change Symbol
```tsx
<AdvancedCandlestickChart symbol="NSE:TCS-EQ" />
```

### Disable Specific Indicator
Edit component state:
```typescript
const [indicators, setIndicators] = useState({
  sma20: true,
  sma50: true,
  ema12: false,  // Disabled
  rsi: true,
  bb: true,
  macd: true
});
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Chart is blank | API not running | Start backend: `python main.py` |
| No real-time updates | WebSocket failed | Check backend, component uses mock data |
| Indicators not showing | Toggled off | Open Settings (⚙️) and toggle on |
| Chart is slow | Too many candles | Use shorter timeframe or fewer indicators |
| WebSocket disconnected | Network issue | Wait 5s, component auto-reconnects |

---

## 📝 Code Examples

### Example 1: Simple Dashboard
```tsx
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

export default function Dashboard() {
  return (
    <div>
      <h1>Market Analysis</h1>
      <AdvancedCandlestickChart symbol="NSE:INFY-EQ" />
    </div>
  );
}
```

### Example 2: Multiple Symbols
```tsx
const symbols = ['NSE:INFY-EQ', 'NSE:TCS-EQ', 'NSE:SBIN-EQ'];

export default function MultiChart() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {symbols.map(sym => (
        <AdvancedCandlestickChart key={sym} symbol={sym} height={400} />
      ))}
    </div>
  );
}
```

### Example 3: With Symbol Selector
```tsx
import { useState } from 'react';
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

export default function SelectableChart() {
  const [symbol, setSymbol] = useState('NSE:INFY-EQ');

  return (
    <div>
      <select value={symbol} onChange={e => setSymbol(e.target.value)}>
        <option value="NSE:INFY-EQ">Infosys</option>
        <option value="NSE:TCS-EQ">TCS</option>
        <option value="NSE:SBIN-EQ">SBI</option>
      </select>
      <AdvancedCandlestickChart key={symbol} symbol={symbol} />
    </div>
  );
}
```

---

## 🔄 Data Flow

```
1. Component Mounts
   ↓
2. Historical Data Loaded
   ↓
3. Chart Renders
   ↓
4. WebSocket Connected
   ↓
5. Real-Time Updates Arrive
   ↓
6. Chart Updates (Repeat 5-6)
```

---

## ⚡ Performance Tips

| Tip | Benefit |
|-----|---------|
| Use longer timeframes (1D+) | Fewer candles = faster |
| Disable unnecessary indicators | Faster calculations |
| Keep only 1-2 charts visible | Reduced CPU usage |
| Use production build | ~3x faster than dev |
| Cache components with `memo()` | Prevent unnecessary re-renders |

---

## 📱 Mobile Responsive

Component is responsive and works on mobile:

```tsx
// Mobile (height auto-adjusts)
<AdvancedCandlestickChart symbol="NSE:INFY-EQ" height={400} />
```

---

## 🎯 Keyboard Shortcuts (Future)

| Shortcut | Action | Status |
|----------|--------|--------|
| `T` | Toggle timeframe | Planned |
| `Z` | Zoom in/out | Planned |
| `I` | Toggle indicators | Planned |
| `R` | Reset view | Planned |
| `H` | Show help | Planned |

---

## 📊 Supported Timeframes

| Code | Duration | Use Case |
|------|----------|----------|
| 1M | 1 Minute | Scalping, very short-term |
| 5M | 5 Minutes | Short-term trading |
| 15M | 15 Minutes | Short-medium term |
| 1H | 1 Hour | Medium term |
| 4H | 4 Hours | Swing trading |
| 1D | 1 Day | Position trading |
| 1W | 1 Week | Long-term trend |
| 1M | 1 Month | Investment horizon |

---

## 🔐 Production Checklist

Before deploying to production:

- [ ] Backend running and accessible
- [ ] WebSocket endpoint working
- [ ] Historical data API responding
- [ ] All dependencies installed
- [ ] No console errors
- [ ] Real-time updates visible
- [ ] Tested on target browsers
- [ ] Performance acceptable
- [ ] Error messages user-friendly
- [ ] Documentation reviewed

---

## 📞 Need Help?

1. **Setup Issues**: Check `CANDLESTICK_CHART_GUIDE.md` Installation section
2. **Usage Questions**: See `CANDLESTICK_CHART_EXAMPLES.tsx`
3. **Troubleshooting**: Read `CANDLESTICK_CHART_GUIDE.md` Troubleshooting section
4. **Implementation**: Check `CANDLESTICK_CHART_IMPLEMENTATION_CHECKLIST.md`

---

## 🎁 Included Files

```
✅ Frontend Component       src/components/AdvancedCandlestickChart.tsx
✅ WebSocket Service        src/services/marketDataWebSocket.ts
✅ Technical Indicators     src/utils/technicalIndicators.ts
✅ Backend WebSocket        backend/app/api/websocket_market.py
✅ Backend Historical Data  backend/app/api/historical_data.py
✅ Main Documentation       CANDLESTICK_CHART_GUIDE.md
✅ Implementation Guide     CANDLESTICK_CHART_IMPLEMENTATION_CHECKLIST.md
✅ Code Examples            CANDLESTICK_CHART_EXAMPLES.tsx
✅ Detailed Summary         CANDLESTICK_CHART_SUMMARY.md
✅ Quick Reference          This file
```

---

## 🚀 Quick Start Command

```bash
# 1. Start backend
cd backend && python main.py &

# 2. Import in your React component
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

# 3. Use it
<AdvancedCandlestickChart symbol="NSE:INFY-EQ" />

# 4. Start frontend
npm run dev

# 5. Open browser and enjoy! 🎉
```

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Part of**: Smart Algo Trade v3.0.1

Print this card for quick reference! 📋
