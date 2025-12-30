# Historical Data & Past Data Features

## What's Available Now

### 1. **Historical Chart Component** ✅
A comprehensive charting component with:
- **Interactive Charts**: Candlestick charts with line overlay
- **Multiple Timeframes**: 
  - 1-minute (1)
  - 5-minute (5)
  - 15-minute (15)
  - 1-hour (60)
  - Daily (D)
  - Weekly (W)
  - Monthly (M)
- **Statistics Display**: High, Low, Change, Total Volume
- **Data Table**: Shows last 20 candles with detailed OHLC data
- **Auto-refresh**: Updates on demand or at intervals

### 2. **Backend API Endpoint** ✅
`GET /api/portfolio/history`

**Parameters:**
- `symbol` (required): e.g., `NSE:NIFTY50-INDEX`, `NSE:BANKNIFTY25-INDEX`
- `resolution` (optional): `D`, `W`, `M`, `1`, `5`, `15`, `60` (default: `D`)
- `range_from` (optional): Unix timestamp for start date
- `range_to` (optional): Unix timestamp for end date

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": 1703601000,
      "open": 19500.0,
      "high": 19650.0,
      "low": 19450.0,
      "close": 19600.0,
      "volume": 1250000
    }
    // ... more candles
  ]
}
```

### 3. **Where to View Historical Data**

1. **Live Market Page** (`/live-market`)
   - Go to http://127.0.0.1:3000/live-market
   - Select a symbol from the dropdown
   - Scroll down to see "Historical Data & Charts" section
   - Charts show selected symbol's history

2. **Using the Component in Code**
```tsx
import { HistoricalChart } from '../components/HistoricalChart';

// Use anywhere:
<HistoricalChart symbol="NSE:INFY" />
```

### 4. **Supported Symbols**
- Index Symbols: `NSE:NIFTY50-INDEX`, `NSE:BANKNIFTY25-INDEX`, `NSE:FINNIFTY25-INDEX`
- Stock Symbols: `NSE:INFY`, `NSE:TCS`, `NSE:RELIANCE`, etc.
- Use the search endpoint to find valid symbols: `/api/portfolio/search?query=INFY`

## Features Included

✅ Candlestick charts with OHLC data
✅ Multiple timeframe support
✅ Historical statistics (High, Low, Change, Volume)
✅ Data table with last 20 candles
✅ Auto-refresh capability
✅ Error handling and "no data" messaging
✅ Responsive design
✅ Real-time timeframe switching

## Data Available
- **Open**: Opening price for the period
- **High**: Highest price reached
- **Low**: Lowest price reached  
- **Close**: Closing price
- **Volume**: Trading volume
- **Timestamp**: Time of the candle

## Known Limitations
- Market data only available during trading hours
- Historical data depends on Fyers API availability
- Intraday data (1min, 5min, etc.) only available while market is open

## Future Enhancements (Optional)
- [ ] Add more technical indicators (MA, RSI, MACD, etc.)
- [ ] Add comparison between multiple symbols
- [ ] Export data to CSV
- [ ] Add custom date range picker
- [ ] Add more chart types (Line, Area, etc.)
- [ ] Add moving averages overlay
- [ ] Add pattern recognition

## Testing
To test when market is open:
1. Go to Live Market page
2. Select a symbol
3. Choose different timeframes
4. See candlestick data update
5. View statistics and table below chart
