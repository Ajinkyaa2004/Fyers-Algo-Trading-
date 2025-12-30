import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface OrderBookEntry {
    order_id: string;
    tradingsymbol: string;
    exchange: string;
    transaction_type: string;
    order_type: string;
    quantity: number;
    filled_quantity: number;
    price: number;
    status: string;
    order_timestamp: string;
    [key: string]: any;
}

interface TradeBookEntry {
    trade_id: string;
    tradingsymbol: string;
    exchange: string;
    transaction_type: string;
    quantity: number;
    price: number;
    trade_timestamp: string;
    [key: string]: any;
}

export const OrderAndTradeBook: React.FC = () => {
    const [orderbook, setOrderbook] = useState<OrderBookEntry[]>([]);
    const [tradebook, setTradebook] = useState<TradeBookEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'orderbook' | 'tradebook'>('orderbook');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const fetchOrderbook = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8001/api/portfolio/orderbook');
            const result = await response.json();
            if (result.status === 'success') {
                const data = Array.isArray(result.data) ? result.data : result.data.orderbook || [];
                setOrderbook(data);
            } else {
                setError('Failed to fetch orderbook');
            }
        } catch (err) {
            setError(`Error fetching orderbook: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchTradebook = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8001/api/portfolio/tradebook');
            const result = await response.json();
            if (result.status === 'success') {
                const data = Array.isArray(result.data) ? result.data : result.data.tradebook || [];
                setTradebook(data);
            } else {
                setError('Failed to fetch tradebook');
            }
        } catch (err) {
            setError(`Error fetching tradebook: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orderbook') {
            fetchOrderbook();
        } else {
            fetchTradebook();
        }
    }, [activeTab]);

    const getOrderStatusColor = (status: string) => {
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

    const getTransactionTypeColor = (type: string) => {
        return type === 'BUY' ? 'text-emerald-400' : 'text-red-400';
    };

    return (
        <div className="w-full space-y-4">
            {/* Tab Selector */}
            <div className="flex gap-2 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('orderbook')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'orderbook'
                            ? 'border-b-2 border-emerald-500 text-emerald-400'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    Orderbook ({orderbook.length})
                </button>
                <button
                    onClick={() => setActiveTab('tradebook')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'tradebook'
                            ? 'border-b-2 border-emerald-500 text-emerald-400'
                            : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                >
                    Tradebook ({tradebook.length})
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
            )}

            {/* Orderbook Tab */}
            {activeTab === 'orderbook' && !loading && (
                <div className="space-y-3">
                    {orderbook.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left px-4 py-2 text-zinc-400">Symbol</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Type</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Qty</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Filled</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Price</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Status</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderbook.map((order) => (
                                            <tr
                                                key={order.order_id}
                                                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                                                onClick={() => setSelectedOrderId(selectedOrderId === order.order_id ? null : order.order_id)}
                                            >
                                                <td className="px-4 py-2 font-semibold text-zinc-100">{order.tradingsymbol}</td>
                                                <td className={`px-4 py-2 font-semibold ${getTransactionTypeColor(order.transaction_type)}`}>
                                                    {order.transaction_type}
                                                </td>
                                                <td className="px-4 py-2 text-right text-zinc-300">{order.quantity}</td>
                                                <td className="px-4 py-2 text-right text-zinc-300">{order.filled_quantity}</td>
                                                <td className="px-4 py-2 text-right text-zinc-300">₹{order.price?.toFixed(2)}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs px-2 py-1 rounded font-medium ${getOrderStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-zinc-400 text-xs">
                                                    {new Date(order.order_timestamp).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {orderbook.map((order) => (
                                    <div
                                        key={order.order_id}
                                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-zinc-100">{order.tradingsymbol}</span>
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${getOrderStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                            <div>
                                                <span className="text-zinc-500">Type:</span>
                                                <span className={`ml-2 font-semibold ${getTransactionTypeColor(order.transaction_type)}`}>
                                                    {order.transaction_type}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Qty:</span>
                                                <span className="ml-2 font-semibold text-zinc-300">{order.quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Filled:</span>
                                                <span className="ml-2 font-semibold text-zinc-300">{order.filled_quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Price:</span>
                                                <span className="ml-2 font-semibold text-zinc-300">₹{order.price?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                            {new Date(order.order_timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-zinc-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No orders in orderbook</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tradebook Tab */}
            {activeTab === 'tradebook' && !loading && (
                <div className="space-y-3">
                    {tradebook.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left px-4 py-2 text-zinc-400">Trade ID</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Symbol</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Type</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Qty</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Price</th>
                                            <th className="text-right px-4 py-2 text-zinc-400">Value</th>
                                            <th className="text-left px-4 py-2 text-zinc-400">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradebook.map((trade) => {
                                            const tradeValue = (trade.quantity || 0) * (trade.price || 0);
                                            return (
                                                <tr key={trade.trade_id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                    <td className="px-4 py-2 font-mono text-xs text-zinc-400">{trade.trade_id}</td>
                                                    <td className="px-4 py-2 font-semibold text-zinc-100">{trade.tradingsymbol}</td>
                                                    <td className={`px-4 py-2 font-semibold ${getTransactionTypeColor(trade.transaction_type)}`}>
                                                        {trade.transaction_type}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-zinc-300">{trade.quantity}</td>
                                                    <td className="px-4 py-2 text-right text-zinc-300">₹{trade.price?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right font-semibold text-emerald-400">
                                                        ₹{tradeValue.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-2 text-zinc-400 text-xs">
                                                        {new Date(trade.trade_timestamp).toLocaleTimeString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {tradebook.map((trade) => {
                                    const tradeValue = (trade.quantity || 0) * (trade.price || 0);
                                    return (
                                        <div
                                            key={trade.trade_id}
                                            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-zinc-100">{trade.tradingsymbol}</span>
                                                <span className={`font-semibold ${getTransactionTypeColor(trade.transaction_type)}`}>
                                                    {trade.transaction_type}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                                                <div>
                                                    <span className="text-zinc-500">Qty:</span>
                                                    <span className="ml-2 font-semibold text-zinc-300">{trade.quantity}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500">Price:</span>
                                                    <span className="ml-2 font-semibold text-zinc-300">₹{trade.price?.toFixed(2)}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-zinc-500">Value:</span>
                                                    <span className="ml-2 font-semibold text-emerald-400">₹{tradeValue.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-700">
                                                {new Date(trade.trade_timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-zinc-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No trades executed yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
