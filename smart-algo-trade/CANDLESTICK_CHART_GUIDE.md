# Advanced Candlestick Chart - Usage Guide

## Overview

The `AdvancedCandlestickChart` component is a production-ready, interactive candlestick chart with real-time WebSocket data, historical loading, technical indicators, zoom, and crosshair functionality.

## Features

✅ **Real-Time Data**: WebSocket integration with automatic reconnection  
✅ **Historical Data**: Load up to 500 candles from API  
✅ **Timeframe Switching**: 1M, 5M, 15M, 1H, 4H, 1D, 1W, 1M  
✅ **Zoom**: 20% to 200% with smooth scaling  
✅ **Crosshair**: Interactive price tracking with mouse  
✅ **6 Indicators**: SMA20, SMA50, EMA12, RSI, Bollinger Bands, MACD  
✅ **Custom Rendering**: Candlestick wicks and bodies  
✅ **Error Handling**: Fallback to mock data if API unavailable  
✅ **Performance Optimized**: Memoized calculations, efficient re-renders  

## Installation

### 1. Add Dependencies

```bash
npm install recharts lucide-react
```

These packages are likely already in your project.

### 2. Verify File Structure

Ensure these files exist:
```
src/
  ├── components/
  │   └── AdvancedCandlestickChart.tsx
  ├── services/
  │   └── marketDataWebSocket.ts
  └── utils/
      └── technicalIndicators.ts
```

### 3. Backend Endpoints

Verify these endpoints are running:

**WebSocket Endpoint:**
```
ws://127.0.0.1:8001/ws/market-data
```

**Historical Data API:**
```
GET /api/portfolio/history?symbol=NSE:INFY-EQ&resolution=1d&limit=100
```

## Basic Usage

### Simple Integration

```tsx
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

export default function Dashboard() {
  return (
    <div className="w-full h-screen">
      <AdvancedCandlestickChart 
        symbol="NSE:INFY-EQ"
        defaultTimeframe="1D"
        height={600}
      />
    </div>
  );
}
```

### With Custom Configuration

```tsx
<AdvancedCandlestickChart
  symbol="NSE:TCS-EQ"
  defaultTimeframe="1H"
  height={800}
/>
```

## Component Props

```typescript
interface AdvancedCandlestickChartProps {
  /** Trading symbol (e.g., 'NSE:INFY-EQ') */
  symbol: string;
  
  /** Default timeframe: '1M' | '5M' | '15M' | '1H' | '4H' | '1D' | '1W' | '1M' */
  defaultTimeframe?: string;
  
  /** Chart height in pixels (default: 600) */
  height?: number;
}
```

## Supported Symbols

```
NSE:SBIN-EQ    - State Bank of India
NSE:INFY-EQ    - Infosys
NSE:TCS-EQ     - Tata Consultancy Services
NSE:RELIANCE-EQ - Reliance Industries
NSE:WIPRO-EQ   - Wipro
```

(Add more in `src/services/marketDataWebSocket.ts` mock data)

## Timeframes

| Timeframe | Duration | Candles (500 limit) |
|-----------|----------|-------------------|
| 1M        | 1 Min    | 8.3 hours         |
| 5M        | 5 Min    | 41.6 hours        |
| 15M       | 15 Min   | 5.2 days          |
| 1H        | 1 Hour   | 20.8 days         |
| 4H        | 4 Hours  | 83.3 days         |
| 1D        | 1 Day    | 1.4 years         |
| 1W        | 1 Week   | 9.6 years         |
| 1M        | 1 Month  | 41.6 years        |

## Controls

### Timeframe Selection
- Click timeframe buttons (1M, 5M, 15M, 1H, 4H, 1D, 1W, 1M)
- Active timeframe highlighted in blue
- Automatically reloads historical data

### Zoom Controls
- **Zoom In**: Increases detail (up to 200%)
- **Zoom Out**: Shows wider view (down to 20%)
- Displays current zoom percentage
- Smooth scaling with all indicators

### Crosshair
- **Toggle**: Click crosshair icon
- **Mouse**: Move over chart to see prices
- Shows O/H/L/C values in tooltip
- Updates in real-time

### Indicator Toggles
- Click **⚙️ Settings** to open indicator panel
- Toggle indicators on/off:
  - SMA20 - Simple Moving Average (20-period)
  - SMA50 - Simple Moving Average (50-period)
  - EMA12 - Exponential Moving Average (12-period)
  - RSI - Relative Strength Index (14-period)
  - Bollinger Bands - (20-period, 2 std dev)
  - MACD - Moving Average Convergence Divergence

### Reset Button
- Resets zoom to 100%
- Reloads all historical data
- Reconnects WebSocket if disconnected

## Indicators Explained

### SMA (Simple Moving Average)
- **SMA20**: 20-period average (green line)
- **SMA50**: 50-period average (blue line)
- Use: Identify trend direction
- Formula: Sum of last N closes / N

### EMA (Exponential Moving Average)
- **EMA12**: 12-period exponential average (orange line)
- Use: Faster response than SMA
- Formula: Current price × smoothing factor + EMA(prev) × (1 - smoothing factor)

### RSI (Relative Strength Index)
- **Period**: 14 candles
- **Range**: 0-100
- **Interpretation**:
  - Below 30: Oversold (potential buy)
  - Above 70: Overbought (potential sell)
  - 30-70: Normal range
- **Subplot**: Shown below main chart in purple

### Bollinger Bands
- **Parameters**: 20-period SMA, 2 standard deviations
- **Bands**: Upper and lower boundaries (light blue)
- **Middle**: 20-period SMA
- **Use**: Volatility indicator, support/resistance
- **Interpretation**:
  - Price at upper band: Overbought
  - Price at lower band: Oversold

### MACD (Moving Average Convergence Divergence)
- **Parameters**: 12-26-9 periods
- **Lines**: MACD line (blue), Signal line (red), Histogram (gray)
- **Use**: Momentum and trend confirmation
- **Interpretation**:
  - MACD crosses above signal line: Bullish
  - MACD crosses below signal line: Bearish

## Real-Time Data Flow

### 1. Component Mounts
```typescript
// Loads historical data
GET /api/portfolio/history?symbol=NSE:INFY-EQ&resolution=1d&limit=100
```

### 2. WebSocket Connection Established
```typescript
// Connects to WebSocket
WebSocket: ws://127.0.0.1:8001/ws/market-data

// Sends subscription
{
  "type": "subscribe",
  "channel": "candle",
  "symbol": "NSE:INFY-EQ",
  "timeframe": "1d"
}
```

### 3. Live Updates Received
```typescript
// Receives real-time candle updates
{
  "type": "candle",
  "symbol": "NSE:INFY-EQ",
  "timeframe": "1d",
  "candle": {
    "time": 1704067200000,
    "open": 1850.50,
    "high": 1865.25,
    "low": 1845.00,
    "close": 1860.75,
    "volume": 2500000
  },
  "isNewCandle": true
}
```

### 4. Chart Updates
- Last candle updated in real-time
- New candles added as they form
- Indicators recalculated automatically
- All visible lines/bands updated

## WebSocket Connection

### Auto-Reconnection

If WebSocket disconnects, it automatically reconnects with exponential backoff:
- 1st attempt: 1 second
- 2nd attempt: 2 seconds
- 3rd attempt: 4 seconds
- 4th attempt: 8 seconds
- 5th attempt: 16 seconds

### Connection Status

Watch for these console logs:
```
✓ WebSocket connected
✗ WebSocket disconnected
⟳ Attempting to reconnect...
```

### Fallback Behavior

If WebSocket unavailable:
1. Chart loads historical data from API
2. Mock service simulates real-time updates
3. Indicators still calculate correctly
4. User experience unaffected

## Performance Tips

### 1. Limit Candles
```tsx
// Good for performance
<AdvancedCandlestickChart
  symbol="NSE:INFY-EQ"
  // Chart limits to 500 candles max
/>

// Not recommended for production
// Loading 5000+ candles will cause lag
```

### 2. Memoize Parent Component
```tsx
import { memo } from 'react';

const Dashboard = memo(() => {
  return <AdvancedCandlestickChart symbol="NSE:INFY-EQ" />;
});

export default Dashboard;
```

### 3. Disable Unnecessary Indicators
```tsx
// Settings panel allows toggling indicators
// Disable indicators you don't need to improve performance
```

## Error Handling

### Missing Historical Data
- Component automatically falls back to mock data
- Check console for API error messages
- Verify `/api/portfolio/history` endpoint is running

### WebSocket Connection Failed
- Component uses mock market data service
- Real-time updates simulated with intervals
- Still provides full chart functionality

### Invalid Symbol
- Check symbol format: `NSE:SYMBOL-EQ`
- Use symbol from available symbols list
- Case-sensitive

## Customization

### Change Colors

Edit `AdvancedCandlestickChart.tsx`:

```typescript
// Candlestick colors
const candleColor = candle.close >= candle.open ? '#22c55e' : '#ef4444';
// Green for up, red for down

// Indicator colors
const indicatorColors = {
  sma20: '#22c55e',    // Green
  sma50: '#3b82f6',    // Blue
  ema12: '#f97316',    // Orange
  rsi: '#a855f7',      // Purple
  bb: '#0ea5e9',       // Cyan
  macd: '#64748b',     // Slate
};
```

### Add Custom Indicators

1. Add calculation function in `src/utils/technicalIndicators.ts`:
```typescript
export function calculateCustomIndicator(candles: Candle[]): number[] {
  // Your calculation logic
  return values;
}
```

2. Add to component state:
```typescript
const [indicators, setIndicators] = useState({
  // ... existing
  customIndicator: false
});
```

3. Add to display logic:
```typescript
{indicators.customIndicator && (
  <Line
    dataKey="customIndicator"
    stroke="#your-color"
    dot={false}
  />
)}
```

### Change Chart Height

```tsx
<AdvancedCandlestickChart
  symbol="NSE:INFY-EQ"
  height={1000}  // Larger chart
/>
```

## Testing

### 1. Test with Mock Data

Component automatically uses mock data if WebSocket unavailable. To force mock:

Edit `src/services/marketDataWebSocket.ts`:
```typescript
// Force mock service (comment out real WebSocket)
const service = new MockMarketDataService();
```

### 2. Test Different Timeframes

Click each timeframe button and verify:
- Data reloads
- Candles appear correctly
- Indicators recalculate

### 3. Test Zoom

Use zoom buttons and verify:
- Chart scales smoothly
- All lines scale proportionally
- Numbers remain readable

### 4. Test Indicators

Toggle each indicator and verify:
- Lines appear/disappear
- Colors are distinct
- Calculations appear correct (compare with TradingView)

## Troubleshooting

### Chart Not Loading

**Problem**: Blank chart appears
- Check browser console for errors
- Verify `/api/portfolio/history` endpoint exists
- Test with mock data enabled

**Solution**:
```bash
# Check backend is running
curl http://127.0.0.1:8001/health

# Check endpoint
curl "http://127.0.0.1:8001/api/portfolio/history?symbol=NSE:INFY-EQ"
```

### WebSocket Not Connecting

**Problem**: Console shows "WebSocket connection failed"
- Check WebSocket endpoint is running
- Verify URL: `ws://127.0.0.1:8001/ws/market-data`
- Check CORS settings in FastAPI

**Solution**: Component will use mock data automatically

### Indicators Not Showing

**Problem**: Lines/bands don't appear
- Verify indicator is toggled on in Settings
- Check browser DevTools → Elements → verify DOM
- Clear browser cache

### Performance Issues

**Problem**: Chart is slow/laggy
- Reduce number of candles (use shorter timeframes)
- Disable unnecessary indicators
- Check for other heavy processes
- Use production build (not dev mode)

### Real-Time Updates Not Working

**Problem**: Candles don't update in real-time
- WebSocket must be connected (check console)
- Verify backend is sending updates
- Check symbol matches subscription
- Zoom out to see updates (if zoomed in, updates might be off-screen)

## Advanced Usage

### Multi-Symbol Dashboard

```tsx
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

export default function MultiChartDashboard() {
  const symbols = ['NSE:INFY-EQ', 'NSE:TCS-EQ', 'NSE:SBIN-EQ'];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {symbols.map(symbol => (
        <AdvancedCandlestickChart
          key={symbol}
          symbol={symbol}
          height={400}
        />
      ))}
    </div>
  );
}
```

### Controlled Component (Future Enhancement)

```tsx
// Potential future enhancement:
// Allow parent to control timeframe, zoom, indicators
const [activeTimeframe, setActiveTimeframe] = useState('1D');
const [zoom, setZoom] = useState(100);

<AdvancedCandlestickChart
  symbol="NSE:INFY-EQ"
  timeframe={activeTimeframe}
  onTimeframeChange={setActiveTimeframe}
  zoom={zoom}
  onZoomChange={setZoom}
/>
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (12+)
- Mobile: ⚠️ Limited (responsive but best on desktop)

## File Structure

```
src/
├── components/
│   └── AdvancedCandlestickChart.tsx     # Main chart component (1200 lines)
│       ├── State management
│       ├── Historical data loading
│       ├── WebSocket integration
│       ├── Indicator calculations
│       ├── Zoom controls
│       ├── Crosshair tracking
│       └── Custom candlestick rendering
│
├── services/
│   └── marketDataWebSocket.ts           # WebSocket manager (200 lines)
│       ├── Connection management
│       ├── Auto-reconnection logic
│       ├── Pub/sub callbacks
│       └── Mock fallback service
│
└── utils/
    └── technicalIndicators.ts           # Indicator calculations (300 lines)
        ├── SMA calculation
        ├── EMA calculation
        ├── RSI calculation
        ├── MACD calculation
        ├── Bollinger Bands
        ├── ATR calculation
        └── Batch helpers
```

## API Integration

### Using Real Fyers Data

Edit `src/services/marketDataWebSocket.ts`:

```typescript
// Replace mock data with Fyers API calls
import { fyers_api } from '@/config/fyers';

async function getHistoricalData(symbol: string, resolution: string) {
  const response = await fyers_api.getHistoricalData({
    symbol,
    resolution,
    date_format: 'unix',
    range_from: Math.floor(Date.now() / 1000) - 86400 * 30,
    range_to: Math.floor(Date.now() / 1000),
  });
  return response.candles;
}
```

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify all endpoints are running
3. Review troubleshooting section above
4. Check component props and usage examples

## License

Part of Smart Algo Trade v3.0.1
Production-ready code for educational and trading purposes.
