import React, { useState, useEffect } from 'react';
import { Pen, ShoppingCart, X, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import ApexCandleChart from '../components/ApexCandleChart';
import ApexBarChart from '../components/ApexBarChart';
import ApexPieChart from '../components/ApexPieChart';
import ApexIndicatorChart from '../components/ApexIndicatorChart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:8001';

interface PerformanceMetric {
  label: string;
  value: number;
  period: string;
}

interface TechnicalSignal {
  strength: number; // 0-100
  sentiment: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';
}

const MarketAnalysis: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [symbols] = useState(['NIFTY', 'NIFTY50', 'BANKNIFTY', 'FINNIFTY']);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  
  // State for API data
  const [portfolio, setPortfolio] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tradeForm, setTradeForm] = useState({
    symbol: 'NIFTY',
    price: 26042.30,
    quantity: 1,
    orderType: 'market'
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [portfolioRes, historyRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/paper-trading/portfolio`),
        fetch(`${API_BASE_URL}/api/paper-trading/history`),
        fetch(`${API_BASE_URL}/api/paper-trading/stats`)
      ]);

      const portfolioData = await portfolioRes.json();
      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      if (portfolioData.status === 'success') {
        setPortfolio(portfolioData.data);
        setTradeForm(prev => ({ ...prev, price: portfolioData.data.current_value || 26042.30 }));
      }

      if (historyData.status === 'success' && historyData.data) {
        const formattedHistory = historyData.data.map((item: any) => ({
          date: item.date || new Date().toISOString().split('T')[0],
          open: item.open || 23400,
          high: item.high || 23500,
          low: item.low || 23300,
          close: item.close || 23420,
          volume: item.volume || 2500000,
          year2025: portfolioData.data?.current_value || 23420,
          year2024: (portfolioData.data?.current_value || 23420) * 0.95,
          year2023: (portfolioData.data?.current_value || 23420) * 0.90
        }));
        setHistoricalData(formattedHistory);
      }

      if (statsData.status === 'success') {
        setStats(statsData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  };

  const performanceData: PerformanceMetric[] = [
    { label: '1D', value: 0.50, period: '1 Day' },
    { label: '1W', value: 0.77, period: '1 Week' },
    { label: '1M', value: 4.93, period: '1 Month' },
    { label: '6M', value: 1.82, period: '6 Months' },
    { label: 'YTD', value: 10.17, period: 'Year to Date' },
    { label: '1Y', value: 9.53, period: '1 Year' }
  ];

  const seasonalData = [
    { month: 'Jan', year2025: 23400, year2024: 23200, year2023: 22800 },
    { month: 'Feb', year2025: 23450, year2024: 23300, year2023: 22900 },
    { month: 'Mar', year2025: 23500, year2024: 23400, year2023: 23000 },
    { month: 'Apr', year2025: 23550, year2024: 23450, year2023: 23100 },
    { month: 'May', year2025: 23600, year2024: 23500, year2023: 23200 },
    { month: 'Jun', year2025: 23650, year2024: 23600, year2023: 23300 },
    { month: 'Jul', year2025: 23800, year2024: 23750, year2023: 23400 },
    { month: 'Aug', year2025: 23900, year2024: 23850, year2023: 23500 },
    { month: 'Sep', year2025: 24000, year2024: 23950, year2023: 23600 },
    { month: 'Oct', year2025: 24100, year2024: 24050, year2023: 23700 },
    { month: 'Nov', year2025: 24050, year2024: 24000, year2023: 23800 },
    { month: 'Dec', year2025: 26042, year2024: 24100, year2023: 24000 }
  ];

  const technicalSignal: TechnicalSignal = {
    strength: 72,
    sentiment: 'Buy'
  };

  const getTechnicalColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Strong Buy':
        return 'text-green-500';
      case 'Buy':
        return 'text-green-400';
      case 'Neutral':
        return 'text-yellow-400';
      case 'Sell':
        return 'text-orange-400';
      case 'Strong Sell':
        return 'text-red-500';
      default:
        return 'text-zinc-400';
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const totalValue = (tradeForm.price * tradeForm.quantity).toFixed(2);
    
    toast.success(`${tradeType === 'buy' ? 'Buy' : 'Sell'} Order Executed`, {
      description: `${tradeForm.symbol} | ${tradeForm.quantity} @ ₹${tradeForm.price.toFixed(2)} = ₹${totalValue}`
    });
    
    setShowTradeModal(false);
    setTradeForm({
      symbol: 'NIFTY',
      price: portfolio?.current_value || 26042.30,
      quantity: 1,
      orderType: 'market'
    });
    
    // Refresh data after trade
    setTimeout(fetchAllData, 500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto w-full p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Market Analysis</h1>
          <p className="text-zinc-400">Technical analysis, performance metrics, and market insights</p>
        </div>

        {/* Symbol Selector */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {symbols.map(sym => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSymbol === sym
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Price Header */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
          <div className="flex items-end gap-4 mb-4 justify-between">
            <div>
              <h2 className="text-6xl font-bold text-white">{portfolio?.current_value?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}</h2>
              <p className="text-zinc-400 mt-1">INR</p>
            </div>
            <div className="flex items-baseline gap-2 pb-1">
              <span className={`text-2xl font-bold ${portfolio?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio?.total_pnl >= 0 ? '+' : ''}{portfolio?.total_pnl?.toFixed(2) || '0.00'}
              </span>
              <span className={`text-lg ${portfolio?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio?.return_percent >= 0 ? '+' : ''}{portfolio?.return_percent?.toFixed(2) || '0.00'}%
              </span>
            </div>
            <button
              onClick={() => setShowDrawingTools(!showDrawingTools)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showDrawingTools
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Pen size={18} /> Drawing Tools
            </button>
          </div>
          <p className="text-zinc-400">Nifty 50 Index • NSE</p>
          <p className="text-sm text-zinc-500 mt-2">
            Portfolio Value: ₹{portfolio?.current_value?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'} | 
            Cash: ₹{portfolio?.cash?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'} | 
            Positions: ₹{portfolio?.positions_value?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>

        {/* Drawing Tools Panel */}
        {showDrawingTools && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Chart Drawing Tools</h3>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-zinc-400">
                Select a tool from the toolbar on the left to draw on the chart. Use the settings icon to customize colors and line width.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Selection Tool</p>
                  <p className="text-zinc-400 text-xs">Crosshair - Select objects</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Line Tool</p>
                  <p className="text-zinc-400 text-xs">Draw trend lines</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Text Tool</p>
                  <p className="text-zinc-400 text-xs">Add labels & notes</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Shapes</p>
                  <p className="text-zinc-400 text-xs">Circle & rectangle</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Zoom Tool</p>
                  <p className="text-zinc-400 text-xs">Zoom in/out</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Settings</p>
                  <p className="text-zinc-400 text-xs">Colors & width</p>
                </div>
                <div className="bg-zinc-800/50 rounded p-3">
                  <p className="text-white font-medium">Clear</p>
                  <p className="text-zinc-400 text-xs">Remove all drawings</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrawingTools(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-400">Loading market data...</div>
          </div>
        ) : (
          <>
            {/* Performance Grid */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Performance & Trading Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{stats?.total_trades || 0}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Win Rate</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.win_rate?.toFixed(1) || '0.0'}%</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Total P&L</p>
                  <p className={`text-2xl font-bold ${portfolio?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{portfolio?.total_pnl?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Avg Win</p>
                  <p className="text-2xl font-bold text-green-400">₹{stats?.avg_win?.toFixed(0) || '0'}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.max_drawdown?.toFixed(2) || '0'}%</p>
                </div>
              </div>
            </div>

            {/* Performance metrics grid */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {performanceData.map((metric, idx) => (
              <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
                <p className="text-sm text-zinc-400 mb-2">{metric.period}</p>
                <p className={`text-2xl font-bold ${metric.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.value >= 0 ? '+' : ''}{metric.value.toFixed(2)}%
                </p>
                <p className="text-xs text-zinc-500 mt-2">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Data Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Historical Price Movement</h3>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-sm">
              Export Data
            </button>
          </div>
          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1a1" />
                <YAxis stroke="#a1a1a1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="open"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Open"
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Close"
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="High"
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Low"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-zinc-400">
              Loading historical data...
            </div>
          )}
        </div>

        {/* Technicals Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Technical Gauge */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-8 text-center">Technicals</h3>
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Gauge SVG */}
              <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="25%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="75%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                {/* Gauge background */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="12"
                />
                {/* Gauge fill */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(technicalSignal.strength / 100) * 251.2} 251.2`}
                />
                {/* Needle */}
                <g transform={`rotate(${-90 + (technicalSignal.strength / 100) * 180} 100 100)`}>
                  <line x1="100" y1="100" x2="100" y2="30" stroke="#fff" strokeWidth="3" />
                  <circle cx="100" cy="100" r="4" fill="#fff" />
                </g>
                {/* Labels */}
                <text x="30" y="115" fontSize="12" fill="#a1a1a1" textAnchor="middle">
                  Sell
                </text>
                <text x="100" y="20" fontSize="12" fill="#a1a1a1" textAnchor="middle">
                  Neutral
                </text>
                <text x="170" y="115" fontSize="12" fill="#a1a1a1" textAnchor="middle">
                  Buy
                </text>
              </svg>

              <div className="text-center space-y-2">
                <p className={`text-3xl font-bold ${getTechnicalColor(technicalSignal.sentiment)}`}>
                  {technicalSignal.sentiment}
                </p>
                <p className="text-zinc-400">Signal Strength: {technicalSignal.strength}%</p>
              </div>

              <button className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors">
                More technicals
              </button>
            </div>
          </div>

          {/* Technicals Indicators */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Technical Indicators</h3>
            <div className="space-y-4">
              {[
                { name: 'RSI (14)', value: 68, status: 'Overbought', color: 'text-orange-400' },
                { name: 'MACD', value: 'Positive', status: 'Bullish', color: 'text-green-400' },
                { name: 'Moving Average', value: '50MA > 200MA', status: 'Golden Cross', color: 'text-green-400' },
                { name: 'Bollinger Bands', value: 'Upper Band', status: 'Resistance', color: 'text-red-400' },
                { name: 'Stochastic', value: 72, status: 'Strong', color: 'text-green-400' },
                { name: 'Volume Trend', value: 'Above Average', status: 'Bullish', color: 'text-green-400' }
              ].map((indicator, idx) => (
                <div key={idx} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                  <div>
                    <p className="text-white font-medium">{indicator.name}</p>
                    <p className="text-xs text-zinc-400">{indicator.status}</p>
                  </div>
                  <p className={`font-bold ${indicator.color}`}>
                    {typeof indicator.value === 'number' ? `${indicator.value}` : indicator.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ATM IV Term Structure */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">ATM IV Term Structure</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={seasonalData.slice(0, 6)}>
              <defs>
                <linearGradient id="colorIV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#a1a1a1" />
              <YAxis stroke="#a1a1a1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="year2025"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIV)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market Breadth */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Market Breadth</h3>
            <div className="space-y-3">
              {[
                { label: 'Advances', value: 1240, total: 1800, color: '#10b981' },
                { label: 'Declines', value: 560, total: 1800, color: '#ef4444' },
                { label: 'Unchanged', value: 150, total: 1800, color: '#6b7280' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">{item.label}</span>
                    <span className="text-zinc-400">{item.value}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(item.value / item.total) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Market Sentiment</h3>
            <div className="space-y-4">
              <div className="text-center py-4 bg-zinc-800/50 rounded-lg">
                <p className="text-4xl font-bold text-green-400 mb-2">73.2%</p>
                <p className="text-zinc-400">Bullish Sentiment</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-900/20 border border-green-700/50 rounded p-3 text-center">
                  <p className="text-xs text-zinc-400">Buy Calls</p>
                  <p className="text-lg font-bold text-green-400">12,450</p>
                </div>
                <div className="bg-red-900/20 border border-red-700/50 rounded p-3 text-center">
                  <p className="text-xs text-zinc-400">Put Calls</p>
                  <p className="text-lg font-bold text-red-400">4,680</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-700">
                <button
                  onClick={() => {
                    setTradeType('buy');
                    setShowTradeModal(true);
                  }}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} /> Buy
                </button>
                <button
                  onClick={() => {
                    setTradeType('sell');
                    setShowTradeModal(true);
                  }}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingDown size={16} /> Sell
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Trade Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${tradeType === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {tradeType === 'buy' ? 'Buy Order' : 'Sell Order'}
                </h2>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleExecuteTrade} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={tradeForm.symbol}
                    onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tradeForm.price}
                      onChange={(e) => setTradeForm({ ...tradeForm, price: parseFloat(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={tradeForm.quantity}
                      onChange={(e) => setTradeForm({ ...tradeForm, quantity: parseInt(e.target.value) })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Order Type</label>
                  <select
                    value={tradeForm.orderType}
                    onChange={(e) => setTradeForm({ ...tradeForm, orderType: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                  >
                    <option value="market">Market Order</option>
                    <option value="limit">Limit Order</option>
                    <option value="stop">Stop Loss</option>
                  </select>
                </div>

                <div className="bg-zinc-800/50 rounded p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400">Total Value:</span>
                    <span className="text-white font-bold">₹{(tradeForm.price * tradeForm.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Quantity:</span>
                    <span className="text-white font-bold">{tradeForm.quantity} units</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTradeModal(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 font-medium rounded transition-colors text-white ${
                      tradeType === 'buy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;
