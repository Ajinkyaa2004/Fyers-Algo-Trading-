# ApexCharts Integration Guide

## Overview
ApexCharts has been successfully integrated into the Smart Algorithmic Trading System for advanced data visualization and technical analysis. This provides professional-grade interactive charts with superior performance and features compared to Recharts.

## Installation
ApexCharts and its React wrapper have been installed:
```bash
npm install apexcharts react-apexcharts --save
```

## Components Created

### 1. **ApexCandleChart** (`src/components/ApexCandleChart.tsx`)
Displays candlestick charts for OHLC (Open, High, Low, Close) price data.

**Features:**
- Real-time price action visualization
- Professional candlestick rendering (green for up, red for down)
- Interactive toolbar with zoom, pan, and reset
- Dark/light theme support
- Customizable height and symbol display

**Usage:**
```tsx
import ApexCandleChart from '../components/ApexCandleChart';

<ApexCandleChart 
  data={candleData}
  symbol="NIFTY50"
  height={400}
  theme="dark"
/>
```

**Data Format:**
```typescript
interface CandleData {
  x: string | number;  // Date/time
  y: [number, number, number, number]; // [open, high, low, close]
}
```

---

### 2. **ApexLineChart** (`src/components/ApexLineChart.tsx`)
Displays multi-line charts for price movements and technical indicators.

**Features:**
- Multiple data series support (price, EMA 20, EMA 50, etc.)
- Smooth curve interpolation
- Color-coded lines
- Tooltip with formatted price display
- Category X-axis with custom labels

**Usage:**
```tsx
import ApexLineChart from '../components/ApexLineChart';

<ApexLineChart 
  data={lineChartData}
  xAxisLabels={dates}
  title="Price with Moving Averages"
  yAxisTitle="Price (₹)"
  height={350}
  theme="dark"
/>
```

**Data Format:**
```typescript
interface LineChartData {
  name: string;
  data: (number | null)[];
}
```

---

### 3. **ApexAreaChart** (`src/components/ApexAreaChart.tsx`)
Displays area charts with gradient fills for portfolio value tracking.

**Features:**
- Filled area charts with gradient
- Multiple area series support
- Smooth interpolation
- Portfolio value visualization
- Professional color gradient

**Usage:**
```tsx
import ApexAreaChart from '../components/ApexAreaChart';

<ApexAreaChart 
  data={areaData}
  xAxisLabels={dates}
  title="Portfolio Growth"
  yAxisTitle="Value (₹)"
  height={350}
  theme="dark"
/>
```

---

### 4. **ApexBarChart** (`src/components/ApexBarChart.tsx`)
Displays bar charts for comparing trading metrics.

**Features:**
- Vertical and horizontal bar support
- Multiple data series
- Color-coded bars
- Category grouping
- Trading activity visualization

**Usage:**
```tsx
import ApexBarChart from '../components/ApexBarChart';

<ApexBarChart 
  data={barData}
  xAxisLabels={['Winning Trades', 'Losing Trades']}
  title="Trade Outcomes"
  horizontal={false}
  theme="dark"
/>
```

---

### 5. **ApexPieChart** (`src/components/ApexPieChart.tsx`)
Displays donut/pie charts for portfolio allocation.

**Features:**
- Donut and pie chart types
- Portfolio allocation visualization
- Center label support
- Interactive segments
- Asset distribution display

**Usage:**
```tsx
import ApexPieChart from '../components/ApexPieChart';

<ApexPieChart 
  series={[65, 35]}
  labels={['Stocks', 'Cash']}
  title="Portfolio Allocation"
  type="donut"
  theme="dark"
/>
```

---

### 6. **ApexIndicatorChart** (`src/components/ApexIndicatorChart.tsx`)
Displays technical indicators (RSI, MACD, Bollinger Bands, etc.).

**Features:**
- Dual Y-axis support (price on left, indicators on right)
- Multiple indicator support
- Technical analysis visualization
- Professional indicator rendering

**Usage:**
```tsx
import ApexIndicatorChart from '../components/ApexIndicatorChart';

<ApexIndicatorChart 
  priceData={priceData}
  indicatorData={[rsiData, macdData]}
  xAxisLabels={dates}
  title="Technical Indicators"
  theme="dark"
/>
```

---

## Main Dashboard Integration

### MarketAnalysisApex (`src/pages/MarketAnalysisApex.tsx`)

The new Market Analysis page uses ApexCharts for all visualizations:

**Key Sections:**

1. **Price Action - Candlestick Chart**
   - Real-time OHLC data visualization
   - Professional price action analysis
   - Toolbar for interactive exploration

2. **Price with Moving Averages**
   - Close price with EMA 20 and EMA 50
   - Technical analysis indicators
   - Multiple time-series visualization

3. **Portfolio Allocation (Donut Chart)**
   - Cash vs. Positions breakdown
   - Asset distribution visualization
   - Interactive segments

4. **Trading Activity (Bar Chart)**
   - Winning vs. Losing trades
   - Win/Loss rate visualization
   - Performance metrics display

**Features:**
- Real-time data fetching (5-second interval)
- Performance metrics dashboard
- Trade placement modal
- Symbol selection
- Drawing tools documentation
- Export capabilities

---

## API Integration

The charts pull data from these backend endpoints:

```
GET /api/paper-trading/portfolio          → Portfolio value data
GET /api/paper-trading/history             → Historical price data
GET /api/paper-trading/stats               → Trading statistics
GET /api/market/quote?symbols=...          → Real-time quotes
```

---

## Chart Features & Capabilities

### Interactive Tools (Built-in)
- **Zoom**: Magnify specific price regions
- **Pan**: Navigate through historical data
- **Reset**: Return to original view
- **Download**: Export chart as PNG/SVG
- **Selection**: Interactive data point selection

### Theming
All charts support:
- **Dark Theme** (default): Professional trading interface
- **Light Theme**: Alternative bright interface
- **Custom Colors**: Configurable color schemes

### Responsive Design
- Automatically scales to container width
- Touch-friendly on mobile devices
- Maintains aspect ratio
- Responsive toolbar

### Performance
- Optimized rendering for large datasets
- Smooth animations and transitions
- Efficient memory usage
- Real-time data updates

---

## Data Transformation Examples

### Transform API Data to Candlestick Format
```typescript
const chartData = historicalData.map(d => ({
  x: d.date || new Date().toISOString(),
  y: [parseFloat(d.open), parseFloat(d.high), parseFloat(d.low), parseFloat(d.close)]
}));
```

### Transform API Data to Line Chart Format
```typescript
const lineChartData = [
  {
    name: 'Close Price',
    data: historicalData.map(d => parseFloat(d.close) || 0)
  },
  {
    name: 'EMA 20',
    data: historicalData.map(d => parseFloat(d.ema_20) || null)
  }
];
```

### Portfolio Allocation Calculation
```typescript
const portfolioAllocations = [
  (portfolio.cash / portfolio.current_value) * 100,
  (portfolio.positions_value / portfolio.current_value) * 100
];
```

---

## Configuration Examples

### Dark Theme Candlestick Chart
```typescript
const options = {
  chart: {
    type: 'candlestick',
    background: '#1f2937'
  },
  title: {
    text: 'NSE:NIFTY50',
    style: {
      color: '#f3f4f6',
      fontSize: '16px'
    }
  },
  plotOptions: {
    candlestick: {
      colors: {
        upward: '#10b981',  // Green for up
        downward: '#ef4444' // Red for down
      }
    }
  },
  tooltip: {
    theme: 'dark'
  }
};
```

### Gradient Area Chart
```typescript
const options = {
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.45,
      opacityTo: 0.05
    }
  },
  colors: ['#3b82f6', '#10b981', '#f59e0b']
};
```

---

## Advanced Features

### 1. Multiple Y-Axis (Dual Axis Charts)
Used in ApexIndicatorChart for comparing price with indicators:
```typescript
yaxis: [
  {
    title: { text: 'Price' },
    // Left axis
  },
  {
    opposite: true,
    title: { text: 'Indicator Value' }
    // Right axis
  }
]
```

### 2. Custom Tooltip Formatting
```typescript
tooltip: {
  x: {
    format: 'dd MMM yyyy HH:mm'
  },
  y: {
    formatter: (val: number) => `₹${val.toFixed(2)}`
  }
}
```

### 3. Category Grouping in Bar Charts
```typescript
xaxis: {
  categories: ['Buy Signals', 'Sell Signals', 'Hold'],
  labels: { style: { colors: '#9ca3af' } }
}
```

---

## Styling & Customization

### Grid and Border Colors (Dark Theme)
```typescript
grid: {
  borderColor: '#374151',
  show: true
}
```

### Label Colors (Responsive)
```typescript
labels: {
  style: {
    colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
  }
}
```

---

## Performance Optimization

1. **Memoization**: Charts use useMemo for data transformation
2. **Lazy Loading**: Charts load on-demand
3. **Efficient Updates**: Only update when data changes
4. **Large Dataset Handling**: Optimized for 1000+ data points

---

## Troubleshooting

### Chart Not Rendering
- Check data format matches interface
- Verify data array is not empty
- Ensure theme prop is valid ('light' | 'dark')

### Missing Data Points
- Null/undefined values are skipped in line charts
- Use 0 instead of null for bar charts
- Ensure all data points have valid timestamps

### Performance Issues
- Reduce number of series on large datasets
- Increase update interval for real-time data
- Use smaller time intervals for candles

---

## Next Steps

1. **Integrate with Live WebSocket Data**
   - Real-time price updates
   - Streaming indicators

2. **Add Technical Indicators**
   - RSI, MACD, Bollinger Bands
   - Volume analysis

3. **Implement Drawing Tools**
   - Trend lines
   - Support/resistance levels
   - Chart annotations

4. **Export Features**
   - PDF reports
   - CSV data export
   - Chart images

5. **Advanced Analytics**
   - Performance attribution
   - Risk metrics visualization
   - Correlation analysis

---

## File Structure
```
src/
├── components/
│   ├── ApexCandleChart.tsx       # Candlestick charts
│   ├── ApexLineChart.tsx          # Line charts with indicators
│   ├── ApexAreaChart.tsx          # Area charts for portfolio
│   ├── ApexBarChart.tsx           # Bar charts for metrics
│   ├── ApexPieChart.tsx           # Donut/Pie charts
│   └── ApexIndicatorChart.tsx     # Technical indicators
└── pages/
    └── MarketAnalysisApex.tsx     # Main dashboard with all charts
```

---

## Documentation Links
- [ApexCharts Official Docs](https://apexcharts.com/)
- [React ApexCharts](https://apexcharts.com/docs/react/)
- [Chart Types](https://apexcharts.com/docs/chart-types/)
- [Configuration Options](https://apexcharts.com/docs/options/)

---

## License & Compatibility
- ApexCharts: MIT License
- React Integration: Compatible with React 18+
- TypeScript: Full type support included
- Dark Mode: Fully supported with custom theming

