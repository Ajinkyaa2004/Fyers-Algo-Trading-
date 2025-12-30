import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Zap, AlertCircle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface OrderData {
    id?: string;
    order_id?: string;
    tradingsymbol?: string;
    status?: string;
    quantity?: number;
    price?: number;
    filled_quantity?: number;
    [key: string]: any;
}

interface TradeData {
    trade_id?: string;
    tradingsymbol?: string;
    quantity?: number;
    price?: number;
    [key: string]: any;
}

interface PositionData {
    id?: string;
    tradingsymbol?: string;
    quantity?: number;
    [key: string]: any;
}

export const OrderStreamMonitor: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(['OnOrders', 'OnTrades', 'OnPositions']));
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [trades, setTrades] = useState<TradeData[]>([]);
    const [positions, setPositions] = useState<PositionData[]>([]);
    const [error, setError] = useState('');
    const [messageCount, setMessageCount] = useState({ orders: 0, trades: 0, positions: 0, general: 0 });
    const [activeTab, setActiveTab] = useState<'orders' | 'trades' | 'positions'>('orders');
    const websocketRef = useRef<WebSocket | null>(null);

    // Connect to Order WebSocket on mount
    useEffect(() => {
        const connectWebSocket = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8001/api/order-stream/connect', {
                    method: 'POST'
                });
                const result = await response.json();
                if (result.status === 'success') {
                    setIsConnected(true);
                    setError('');
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
            const ws = new WebSocket('ws://127.0.0.1:8001/api/order-stream/stream');

            ws.onopen = () => {
                setIsStreaming(true);
                setError('');
                // Subscribe to selected events
                ws.send(JSON.stringify({
                    action: 'subscribe',
                    event_types: Array.from(selectedEvents)
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    const type = message.type;

                    if (type === 'OnOrders') {
                        setOrders(prev => {
                            const updated = [...prev];
                            const existing = updated.findIndex(o => o.order_id === message.data.order_id);
                            if (existing >= 0) {
                                updated[existing] = message.data;
                            } else {
                                updated.unshift(message.data);
                            }
                            return updated.slice(0, 50); // Keep last 50
                        });
                        setMessageCount(prev => ({ ...prev, orders: prev.orders + 1 }));
                    } else if (type === 'OnTrades') {
                        setTrades(prev => {
                            const updated = [...prev];
                            const existing = updated.findIndex(t => t.trade_id === message.data.trade_id);
                            if (existing >= 0) {
                                updated[existing] = message.data;
                            } else {
                                updated.unshift(message.data);
                            }
                            return updated.slice(0, 50); // Keep last 50
                        });
                        setMessageCount(prev => ({ ...prev, trades: prev.trades + 1 }));
                    } else if (type === 'OnPositions') {
                        setPositions(prev => {
                            const updated = [...prev];
                            const existing = updated.findIndex(p => p.id === message.data.id);
                            if (existing >= 0) {
                                updated[existing] = message.data;
                            } else {
                                updated.unshift(message.data);
                            }
                            return updated;
                        });
                        setMessageCount(prev => ({ ...prev, positions: prev.positions + 1 }));
                    } else if (type === 'OnGeneral') {
                        setMessageCount(prev => ({ ...prev, general: prev.general + 1 }));
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

    const toggleEventType = (eventType: string) => {
        const newEvents = new Set(selectedEvents);
        if (newEvents.has(eventType)) {
            newEvents.delete(eventType);
        } else {
            newEvents.add(eventType);
        }
        setSelectedEvents(newEvents);

        // Update subscription if streaming
        if (websocketRef.current && isStreaming) {
            websocketRef.current.send(JSON.stringify({
                action: 'subscribe',
                event_types: Array.from(newEvents)
            }));
        }
    };

    const getOrderStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'complete':
            case 'filled':
                return 'bg-emerald-500/20 text-emerald-400';
            case 'pending':
            case 'open':
                return 'bg-blue-500/20 text-blue-400';
            case 'rejected':
            case 'cancelled':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-zinc-700 text-zinc-400';
        }
    };

    const totalMessages = messageCount.orders + messageCount.trades + messageCount.positions + messageCount.general;

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-100">Order Stream Monitor</h3>
                        <p className="text-xs text-zinc-500">
                            {isConnected ? '✓ Connected' : '✗ Disconnected'} · 
                            {isStreaming ? ' ✓ Streaming' : ' ✗ Not streaming'} · 
                            Messages: {totalMessages}
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

            {/* Event Type Selector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <h4 className="font-semibold text-zinc-100">Subscribe to Events</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['OnOrders', 'OnTrades', 'OnPositions', 'OnGeneral'].map((eventType) => (
                        <button
                            key={eventType}
                            onClick={() => toggleEventType(eventType)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                selectedEvents.has(eventType)
                                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500'
                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                            }`}
                        >
                            <div className="flex items-center gap-2 justify-center">
                                {selectedEvents.has(eventType) && <CheckCircle className="w-4 h-4" />}
                                {eventType}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 mb-1">Orders</div>
                    <div className="text-2xl font-bold text-blue-400">{orders.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">+{messageCount.orders} new</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 mb-1">Trades</div>
                    <div className="text-2xl font-bold text-emerald-400">{trades.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">+{messageCount.trades} new</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 mb-1">Positions</div>
                    <div className="text-2xl font-bold text-purple-400">{positions.length}</div>
                    <div className="text-xs text-zinc-500 mt-1">+{messageCount.positions} new</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 mb-1">Total Events</div>
                    <div className="text-2xl font-bold text-yellow-400">{totalMessages}</div>
                    <div className="text-xs text-zinc-500 mt-1">+{messageCount.general} general</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'orders'
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    Orders ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('trades')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'trades'
                            ? 'border-b-2 border-emerald-500 text-emerald-400'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    Trades ({trades.length})
                </button>
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'positions'
                            ? 'border-b-2 border-purple-500 text-purple-400'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    Positions ({positions.length})
                </button>
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-3">
                    {orders.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {orders.map((order, idx) => (
                                <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-zinc-100">{order.tradingsymbol}</div>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${getOrderStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-zinc-400">
                                        <div>
                                            <div className="text-zinc-500">Qty</div>
                                            <div className="font-semibold text-zinc-300">{order.quantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Filled</div>
                                            <div className="font-semibold text-zinc-300">{order.filled_quantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Price</div>
                                            <div className="font-semibold text-zinc-300">₹{order.price?.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">ID</div>
                                            <div className="font-mono text-xs text-zinc-300">{order.order_id?.slice(0, 8)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-zinc-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{isStreaming ? 'Waiting for orders...' : 'Start streaming to see orders'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
                <div className="space-y-3">
                    {trades.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {trades.map((trade, idx) => (
                                <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-zinc-100">{trade.tradingsymbol}</div>
                                        <div className="flex items-center gap-1 text-emerald-400">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-xs font-medium">Executed</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs text-zinc-400">
                                        <div>
                                            <div className="text-zinc-500">Qty</div>
                                            <div className="font-semibold text-zinc-300">{trade.quantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Price</div>
                                            <div className="font-semibold text-zinc-300">₹{trade.price?.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Value</div>
                                            <div className="font-semibold text-emerald-400">
                                                ₹{((trade.quantity || 0) * (trade.price || 0)).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <div className="text-zinc-500">ID</div>
                                            <div className="font-mono text-xs text-zinc-300">{trade.trade_id?.slice(0, 8)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-zinc-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{isStreaming ? 'Waiting for trades...' : 'Start streaming to see trades'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Positions Tab */}
            {activeTab === 'positions' && (
                <div className="space-y-3">
                    {positions.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {positions.map((position, idx) => (
                                <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-zinc-100">{position.tradingsymbol}</div>
                                        <div className="text-sm font-medium text-purple-400">Open</div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-zinc-400">
                                        <div>
                                            <div className="text-zinc-500">Qty</div>
                                            <div className="font-semibold text-zinc-300">{position.quantity}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Avg Price</div>
                                            <div className="font-semibold text-zinc-300">₹{position.avg_price?.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">P&L</div>
                                            <div className={`font-semibold ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                ₹{position.pnl?.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500">Type</div>
                                            <div className="font-semibold text-zinc-300">{position.product}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-zinc-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{isStreaming ? 'Waiting for positions...' : 'Start streaming to see positions'}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-400 space-y-1">
                <p>• Real-time monitoring of orders, trades, and positions</p>
                <p>• Select event types to monitor specific activities</p>
                <p>• Updates display automatically as they occur</p>
                <p>• OnGeneral captures system messages and notifications</p>
            </div>
        </div>
    );
};
