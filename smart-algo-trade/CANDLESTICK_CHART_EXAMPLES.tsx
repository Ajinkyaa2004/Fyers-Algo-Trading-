/**
 * Example: Integrating Advanced Candlestick Chart
 * 
 * This file shows how to integrate the AdvancedCandlestickChart
 * component into your existing dashboard.
 */

// ============================================================================
// Example 1: Simple Integration in Dashboard
// ============================================================================

import React from 'react';
import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

export default function TradingDashboard() {
  return (
    <div className="w-full h-screen bg-zinc-900">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-6">Trading Dashboard</h1>
        
        {/* Add the chart component */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Market Analysis - NSE:INFY-EQ
          </h2>
          <AdvancedCandlestickChart 
            symbol="NSE:INFY-EQ"
            defaultTimeframe="1D"
            height={600}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Multi-Symbol Dashboard
// ============================================================================

export function MultiChartDashboard() {
  const symbols = [
    'NSE:INFY-EQ',
    'NSE:TCS-EQ',
    'NSE:SBIN-EQ',
    'NSE:RELIANCE-EQ'
  ];

  return (
    <div className="w-full bg-zinc-900 min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-8">Market Overview</h1>
        
        {/* Grid layout with multiple charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {symbols.map((symbol) => (
            <div key={symbol} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-4">{symbol}</h3>
              <AdvancedCandlestickChart 
                symbol={symbol}
                defaultTimeframe="1D"
                height={400}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Chart with Symbol Selection
// ============================================================================

export function SelectableChartDashboard() {
  const [selectedSymbol, setSelectedSymbol] = React.useState('NSE:INFY-EQ');
  const [timeframe, setTimeframe] = React.useState('1D');

  const symbols = [
    { label: 'Infosys', value: 'NSE:INFY-EQ' },
    { label: 'TCS', value: 'NSE:TCS-EQ' },
    { label: 'SBI', value: 'NSE:SBIN-EQ' },
    { label: 'Reliance', value: 'NSE:RELIANCE-EQ' },
  ];

  return (
    <div className="w-full bg-zinc-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Interactive Chart</h1>

        {/* Controls */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mb-6">
          <div className="flex gap-4 flex-wrap">
            {/* Symbol selector */}
            <div className="flex flex-col">
              <label className="text-white text-sm font-semibold mb-2">
                Select Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-zinc-700 text-white px-4 py-2 rounded border border-zinc-600 hover:border-blue-500"
              >
                {symbols.map((sym) => (
                  <option key={sym.value} value={sym.value}>
                    {sym.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Info display */}
            <div className="flex flex-col justify-end">
              <p className="text-green-400 font-semibold">
                Displaying: {selectedSymbol}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <AdvancedCandlestickChart 
            key={selectedSymbol} // Force remount on symbol change
            symbol={selectedSymbol}
            defaultTimeframe={timeframe}
            height={600}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Chart with Sidebar Layout
// ============================================================================

export function SidebarChartDashboard() {
  const [selectedSymbol, setSelectedSymbol] = React.useState('NSE:INFY-EQ');

  return (
    <div className="w-full flex gap-4 bg-zinc-900 min-h-screen p-4">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-800 rounded-lg p-4 border border-zinc-700 h-fit">
        <h2 className="text-xl font-bold text-white mb-4">Watchlist</h2>
        
        <div className="space-y-2">
          {[
            { symbol: 'NSE:INFY-EQ', name: 'Infosys', price: '1,850.50', change: '+2.5%' },
            { symbol: 'NSE:TCS-EQ', name: 'TCS', price: '3,450.00', change: '+1.8%' },
            { symbol: 'NSE:SBIN-EQ', name: 'SBI', price: '650.25', change: '-0.5%' },
            { symbol: 'NSE:RELIANCE-EQ', name: 'Reliance', price: '2,850.75', change: '+3.2%' },
          ].map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => setSelectedSymbol(stock.symbol)}
              className={`w-full text-left p-3 rounded border ${
                selectedSymbol === stock.symbol
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-zinc-700 border-zinc-600 hover:border-blue-500'
              }`}
            >
              <div className="font-semibold text-white">{stock.name}</div>
              <div className="text-sm text-gray-300">{stock.price}</div>
              <div className={`text-xs ${stock.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {stock.change}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 bg-zinc-800 rounded-lg p-4 border border-zinc-700">
        <AdvancedCandlestickChart 
          key={selectedSymbol}
          symbol={selectedSymbol}
          defaultTimeframe="1D"
          height={700}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Chart with Live Data Feed
// ============================================================================

export function ChartWithDataFeed() {
  const [selectedSymbol, setSelectedSymbol] = React.useState('NSE:INFY-EQ');
  const [livePrices, setLivePrices] = React.useState({});

  // Simulate live price updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices((prev) => ({
        ...prev,
        [selectedSymbol]: {
          price: 1850 + Math.random() * 20 - 10,
          bid: 1849 + Math.random() * 20 - 10,
          ask: 1851 + Math.random() * 20 - 10,
          volume: Math.floor(Math.random() * 1000000),
        }
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const currentData = livePrices[selectedSymbol];

  return (
    <div className="w-full bg-zinc-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Live Trading View</h1>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Live price cards */}
          {currentData && (
            <>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <div className="text-gray-400 text-sm">Current Price</div>
                <div className="text-2xl font-bold text-green-400">
                  ₹{currentData.price.toFixed(2)}
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <div className="text-gray-400 text-sm">Bid</div>
                <div className="text-2xl font-bold text-blue-400">
                  ₹{currentData.bid.toFixed(2)}
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <div className="text-gray-400 text-sm">Ask</div>
                <div className="text-2xl font-bold text-orange-400">
                  ₹{currentData.ask.toFixed(2)}
                </div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <div className="text-gray-400 text-sm">Volume</div>
                <div className="text-2xl font-bold text-purple-400">
                  {(currentData.volume / 1000).toFixed(0)}K
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
          <h2 className="text-xl font-bold text-white mb-4">{selectedSymbol} - 1D</h2>
          <AdvancedCandlestickChart 
            symbol={selectedSymbol}
            defaultTimeframe="1D"
            height={600}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Responsive Mobile-Friendly Dashboard
// ============================================================================

export function ResponsiveChartDashboard() {
  const [selectedSymbol, setSelectedSymbol] = React.useState('NSE:INFY-EQ');
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full bg-zinc-900 min-h-screen">
      {/* Mobile Navigation */}
      {isMobile && (
        <div className="bg-zinc-800 border-b border-zinc-700 p-4">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-zinc-700 text-white px-4 py-2 rounded border border-zinc-600"
          >
            <option value="NSE:INFY-EQ">Infosys</option>
            <option value="NSE:TCS-EQ">TCS</option>
            <option value="NSE:SBIN-EQ">SBI</option>
            <option value="NSE:RELIANCE-EQ">Reliance</option>
          </select>
        </div>
      )}

      <div className={isMobile ? 'p-2' : 'grid grid-cols-4 gap-4 p-4'}>
        {/* Chart - Takes full width on mobile, 3 cols on desktop */}
        <div className={isMobile ? 'col-span-1' : 'col-span-3 bg-zinc-800 rounded-lg p-4 border border-zinc-700'}>
          {!isMobile && <h2 className="text-xl font-bold text-white mb-4">{selectedSymbol}</h2>}
          <AdvancedCandlestickChart 
            key={selectedSymbol}
            symbol={selectedSymbol}
            defaultTimeframe="1D"
            height={isMobile ? 400 : 600}
          />
        </div>

        {/* Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 h-fit">
            <h3 className="font-bold text-white mb-4">Symbols</h3>
            <div className="space-y-2">
              {['NSE:INFY-EQ', 'NSE:TCS-EQ', 'NSE:SBIN-EQ', 'NSE:RELIANCE-EQ'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`w-full px-3 py-2 rounded text-sm font-semibold ${
                    selectedSymbol === sym
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                  }`}
                >
                  {sym.split(':')[1].replace('-EQ', '')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Chart in Modal/Dialog
// ============================================================================

export function ChartModalExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedSymbol] = React.useState('NSE:INFY-EQ');

  return (
    <div className="w-full bg-zinc-900 min-h-screen p-6">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
      >
        Open Chart
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg w-full max-w-5xl max-h-screen flex flex-col border border-zinc-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
              <h2 className="text-2xl font-bold text-white">{selectedSymbol} Chart</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Chart */}
            <div className="flex-1 overflow-hidden p-4">
              <AdvancedCandlestickChart 
                symbol={selectedSymbol}
                defaultTimeframe="1D"
                height={500}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Integration Notes
// ============================================================================

/*
INSTALLATION STEPS:

1. Ensure you have the required dependencies:
   npm install recharts lucide-react

2. Copy these files to your project:
   - src/components/AdvancedCandlestickChart.tsx
   - src/services/marketDataWebSocket.ts
   - src/utils/technicalIndicators.ts

3. Ensure backend is running:
   cd backend
   python main.py

4. Choose one of the examples above and adapt to your needs

5. Import and use in your dashboard:
   import AdvancedCandlestickChart from '@/components/AdvancedCandlestickChart';

CUSTOMIZATION:

- Change chart height: Pass height={800} prop
- Change default timeframe: Pass defaultTimeframe="1H" prop
- Change symbol: Pass symbol="NSE:SBIN-EQ" prop
- Multiple charts: Render multiple instances with different symbols

TROUBLESHOOTING:

- Chart not loading: Check browser console for errors
- No real-time data: Ensure backend WebSocket is running
- Missing candles: Verify /api/portfolio/history endpoint
- Performance issues: Reduce number of indicators or use longer timeframe

See CANDLESTICK_CHART_GUIDE.md for complete documentation.
*/
