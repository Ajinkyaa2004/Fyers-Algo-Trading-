import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, Plus, X, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';

interface RealTimeData {
    symbol: string;
    ltp?: number;
    bid?: number;
    ask?: number;
    timestamp?: number;
    [key: string]: any;
}

interface Subscription {
    symbols: string[];
    data_type: string;
}

export const RealTimeDataStream: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([
        { symbols: ['NSE:SBIN-EQ', 'NSE:ADANIENT-EQ'], data_type: 'SymbolUpdate' },
        { symbols: ['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX'], data_type: 'SymbolUpdate' }
    ]);
    const [liveData, setLiveData] = useState<Record<string, RealTimeData>>({});
    const [error, setError] = useState('');
    const [newSymbol, setNewSymbol] = useState('');
    const [dataType, setDataType] = useState<'SymbolUpdate' | 'DepthUpdate' | 'IndexUpdate'>('SymbolUpdate');
    const [messageCount, setMessageCount] = useState(0);
    const websocketRef = useRef<WebSocket | null>(null);

    // Connect to WebSocket on mount
    useEffect(() => {
        const connectWebSocket = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8001/api/websocket/connect', {
                    method: 'POST'
                });
                const result = await response.json();
                if (result.status === 'success') {
                    setIsConnected(true);
                    setError('');
                    // Initial subscriptions
                    for (const sub of subscriptions) {
                        await fetch(
                            `http://127.0.0.1:8001/api/websocket/subscribe?${sub.symbols.map(s => `symbols=${s}`).join('&')}&data_type=${sub.data_type}`,
                            { method: 'POST' }
                        );
                    }
                } else {
                    setError(result.detail || 'Failed to connect');
                }
            } catch (err) {
                setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        };

        connectWebSocket();

        return () => {
            if (websocketRef.current) {
                websocketRef.current.close();
            }
        };
    }, []);

    // Start streaming
    const startStreaming = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
        }

        try {
            const ws = new WebSocket('ws://127.0.0.1:8001/api/websocket/stream');

            ws.onopen = () => {
                setIsStreaming(true);
                setError('');
                // Subscribe to all symbols
                for (const sub of subscriptions) {
                    ws.send(JSON.stringify({
                        action: 'subscribe',
                        symbols: sub.symbols,
                        data_type: sub.data_type
                    }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'subscription') {
                        // Subscription confirmation
                    } else if (message.data) {
                        setLiveData(prev => ({
                            ...prev,
                            [message.data.symbol]: message.data
                        }));
                        setMessageCount(prev => prev + 1);
                    }
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            };

            ws.onerror = (event) => {
                setError(`WebSocket error: ${event}`);
                setIsStreaming(false);
            };

            ws.onclose = () => {
                setIsStreaming(false);
            };

            websocketRef.current = ws;
        } catch (err) {
            setError(`Failed to start stream: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const stopStreaming = () => {
        if (websocketRef.current) {
            websocketRef.current.close();
        }
        setIsStreaming(false);
    };

    const addSubscription = async () => {
        if (!newSymbol.trim()) {
            setError('Please enter a symbol');
            return;
        }

        try {
            const response = await fetch(
                `http://127.0.0.1:8001/api/websocket/subscribe?symbols=${newSymbol}&data_type=${dataType}`,
                { method: 'POST' }
            );
            const result = await response.json();

            if (result.status === 'success' || result.status === 'pending') {
                setSubscriptions(prev => [...prev, { symbols: [newSymbol], data_type: dataType }]);
                setNewSymbol('');
                setError('');

                // Subscribe via WebSocket if streaming
                if (websocketRef.current && isStreaming) {
                    websocketRef.current.send(JSON.stringify({
                        action: 'subscribe',
                        symbols: [newSymbol],
                        data_type: dataType
                    }));
                }
            }
        } catch (err) {
            setError(`Error adding subscription: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const removeSubscription = async (symbol: string) => {
        try {
            await fetch(
                `http://127.0.0.1:8001/api/websocket/unsubscribe?symbols=${symbol}&data_type=${dataType}`,
                { method: 'POST' }
            );

            setSubscriptions(prev => 
                prev.map(sub => ({
                    ...sub,
                    symbols: sub.symbols.filter(s => s !== symbol)
                })).filter(sub => sub.symbols.length > 0)
            );

            // Unsubscribe via WebSocket if streaming
            if (websocketRef.current && isStreaming) {
                websocketRef.current.send(JSON.stringify({
                    action: 'unsubscribe',
                    symbols: [symbol],
                    data_type: dataType
                }));
            }
        } catch (err) {
            setError(`Error removing subscription: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const allSymbols = subscriptions.flatMap(s => s.symbols);
    const getPriceChangeColor = (current?: number, previous?: number) => {
        if (!current || !previous) return 'text-zinc-300';
        return current > previous ? 'text-emerald-400' : current < previous ? 'text-red-400' : 'text-zinc-300';
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-100">Real-Time Data Stream</h3>
                        <p className="text-xs text-zinc-500">
                            {isConnected ? '✓ Connected' : '✗ Disconnected'} · 
                            {isStreaming ? ' ✓ Streaming' : ' ✗ Not streaming'} · 
                            Messages: {messageCount}
                        </p>
                    </div>
                </div>

                <button
                    onClick={isStreaming ? stopStreaming : startStreaming}
                    disabled={!isConnected}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isStreaming
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                    } disabled:opacity-50`}
                >
                    {isStreaming ? (
                        <>
                            <Pause className="w-4 h-4" />
                            Stop Stream
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Start Stream
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Add New Subscription */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h4 className="font-semibold text-zinc-100">Add Subscription</h4>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        placeholder="e.g., NSE:SBIN-EQ"
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                        value={dataType}
                        onChange={(e) => setDataType(e.target.value as any)}
                        className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="SymbolUpdate">Symbol Update</option>
                        <option value="DepthUpdate">Depth Update</option>
                        <option value="IndexUpdate">Index Update</option>
                    </select>
                    <button
                        onClick={addSubscription}
                        className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>

            {/* Current Subscriptions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h4 className="font-semibold text-zinc-100">Active Subscriptions ({allSymbols.length})</h4>
                <div className="flex flex-wrap gap-2">
                    {allSymbols.map((symbol) => (
                        <div
                            key={symbol}
                            className="flex items-center gap-2 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full"
                        >
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm text-zinc-100">{symbol}</span>
                            <button
                                onClick={() => removeSubscription(symbol)}
                                className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            >
                                <X className="w-3 h-3 text-zinc-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Data Feed */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h4 className="font-semibold text-zinc-100">Live Data ({Object.keys(liveData).length})</h4>
                {Object.keys(liveData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {Object.entries(liveData).map(([symbol, data]) => (
                            <div
                                key={symbol}
                                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-zinc-100">{symbol}</span>
                                    <span className="text-xs text-zinc-500">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>

                                {data.ltp !== undefined && (
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <span className="text-zinc-500">LTP</span>
                                            <div className={`font-bold text-lg ${getPriceChangeColor(data.ltp)}`}>
                                                ₹{data.ltp.toFixed(2)}
                                            </div>
                                        </div>
                                        {data.bid !== undefined && (
                                            <div>
                                                <span className="text-zinc-500">Bid</span>
                                                <div className="font-semibold text-zinc-300">₹{data.bid.toFixed(2)}</div>
                                            </div>
                                        )}
                                        {data.ask !== undefined && (
                                            <div>
                                                <span className="text-zinc-500">Ask</span>
                                                <div className="font-semibold text-zinc-300">₹{data.ask.toFixed(2)}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {data.change !== undefined && (
                                    <div className={`text-sm font-medium flex items-center gap-1 ${
                                        data.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {data.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {data.change.toFixed(2)} ({data.change_percent?.toFixed(2)}%)
                                    </div>
                                )}

                                <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                    Open: {data.open?.toFixed(2)} | High: {data.high?.toFixed(2)} | Low: {data.low?.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500">
                        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{isStreaming ? 'Waiting for real-time data...' : 'Start streaming to see live data'}</p>
                    </div>
                )}
            </div>

            {/* Status Info */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
                <p>• WebSocket connects to Fyers for real-time symbol, depth, and index data</p>
                <p>• Add symbols to receive live price updates</p>
                <p>• Data updates automatically when new prices are available</p>
                <p>• Use SymbolUpdate for stock prices, DepthUpdate for order book, IndexUpdate for indices</p>
            </div>
        </div>
    );
};
