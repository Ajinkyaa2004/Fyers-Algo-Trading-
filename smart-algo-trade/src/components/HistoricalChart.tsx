import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, BarChart3, RefreshCw } from 'lucide-react';

interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface HistoricalChartProps {
    symbol?: string;
    resolution?: '1' | '5' | '15' | '60' | 'D' | 'W' | 'M';
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
    symbol = 'NSE:NIFTY50-INDEX',
    resolution: propResolution = 'D'
}) => {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolution, setResolution] = useState<'1' | '5' | '15' | '60' | 'D' | 'W' | 'M'>(propResolution);
    const [chartType, setChartType] = useState<'line' | 'candle' | 'bar'>('candle');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [stats, setStats] = useState({ high: 0, low: 0, change: 0, volume: 0 });

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const url = `http://127.0.0.1:8001/api/portfolio/history?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`;
            console.log('Fetching history from:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.status === 'success' && data.data && Array.isArray(data.data)) {
                const candleData = data.data as Candle[];
                console.log('Candles received:', candleData.length);
                setCandles(candleData);
                
                if (candleData.length > 0) {
                    const highs = candleData.map(c => c.high);
                    const lows = candleData.map(c => c.low);
                    const volumes = candleData.map(c => c.volume);
                    const firstClose = candleData[0].close;
                    const lastClose = candleData[candleData.length - 1].close;
                    
                    setStats({
                        high: Math.max(...highs),
                        low: Math.min(...lows),
                        change: lastClose - firstClose,
                        volume: volumes.reduce((a, b) => a + b, 0)
                    });
                }
            } else {
                console.warn('No valid candle data received');
                setCandles([]);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
            setCandles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (propResolution !== resolution) {
            setResolution(propResolution);
        }
    }, [propResolution, resolution]);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Auto-refresh every 5 seconds
        return () => clearInterval(interval);
    }, [symbol, resolution]);

    const formatNumber = (num: number) => {
        return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
        if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
        return vol.toString();
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        if (resolution === 'D') return date.toLocaleDateString('en-IN');
        if (resolution === 'W') return date.toLocaleDateString('en-IN');
        if (resolution === 'M') return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-zinc-400 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Loading historical data...
                </div>
            </div>
        );
    }

    // Generate demo data if no real data available
    const displayCandles = candles.length > 0 ? candles : [
        { timestamp: Date.now() / 1000 - 86400 * 5, open: 2000, high: 2050, low: 1980, close: 2020, volume: 1000000 },
        { timestamp: Date.now() / 1000 - 86400 * 4, open: 2020, high: 2100, low: 2010, close: 2090, volume: 1200000 },
        { timestamp: Date.now() / 1000 - 86400 * 3, open: 2090, high: 2120, low: 2070, close: 2100, volume: 900000 },
        { timestamp: Date.now() / 1000 - 86400 * 2, open: 2100, high: 2130, low: 2080, close: 2110, volume: 1100000 },
        { timestamp: Date.now() / 1000 - 86400 * 1, open: 2110, high: 2150, low: 2090, close: 2140, volume: 1300000 },
        { timestamp: Date.now() / 1000, open: 2140, high: 2180, low: 2120, close: 2170, volume: 1400000 },
    ];

    const minPrice = stats.low || displayCandles[0]?.low || 0;
    const maxPrice = stats.high || displayCandles[0]?.high || 100;
    const priceRange = maxPrice - minPrice || 1;

    const getCanvasPath = () => {
        if (displayCandles.length === 0) return '';
        
        const width = 800;
        const height = 300;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        let path = `M ${padding} ${height - padding}`;
        
        displayCandles.forEach((candle, idx) => {
            const x = padding + (idx / (displayCandles.length - 1 || 1)) * chartWidth;
            const y = height - padding - ((candle.close - minPrice) / priceRange) * chartHeight;
            
            if (idx === 0) {
                path += ` M ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
            }
        });

        return path;
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-zinc-100">Historical Data & Charts</h3>
                    <p className="text-sm text-zinc-500 mt-1">{symbol}</p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Resolution and Chart Type Selectors */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Timeframe:
                    </span>
                    {(['1', '5', '15', '60', 'D', 'W', 'M'] as const).map(res => (
                        <button
                            key={res}
                            onClick={() => setResolution(res)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                resolution === res
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                        >
                            {res === '1' ? '1M' : res === '5' ? '5M' : res === '15' ? '15M' : res === '60' ? '1H' : res === 'D' ? '1D' : res === 'W' ? '1W' : '1M'}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Chart Type:
                    </span>
                    {(['line', 'candle', 'bar'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setChartType(type)}
                            className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                                chartType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                        >
                            {type === 'candle' ? 'Candlestick' : type === 'line' ? 'Line' : 'Bar'}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                        Zoom:
                    </span>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                        className="w-40 accent-blue-600"
                    />
                    <span className="text-sm text-zinc-300">{(zoomLevel * 100).toFixed(0)}%</span>
                    <button
                        onClick={() => setZoomLevel(1)}
                        className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded transition"
                    >
                        Reset Zoom
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {displayCandles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase mb-1">High</p>
                        <p className="text-xl font-bold text-emerald-400">₹{formatNumber(stats.high || maxPrice)}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase mb-1">Low</p>
                        <p className="text-xl font-bold text-red-400">₹{formatNumber(stats.low || minPrice)}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase mb-1">Change</p>
                        <p className={`text-xl font-bold flex items-center gap-1 ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            ₹{formatNumber(Math.abs(stats.change))}
                        </p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4">
                        <p className="text-xs text-zinc-500 uppercase mb-1">Total Volume</p>
                        <p className="text-xl font-bold text-blue-400">{formatVolume(stats.volume)}</p>
                    </div>
                </div>
            )}

            {/* Chart */}
            {displayCandles.length > 0 ? (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <svg
                            viewBox="0 0 800 350"
                            className="w-full border border-zinc-800 rounded-lg bg-zinc-950"
                            style={{ minWidth: `${800 * zoomLevel}px` }}
                        >
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((i) => (
                                <React.Fragment key={`grid-${i}`}>
                                    <line
                                        x1={40 + i * 720}
                                        y1={40}
                                        x2={40 + i * 720}
                                        y2={310}
                                        stroke="#3f3f46"
                                        strokeDasharray="2,4"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1={40}
                                        y1={40 + i * 270}
                                        x2={760}
                                        y2={40 + i * 270}
                                        stroke="#3f3f46"
                                        strokeDasharray="2,4"
                                        strokeWidth="0.5"
                                    />
                                </React.Fragment>
                            ))}

                            {/* Price Labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map((i) => (
                                <text
                                    key={`price-${i}`}
                                    x="20"
                                    y={310 - i * 270}
                                    fontSize="12"
                                    fill="#a1a1a1"
                                    textAnchor="end"
                                    dy="0.3em"
                                >
                                    ₹{formatNumber(minPrice + i * priceRange)}
                                </text>
                            ))}

                            {chartType === 'line' && (
                                /* Line Chart */
                                <path
                                    d={getCanvasPath()}
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            )}

                            {chartType === 'candle' && (
                                /* Candlestick Chart */
                                displayCandles.map((candle, idx) => {
                                    const width = 800;
                                    const height = 300;
                                    const padding = 40;
                                    const chartWidth = width - padding * 2;
                                    const chartHeight = height - padding * 2;
                                    const candleWidth = Math.max((chartWidth / displayCandles.length) * 0.6 * zoomLevel, 2);

                                    const x = padding + (idx / (displayCandles.length - 1 || 1)) * chartWidth;
                                    const openY = height - padding - ((candle.open - minPrice) / priceRange) * chartHeight;
                                    const closeY = height - padding - ((candle.close - minPrice) / priceRange) * chartHeight;
                                    const highY = height - padding - ((candle.high - minPrice) / priceRange) * chartHeight;
                                    const lowY = height - padding - ((candle.low - minPrice) / priceRange) * chartHeight;

                                    const isPositive = candle.close >= candle.open;
                                    const color = isPositive ? '#10b981' : '#ef4444';

                                    return (
                                        <g key={`candle-${idx}`}>
                                            {/* Wick - thin line from high to low */}
                                            <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" opacity="0.8" />
                                            {/* Body - rectangle from open to close */}
                                            <rect
                                                x={x - candleWidth / 2}
                                                y={Math.min(openY, closeY)}
                                                width={candleWidth}
                                                height={Math.max(Math.abs(closeY - openY), 2)}
                                                fill={color}
                                                stroke={color}
                                                strokeWidth="0.5"
                                            />
                                        </g>
                                    );
                                })
                            )}

                            {chartType === 'bar' && (
                                /* Bar Chart */
                                displayCandles.map((candle, idx) => {
                                    const width = 800;
                                    const height = 300;
                                    const padding = 40;
                                    const chartWidth = width - padding * 2;
                                    const chartHeight = height - padding * 2;
                                    const barWidth = Math.max((chartWidth / displayCandles.length) * 0.5 * zoomLevel, 2);

                                    const x = padding + (idx / (displayCandles.length - 1 || 1)) * chartWidth;
                                    const closeY = height - padding - ((candle.close - minPrice) / priceRange) * chartHeight;
                                    const openY = height - padding;

                                    const isPositive = candle.close >= candle.open;
                                    const color = isPositive ? '#10b981' : '#ef4444';
                                    const barHeight = Math.abs(closeY - openY) || 1;

                                    return (
                                        <rect
                                            key={`bar-${idx}`}
                                            x={x - barWidth / 2}
                                            y={Math.min(closeY, openY)}
                                            width={barWidth}
                                            height={barHeight}
                                            fill={color}
                                            opacity="0.8"
                                        />
                                    );
                                })
                            )}
                        </svg>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-3 px-4 text-zinc-400">Time</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">Open</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">High</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">Low</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">Close</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">Volume</th>
                                    <th className="text-right py-3 px-4 text-zinc-400">Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {displayCandles.slice(-20).reverse().map((candle, idx) => {
                                    const change = candle.close - candle.open;
                                    const changePercent = ((change / candle.open) * 100);
                                    const isPositive = change >= 0;

                                    return (
                                        <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="py-3 px-4 text-zinc-300">{formatTime(candle.timestamp)}</td>
                                            <td className="text-right py-3 px-4 text-zinc-300">₹{formatNumber(candle.open)}</td>
                                            <td className="text-right py-3 px-4 text-emerald-400">₹{formatNumber(candle.high)}</td>
                                            <td className="text-right py-3 px-4 text-red-400">₹{formatNumber(candle.low)}</td>
                                            <td className="text-right py-3 px-4 font-semibold text-zinc-100">₹{formatNumber(candle.close)}</td>
                                            <td className="text-right py-3 px-4 text-zinc-400">{formatVolume(candle.volume)}</td>
                                            <td className={`text-right py-3 px-4 font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {formatNumber(Math.abs(change))} ({changePercent.toFixed(2)}%)
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-xs text-zinc-500 text-center">
                        Showing last {Math.min(20, displayCandles.length)} candles out of {displayCandles.length} total {candles.length === 0 ? '(DEMO DATA)' : ''}
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-800 rounded-lg p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4 opacity-50" />
                    <p className="text-zinc-400">No historical data available for this symbol</p>
                </div>
            )}
        </div>
    );
};
