import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Play, Square } from 'lucide-react';
import { MarketData } from '../components/MarketData';
import { RealTimeDataStream } from '../components/RealTimeDataStream';
import { HistoricalChart } from '../components/HistoricalChart';

interface Candle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface TickStatus {
    running: boolean;
    subscribed_symbols: string[];
    symbol_count: number;
}

export default function LiveMarket() {
    const [showMarketData, setShowMarketData] = useState(true);
    const [symbols] = useState(['RELIANCE', 'INFY', 'TCS']);
    const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
    const [interval, setInterval] = useState('1min');
    const [candles, setCandles] = useState<Candle[]>([]);
    const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
    const [tickStatus, setTickStatus] = useState<TickStatus | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTickStatus();
        const statusInterval = setInterval(fetchTickStatus, 5000);
        return () => clearInterval(statusInterval);
    }, []);

    useEffect(() => {
        if (tickStatus?.running) {
            fetchCandles();
            fetchCurrentCandle();
            const candleInterval = setInterval(() => {
                fetchCandles();
                fetchCurrentCandle();
            }, 2000);
            return () => clearInterval(candleInterval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSymbol, interval, tickStatus?.running]);

    const fetchTickStatus = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8001/api/live/status');
            const data = await response.json();
            setTickStatus(data.data);
        } catch (error) {
            console.error('Failed to fetch tick status:', error);
        }
    };

    const fetchCandles = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8001/api/live/candles/${selectedSymbol}?interval=${interval}&count=20`
            );
            const data = await response.json();
            if (data.candles) {
                setCandles(data.candles);
            }
        } catch (error) {
            console.error('Failed to fetch candles:', error);
        }
    };

    const fetchCurrentCandle = async () => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8001/api/live/candle/current/${selectedSymbol}?interval=${interval}`
            );
            const data = await response.json();
            if (data.candle) {
                setCurrentCandle(data.candle);
            }
        } catch (error) {
            console.error('Failed to fetch current candle:', error);
        }
    };

    const startTickStream = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8001/api/live/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbols: symbols,
                    exchange: 'NSE',
                    mode: 'full'
                })
            });
            const data = await response.json();
            console.log('Tick stream started:', data);
            await fetchTickStatus();
        } catch (error) {
            console.error('Failed to start tick stream:', error);
        } finally {
            setLoading(false);
        }
    };

    const stopTickStream = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8001/api/live/stop', {
                method: 'POST'
            });
            const data = await response.json();
            console.log('Tick stream stopped:', data);
            await fetchTickStatus();
        } catch (error) {
            console.error('Failed to stop tick stream:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriceChange = () => {
        if (!currentCandle) return { value: 0, percentage: 0 };
        const change = currentCandle.close - currentCandle.open;
        const percentage = (change / currentCandle.open) * 100;
        return { value: change, percentage };
    };

    const priceChange = getPriceChange();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Live Market Data</h1>
                    <p className="text-sm text-zinc-400 mt-1">Real-time tick streaming and live candles</p>
                </div>

                <div className="flex items-center gap-3">
                    {tickStatus?.running ? (
                        <button
                            onClick={stopTickStream}
                            disabled={loading}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <Square className="w-4 h-4" />
                            Stop Stream
                        </button>
                    ) : (
                        <button
                            onClick={startTickStream}
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <Play className="w-4 h-4" />
                            Start Stream
                        </button>
                    )}

                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                        <div className={`w-2 h-2 rounded-full ${tickStatus?.running ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                        <span className="text-sm text-zinc-400">
                            {tickStatus?.running ? 'Streaming' : 'Stopped'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Market Data Component */}
            <MarketData />

            {/* Symbol Selector */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-zinc-400">Symbol:</label>
                    <div className="flex gap-2">
                        {symbols.map((symbol) => (
                            <button
                                key={symbol}
                                onClick={() => setSelectedSymbol(symbol)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedSymbol === symbol
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <label className="text-sm font-medium text-zinc-400">Interval:</label>
                        <select
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="1min">1 Minute</option>
                            <option value="3min">3 Minutes</option>
                            <option value="5min">5 Minutes</option>
                            <option value="15min">15 Minutes</option>
                            <option value="30min">30 Minutes</option>
                            <option value="60min">1 Hour</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Current Price Card */}
            {currentCandle && (
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-100">
                                ₹{currentCandle.close.toFixed(2)}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                {priceChange.value >= 0 ? (
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                )}
                                <span className={`text-lg font-semibold ${priceChange.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {priceChange.value >= 0 ? '+' : ''}{priceChange.value.toFixed(2)} ({priceChange.percentage.toFixed(2)}%)
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-6 text-right">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Open</p>
                                <p className="text-lg font-semibold text-zinc-100">₹{currentCandle.open.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">High</p>
                                <p className="text-lg font-semibold text-emerald-400">₹{currentCandle.high.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Low</p>
                                <p className="text-lg font-semibold text-red-400">₹{currentCandle.low.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase">Volume</p>
                                <p className="text-lg font-semibold text-zinc-100">{currentCandle.volume.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Candles Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-100">Recent Candles</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Open</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">High</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Low</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Close</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Volume</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Change</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {candles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                                        {tickStatus?.running ? 'Waiting for candle data...' : 'Start tick stream to see live candles'}
                                    </td>
                                </tr>
                            ) : (
                                candles.slice().reverse().map((candle, index) => {
                                    const change = candle.close - candle.open;
                                    const changePercent = (change / candle.open) * 100;
                                    return (
                                        <tr key={index} className="hover:bg-zinc-800/50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                                                {new Date(candle.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-300">
                                                ₹{candle.open.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-400">
                                                ₹{candle.high.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-400">
                                                ₹{candle.low.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-zinc-100">
                                                ₹{candle.close.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-400">
                                                {candle.volume.toLocaleString()}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Real-Time Data Stream Section */}
            <div className="mt-8">
                <RealTimeDataStream />
            </div>

            {/* Historical Data & Charts Section */}
            <div className="mt-8">
                <HistoricalChart symbol={`NSE:${selectedSymbol}`} />
            </div>
        </div>
    );
}
