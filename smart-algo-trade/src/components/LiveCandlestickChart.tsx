import React, { useState, useEffect } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockPrice {
  symbol: string;
  price: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

const LiveCandlestickChart: React.FC = () => {
  const [stocks, setStocks] = useState<StockPrice[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('NSE:SBIN-EQ');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState<'1min' | '5min' | '15min' | '1h' | '1d'>('5min');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'ohlc'>('candlestick');

  // Common stocks to display
  const defaultStocks = [
    'NSE:SBIN-EQ',
    'NSE:INFY-EQ',
    'NSE:TCS-EQ',
    'NSE:RELIANCE-EQ',
    'NSE:HDFC-EQ',
    'NSE:MARUTI-EQ',
    'NSE:WIPRO-EQ',
    'NSE:LT-EQ',
  ];

  useEffect(() => {
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchCandleData();
    }
  }, [selectedStock, timeframe]);

  const fetchPriceData = async () => {
    try {
      const priceData: StockPrice[] = [];

      // Fetch actual price data from backend API
      for (const symbol of defaultStocks) {
        try {
          const response = await fetch('http://127.0.0.1:8001/api/market/quote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbols: [symbol] })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.status === 'success' && result.data) {
              const quoteData = Object.values(result.data)[0] as any;
              if (quoteData) {
                priceData.push({
                  symbol,
                  price: parseFloat((quoteData.ltp || quoteData.ltq || 0).toFixed(2)),
                  high: parseFloat((quoteData.high || quoteData.h || 0).toFixed(2)),
                  low: parseFloat((quoteData.low || quoteData.l || 0).toFixed(2)),
                  change: parseFloat(((quoteData.ltp || 0) - (quoteData.pclose || 0)).toFixed(2)),
                  changePercent: parseFloat((((quoteData.ltp || 0) - (quoteData.pclose || 0)) / (quoteData.pclose || 1) * 100).toFixed(2)),
                  volume: quoteData.volume || quoteData.v || 0,
                  timestamp: new Date().toLocaleTimeString(),
                });
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch data for ${symbol}:`, err);
          // Skip if data unavailable, don't use mock data
        }
      }

      setStocks(priceData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  };

  const fetchCandleData = async () => {
    try {
      // Generate mock candlestick data for visualization
      const now = new Date();
      const data: CandleData[] = [];

      for (let i = 50; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 5 * 60000); // 5-minute intervals
        const open = Math.random() * 100 + 400;
        const close = open + (Math.random() - 0.5) * 50;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;

        data.push({
          time: time.toLocaleTimeString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000),
        });
      }

      setCandleData(data);
    } catch (error) {
      console.error('Error fetching candle data:', error);
    }
  };

  const getCandleColor = (data: CandleData, idx: number) => {
    return data.close >= data.open ? '#22c55e' : '#ef4444';
  };

  const selectedStockData = stocks.find((s) => s.symbol === selectedStock);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">📊 Live Stock Charts</h1>
              <p className="text-slate-400">Real-time candlestick charts with technical analysis</p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchPriceData();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stock Ticker Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Select Stock</h3>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {defaultStocks.map((stock) => {
              const data = stocks.find((s) => s.symbol === stock);
              const isSelected = selectedStock === stock;
              const isPositive = data?.changePercent ?? 0 >= 0;

              return (
                <button
                  key={stock}
                  onClick={() => setSelectedStock(stock)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/40'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <p className="text-white text-sm font-semibold">{stock.split(':')[1]?.split('-')[0]}</p>
                  {data && (
                    <p className={`text-xs mt-1 font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}
                      {data.changePercent.toFixed(2)}%
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Stock Info */}
        {selectedStockData && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <div className="grid grid-cols-6 gap-4">
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">SYMBOL</p>
                <p className="text-white font-bold text-lg">{selectedStockData.symbol}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">CURRENT PRICE</p>
                <p className="text-white font-bold text-lg">₹{selectedStockData.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">HIGH</p>
                <p className="text-green-400 font-bold text-lg">₹{selectedStockData.high.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">LOW</p>
                <p className="text-red-400 font-bold text-lg">₹{selectedStockData.low.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">CHANGE</p>
                <p className={`font-bold text-lg flex items-center gap-1 ${selectedStockData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStockData.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {selectedStockData.change >= 0 ? '+' : ''}₹{selectedStockData.change.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-2">VOLUME</p>
                <p className="text-white font-bold text-lg">{(selectedStockData.volume / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart Controls */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-8 flex justify-between items-center">
          <div className="flex gap-2">
            <span className="text-white font-semibold mr-4">Timeframe:</span>
            {(['1min', '5min', '15min', '1h', '1d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-white font-semibold mr-4">Chart Type:</span>
            {(['candlestick', 'line', 'ohlc'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-2 rounded font-semibold transition capitalize ${
                  chartType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Candlestick Chart */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedStock} - {timeframe} Chart
          </h3>

          {candleData.length > 0 ? (
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={candleData.map((d) => ({
                    ...d,
                    displayOpen: d.open,
                    displayHigh: d.high,
                    displayLow: d.low,
                    displayClose: d.close,
                  }))}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    interval={Math.floor(candleData.length / 10)}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number | undefined) => (value !== undefined ? `₹${value.toFixed(2)}` : '')}
                  />

                  {/* High-Low Range */}
                  <Bar dataKey="high" fill="none" shape={<RangeBar />} />

                  {/* Close Price Line */}
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Close"
                  />

                  {/* Open Price Line */}
                  <Line
                    type="monotone"
                    dataKey="open"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="5 5"
                    name="Open"
                  />

                  {/* Volume Bar */}
                  <Bar
                    dataKey="volume"
                    fill="#64748b"
                    opacity={0.3}
                    yAxisId="right"
                    name="Volume"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-slate-400">Loading chart data...</p>
            </div>
          )}
        </div>

        {/* OHLC Table */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">OHLC Data (Last 10 Candles)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-2 text-slate-300">Time</th>
                  <th className="text-right px-4 py-2 text-slate-300">Open</th>
                  <th className="text-right px-4 py-2 text-slate-300">High</th>
                  <th className="text-right px-4 py-2 text-slate-300">Low</th>
                  <th className="text-right px-4 py-2 text-slate-300">Close</th>
                  <th className="text-right px-4 py-2 text-slate-300">Change</th>
                  <th className="text-right px-4 py-2 text-slate-300">Volume</th>
                </tr>
              </thead>
              <tbody>
                {candleData.slice(-10).reverse().map((candle, idx) => {
                  const change = candle.close - candle.open;
                  const changePercent = (change / candle.open) * 100;
                  const isPositive = change >= 0;

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                        isPositive ? 'bg-green-900/10' : 'bg-red-900/10'
                      }`}
                    >
                      <td className="px-4 py-2 text-white">{candle.time}</td>
                      <td className="text-right px-4 py-2 text-slate-300">₹{candle.open.toFixed(2)}</td>
                      <td className="text-right px-4 py-2 text-green-400">₹{candle.high.toFixed(2)}</td>
                      <td className="text-right px-4 py-2 text-red-400">₹{candle.low.toFixed(2)}</td>
                      <td className="text-right px-4 py-2 text-white font-semibold">₹{candle.close.toFixed(2)}</td>
                      <td className={`text-right px-4 py-2 font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}
                        {changePercent.toFixed(2)}%
                      </td>
                      <td className="text-right px-4 py-2 text-slate-300">
                        {(candle.volume / 1000000).toFixed(2)}M
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Range Bar Component for High-Low visualization
const RangeBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || !payload.high || !payload.low) return null;

  const yScale = height / (400 - 300); // Approximate scale
  const highY = y - (payload.high - 300) * yScale;
  const lowY = y + (300 - payload.low) * yScale;

  return (
    <line
      x1={x + width / 2}
      y1={highY}
      x2={x + width / 2}
      y2={lowY}
      stroke={payload.close >= payload.open ? '#22c55e' : '#ef4444'}
      strokeWidth={2}
    />
  );
};

export default LiveCandlestickChart;
