import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RotateCcw, RefreshCw, Zap, BarChart3, Calendar, Eye, EyeOff, Star } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Cell } from 'recharts';
import { toast } from 'sonner';
import API_ENDPOINTS from '../config/api';

interface Portfolio {
    initial_capital: number;
    current_value: number;
    cash: number;
    positions_value: number;
    realized_pnl: number;
    unrealized_pnl: number;
    total_pnl: number;
    return_percent: number;
    open_positions_count: number;
    closed_trades: number;
}

interface Position {
    qty: number;
    avg_price: number;
    current_price: number;
    value: number;
}

interface Trade {
    symbol: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    pnl: number;
    pnl_percent: number;
    timestamp: string;
}

interface HistoricalData {
    date: string;
    portfolio_value: number;
    cash: number;
    positions_value: number;
    pnl: number;
    return_percent: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    time?: string;
}

interface HistoricalStats {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    avg_win: number;
    avg_loss: number;
    max_drawdown: number;
    best_trade: number;
    worst_trade: number;
}

interface WatchlistItem {
    symbol: string;
    last: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
}

export const PaperTradingTracker: React.FC = () => {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [positions, setPositions] = useState<Record<string, Position>>({});
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [viewMode, setViewMode] = useState<'current' | 'historical'>('current');
    const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
    const [historicalStats, setHistoricalStats] = useState<HistoricalStats | null>(null);
    const [tradingMode, setTradingMode] = useState<'paper' | 'real'>('paper');
    const [timeframe, setTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '1D' | '1W' | '1M'>('1D');
    const [chartType, setChartType] = useState<'line' | 'candlestick' | 'bar'>('candlestick');
    const [zoom, setZoom] = useState(100);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
        { symbol: 'NIFTY', last: 26042.30, change: -99.80, changePercent: -0.38, high: 26160, low: 25900 },
        { symbol: 'BANKNIFTY', last: 59011.35, change: -172.25, changePercent: -0.29, high: 59200, low: 58800 },
        { symbol: 'SENSEX', last: 85041.45, change: -367.25, changePercent: -0.43, high: 85400, low: 84700 },
        { symbol: 'CNXIT', last: 38572.30, change: -402.50, changePercent: -1.03, high: 39000, low: 38100 },
        { symbol: 'SPX', last: 6944.14, change: 12.09, changePercent: 0.17, high: 7000, low: 6900 },
    ]);

    const fetchPortfolio = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.PAPER_TRADING.PORTFOLIO);
            const data = await response.json();
            if (data.status === 'success') {
                setPortfolio(data.data);
                setPositions(data.data.positions || {});
            }
        } catch (error) {
            console.error('Failed to fetch paper trading portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrades = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.PAPER_TRADING.TRADES(10));
            const data = await response.json();
            if (data.status === 'success') {
                setTrades(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        }
    };

    const fetchHistoricalData = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.PAPER_TRADING.HISTORY);
            const data = await response.json();
            if (data.status === 'success') {
                setHistoricalData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch historical data:', error);
        }
    };

    const fetchHistoricalStats = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.PAPER_TRADING.STATS);
            const data = await response.json();
            if (data.status === 'success') {
                setHistoricalStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch historical stats:', error);
        }
    };

    const handleReset = async () => {
        const confirmed = window.confirm('Are you sure you want to reset paper trading portfolio? This cannot be undone.');
        if (!confirmed) return;
        setResetting(true);
        try {
            const response = await fetch(API_ENDPOINTS.PAPER_TRADING.RESET, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                setPortfolio(data.portfolio);
                setPositions({});
                setTrades([]);
                toast.success('Portfolio Reset', { description: 'Paper trading portfolio has been reset to initial state' });
            }
        } catch (error) {
            console.error('Failed to reset portfolio:', error);
            toast.error('Reset Failed', { description: 'Could not reset portfolio' });
        } finally {
            setResetting(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
        fetchTrades();
        fetchHistoricalData();
        fetchHistoricalStats();
        const interval = setInterval(() => {
            fetchPortfolio();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Loading paper trading data...</div>
            </div>
        );
    }

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Custom Candlestick Component
    const CandlestickChart: React.FC<{ data: HistoricalData[]; height: number }> = ({ data, height }) => {
        if (!data.length) return null;

        const prices = data.filter(d => d.open && d.high && d.low && d.close);
        if (!prices.length) return null;

        const allPrices = prices.flatMap(d => [d.open!, d.high!, d.low!, d.close!]);
        const minPrice = Math.min(...allPrices) * 0.98;
        const maxPrice = Math.max(...allPrices) * 1.02;
        const priceRange = maxPrice - minPrice;

        const width = Math.max(800, prices.length * 15);
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - 80;

        const candleWidth = Math.max(3, (chartWidth / prices.length) * 0.6);
        const spacing = chartWidth / prices.length;

        const getY = (price: number) => {
            return padding + (1 - (price - minPrice) / priceRange) * chartHeight;
        };

        return (
            <div className="overflow-x-auto">
                <svg width={width} height={height} className="bg-zinc-950">
                    {/* Grid */}
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width={width} height={height} fill="url(#grid)" />

                    {/* Y-Axis Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const price = minPrice + priceRange * ratio;
                        const y = getY(price);
                        return (
                            <g key={`y-label-${i}`}>
                                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="#666" strokeWidth="1" />
                                <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#888">
                                    ₹{price.toFixed(0)}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis */}
                    <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#666" strokeWidth="1" />

                    {/* Candlesticks */}
                    {prices.map((candle, idx) => {
                        const x = padding + idx * spacing + spacing / 2;
                        const open = candle.open!;
                        const close = candle.close!;
                        const high = candle.high!;
                        const low = candle.low!;

                        const yOpen = getY(open);
                        const yClose = getY(close);
                        const yHigh = getY(high);
                        const yLow = getY(low);

                        const isGreen = close >= open;
                        const color = isGreen ? '#10b981' : '#ef4444';
                        const bodyTop = Math.min(yOpen, yClose);
                        const bodyHeight = Math.abs(yClose - yOpen) || 1;

                        return (
                            <g key={`candle-${idx}`}>
                                {/* Wick */}
                                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" opacity="0.8" />
                                {/* Body */}
                                <rect
                                    x={x - candleWidth / 2}
                                    y={bodyTop}
                                    width={candleWidth}
                                    height={bodyHeight}
                                    fill={color}
                                    stroke={color}
                                    strokeWidth="0.5"
                                    opacity="0.9"
                                />
                            </g>
                        );
                    })}

                    {/* X-Axis Labels */}
                    {prices.map((candle, idx) => {
                        if (idx % Math.ceil(prices.length / 10) !== 0) return null;
                        const x = padding + idx * spacing + spacing / 2;
                        return (
                            <g key={`x-label-${idx}`}>
                                <line x1={x} y1={padding + chartHeight} x2={x} y2={padding + chartHeight + 5} stroke="#666" strokeWidth="1" />
                                <text x={x} y={padding + chartHeight + 20} textAnchor="middle" fontSize="11" fill="#888">
                                    {candle.time || candle.date.slice(5)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Labels */}
                    <rect x={50} y={15} width={80} height={25} fill="white" rx="4" />
                    <text x={90} y={35} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#000">
                        Price
                    </text>

                    <rect x={width - 130} y={padding + chartHeight - 50} width={80} height={25} fill="white" rx="4" />
                    <text x={width - 90} y={padding + chartHeight - 30} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#000">
                        Time
                    </text>
                </svg>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-black text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-6 space-y-4">
                {/* Back Link */}
                <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2">
                    ← Back to Dashboard
                </button>

                {/* Symbol Info */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">{selectedSymbol}</h1>
                        <p className="text-sm text-zinc-500 mt-1">NSE:NFY-EQ</p>
                    </div>
                    <div className="flex items-baseline gap-4">
                        <div>
                            <p className="text-5xl font-bold text-white">
                                ₹{watchlist.find(w => w.symbol === selectedSymbol)?.last.toFixed(2)}
                            </p>
                            <p className={`text-lg font-semibold ${(watchlist.find(w => w.symbol === selectedSymbol)?.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(watchlist.find(w => w.symbol === selectedSymbol)?.change || 0) >= 0 ? '+' : ''}{watchlist.find(w => w.symbol === selectedSymbol)?.change.toFixed(2)} ({(watchlist.find(w => w.symbol === selectedSymbol)?.changePercent || 0) >= 0 ? '+' : ''}{watchlist.find(w => w.symbol === selectedSymbol)?.changePercent.toFixed(2)}%)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trading Mode */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">Trading Mode:</span>
                    <button
                        onClick={() => setTradingMode('paper')}
                        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors font-semibold ${
                            tradingMode === 'paper'
                                ? 'bg-amber-500 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                        }`}
                    >
                        Paper Trading (Demo)
                    </button>
                    <button
                        onClick={() => setTradingMode('real')}
                        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors font-semibold ${
                            tradingMode === 'real'
                                ? 'bg-red-600 text-white'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                        }`}
                    >
                        Real Money
                    </button>
                </div>

                {/* P&L Dashboard */}
                {portfolio && (
                    <div className="space-y-3">
                        {/* Main P&L Cards */}
                        <div className="grid grid-cols-5 gap-4">
                            {/* Total Portfolio Value */}
                            <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                <p className="text-xs text-blue-300 uppercase mb-2 font-semibold">Portfolio Value</p>
                                <p className="text-2xl font-bold text-blue-100">₹{formatNumber(portfolio.current_value)}</p>
                                <p className="text-xs text-blue-400 mt-1">Initial: ₹{formatNumber(portfolio.initial_capital)}</p>
                            </div>

                            {/* Total P&L */}
                            <div className={`bg-gradient-to-br ${portfolio.total_pnl >= 0 ? 'from-emerald-900/40 to-emerald-900/20 border border-emerald-700/50' : 'from-red-900/40 to-red-900/20 border border-red-700/50'} rounded-lg p-4`}>
                                <p className="text-xs uppercase mb-2 font-semibold" style={{color: portfolio.total_pnl >= 0 ? '#6ee7b7' : '#fca5a5'}}>Total P&L</p>
                                <p className={`text-2xl font-bold flex items-center gap-2`} style={{color: portfolio.total_pnl >= 0 ? '#10b981' : '#ef4444'}}>
                                    {portfolio.total_pnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    ₹{formatNumber(Math.abs(portfolio.total_pnl))}
                                </p>
                                <p className={`text-xs mt-1 font-semibold`} style={{color: portfolio.total_pnl >= 0 ? '#6ee7b7' : '#fca5a5'}}>
                                    {portfolio.total_pnl >= 0 ? '+' : ''}{portfolio.return_percent.toFixed(2)}%
                                </p>
                            </div>

                            {/* Realized P&L */}
                            <div className={`bg-gradient-to-br ${portfolio.realized_pnl >= 0 ? 'from-cyan-900/40 to-cyan-900/20 border border-cyan-700/50' : 'from-orange-900/40 to-orange-900/20 border border-orange-700/50'} rounded-lg p-4`}>
                                <p className="text-xs uppercase mb-2 font-semibold" style={{color: portfolio.realized_pnl >= 0 ? '#22d3ee' : '#fed7aa'}}>Realized P&L</p>
                                <p className={`text-2xl font-bold`} style={{color: portfolio.realized_pnl >= 0 ? '#06b6d4' : '#d97706'}}>
                                    ₹{formatNumber(Math.abs(portfolio.realized_pnl))}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">From closed trades</p>
                            </div>

                            {/* Unrealized P&L */}
                            <div className={`bg-gradient-to-br ${portfolio.unrealized_pnl >= 0 ? 'from-purple-900/40 to-purple-900/20 border border-purple-700/50' : 'from-pink-900/40 to-pink-900/20 border border-pink-700/50'} rounded-lg p-4`}>
                                <p className="text-xs uppercase mb-2 font-semibold" style={{color: portfolio.unrealized_pnl >= 0 ? '#d8b4fe' : '#fbcfe8'}}>Unrealized P&L</p>
                                <p className={`text-2xl font-bold`} style={{color: portfolio.unrealized_pnl >= 0 ? '#a78bfa' : '#ec4899'}}>
                                    ₹{formatNumber(Math.abs(portfolio.unrealized_pnl))}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">Open positions</p>
                            </div>

                            {/* Available Cash */}
                            <div className="bg-gradient-to-br from-teal-900/40 to-teal-900/20 border border-teal-700/50 rounded-lg p-4">
                                <p className="text-xs text-teal-300 uppercase mb-2 font-semibold">Available Cash</p>
                                <p className="text-2xl font-bold text-teal-100">₹{formatNumber(portfolio.cash)}</p>
                                <p className="text-xs text-teal-400 mt-1">{((portfolio.cash / portfolio.initial_capital) * 100).toFixed(1)}% of initial</p>
                            </div>
                        </div>

                        {/* P&L Status Indicators */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Win/Loss Summary */}
                            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                                <p className="text-xs text-zinc-400 uppercase mb-2 font-semibold">Status</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-300">Trades Closed</p>
                                        <p className="text-lg font-bold text-white">{portfolio.closed_trades}</p>
                                    </div>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${portfolio.total_pnl >= 0 ? 'bg-emerald-900/30 border border-emerald-700/50' : 'bg-red-900/30 border border-red-700/50'}`}>
                                        <p className={`text-xl font-bold ${portfolio.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {portfolio.total_pnl >= 0 ? '✓' : '✗'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Open Positions */}
                            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                                <p className="text-xs text-zinc-400 uppercase mb-2 font-semibold">Open Positions</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-300">Active</p>
                                        <p className="text-lg font-bold text-white">{portfolio.open_positions_count}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400">Worth</p>
                                        <p className="text-sm font-semibold text-blue-400">₹{formatNumber(portfolio.positions_value)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Return Percent */}
                            <div className={`bg-zinc-800/30 border ${portfolio.return_percent >= 0 ? 'border-emerald-700/50' : 'border-red-700/50'} rounded-lg p-3`}>
                                <p className="text-xs text-zinc-400 uppercase mb-2 font-semibold">Return %</p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-300">Total Return</p>
                                        <p className={`text-lg font-bold ${portfolio.return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {portfolio.return_percent >= 0 ? '+' : ''}{portfolio.return_percent.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timeframe Selector */}
                <div>
                    <p className="text-xs text-zinc-400 mb-2">Timeframe:</p>
                    <div className="flex gap-2">
                        {['1M', '5M', '15M', '1H', '1D', '1W', '1M'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf as any)}
                                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                    timeframe === tf
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
                {/* Historical Data Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            Historical Data & Charts
                        </h3>
                        <div className="flex gap-3 items-center">
                            <div>
                                <p className="text-xs text-zinc-400 mb-2">Chart Type:</p>
                                <div className="flex gap-2">
                                    {['line', 'candlestick', 'bar'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setChartType(type as any)}
                                            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                                chartType === type
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                            }`}
                                        >
                                            {type === 'candlestick' && '�'}
                                            {type === 'bar' && '📊'}
                                            {type === 'line' && '📈'}
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    fetchHistoricalData();
                                    fetchHistoricalStats();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Chart Stats */}
                    {historicalStats && (
                        <div className="px-6 py-4 bg-zinc-800/50 border-b border-zinc-700 grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 uppercase mb-1">HIGH</p>
                                <p className="text-lg font-bold text-emerald-400">₹{formatNumber(historicalStats.best_trade)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 uppercase mb-1">LOW</p>
                                <p className="text-lg font-bold text-red-400">₹{formatNumber(historicalStats.worst_trade)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 uppercase mb-1">CHANGE</p>
                                <p className={`text-lg font-bold ${historicalStats.avg_win >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {historicalStats.avg_win >= 0 ? '↗️' : '↘️'} ₹{formatNumber(Math.abs(historicalStats.avg_win))}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-500 uppercase mb-1">TOTAL VOLUME</p>
                                <p className="text-lg font-bold text-cyan-400">{historicalStats.total_trades}</p>
                            </div>
                        </div>
                    )}

                    {/* Chart Display */}
                    <div className="p-6 bg-black min-h-96">
                        {chartType === 'candlestick' && historicalData.length > 0 && (
                            <CandlestickChart data={historicalData} height={400} />
                        )}
                        {chartType === 'line' && historicalData.length > 0 && (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#888" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#d4d4d8' }}
                                        formatter={(value) => `₹${formatNumber(Number(value))}`}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="portfolio_value" stroke="#10b981" dot={false} strokeWidth={2} name="Portfolio Value" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        {chartType === 'bar' && historicalData.length > 0 && (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={historicalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#888" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#d4d4d8' }}
                                        formatter={(value) => `₹${formatNumber(Number(value))}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="pnl" fill="#10b981" name="Daily P&L" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {historicalData.length === 0 && (
                            <div className="flex items-center justify-center h-96 text-zinc-500">
                                <p>No chart data available yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trade History with P&L */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="bg-zinc-800 px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            Closed Trades (P&L Breakdown)
                        </h3>
                        <button
                            onClick={fetchTrades}
                            className="flex items-center gap-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                    {trades.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-800/50 border-b border-zinc-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-zinc-400">Symbol</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">Quantity</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">Entry Price</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">Exit Price</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">P&L Amount</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">P&L %</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">Status</th>
                                        <th className="px-6 py-3 text-left text-zinc-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {trades.map((trade, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-white">{trade.symbol}</td>
                                            <td className="px-6 py-4 text-zinc-300">{trade.quantity}</td>
                                            <td className="px-6 py-4 text-zinc-300">₹{formatNumber(trade.entry_price)}</td>
                                            <td className="px-6 py-4 text-zinc-300">₹{formatNumber(trade.exit_price)}</td>
                                            <td className={`px-6 py-4 font-semibold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}₹{formatNumber(Math.abs(trade.pnl))}
                                            </td>
                                            <td className={`px-6 py-4 font-semibold flex items-center gap-1 ${trade.pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    trade.pnl >= 0 
                                                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' 
                                                        : 'bg-red-900/40 text-red-300 border border-red-700/50'
                                                }`}>
                                                    {trade.pnl >= 0 ? '✓ Profit' : '✗ Loss'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400 text-xs">
                                                {new Date(trade.timestamp).toLocaleDateString('en-IN', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center text-zinc-500">
                            <p>No closed trades yet. Start placing orders to see P&L data!</p>
                        </div>
                    )}
                </div>

                {/* Additional Info Sections */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Portfolio Info */}
                    {portfolio && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Initial Capital</span>
                                    <span className="text-white font-semibold">₹{formatNumber(portfolio.initial_capital)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Current Value</span>
                                    <span className="text-emerald-400 font-semibold">₹{formatNumber(portfolio.current_value)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Total P&L</span>
                                    <span className={`font-semibold ${portfolio.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ₹{formatNumber(Math.abs(portfolio.total_pnl))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Return %</span>
                                    <span className={`font-semibold ${portfolio.return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {portfolio.return_percent >= 0 ? '+' : ''}{portfolio.return_percent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    {historicalStats && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Trading Statistics</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Total Trades</span>
                                    <span className="text-white font-semibold">{historicalStats.total_trades}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Win Rate</span>
                                    <span className="text-emerald-400 font-semibold">{historicalStats.win_rate.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Avg Win/Loss</span>
                                    <span className="text-white font-semibold">
                                        <span className="text-emerald-400">₹{formatNumber(historicalStats.avg_win)}</span>
                                        <span className="text-zinc-500 mx-1">/</span>
                                        <span className="text-red-400">₹{formatNumber(Math.abs(historicalStats.avg_loss))}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Max Drawdown</span>
                                    <span className="text-red-400 font-semibold">{historicalStats.max_drawdown.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
