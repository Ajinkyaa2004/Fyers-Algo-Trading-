import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Holding {
    tradingsymbol: string;
    exchange: string;
    quantity: number;
    average_price: number;
    last_price: number;
    pnl?: number;
    day_change?: number;
    day_change_percentage?: number;
    [key: string]: any;
}

export const HoldingsViewer: React.FC = () => {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchHoldings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8001/api/portfolio/holdings');
            const result = await response.json();
            if (result.status === 'success') {
                const data = Array.isArray(result.data) ? result.data : result.data.holdings || [];
                setHoldings(data);
                setLastUpdate(new Date());
            } else {
                setError('Failed to fetch holdings');
            }
        } catch (err) {
            setError(`Error fetching holdings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHoldings();
        const interval = setInterval(fetchHoldings, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const calculateTotalValue = (quantity: number, price: number) => quantity * price;

    const calculateCostBasis = (quantity: number, avgPrice: number) => quantity * avgPrice;

    const calculatePnL = (holding: Holding) => {
        const currentValue = calculateTotalValue(holding.quantity, holding.last_price);
        const costBasis = calculateCostBasis(holding.quantity, holding.average_price);
        return currentValue - costBasis;
    };

    const getPnLPercentage = (holding: Holding) => {
        const pnl = calculatePnL(holding);
        const costBasis = calculateCostBasis(holding.quantity, holding.average_price);
        return costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    };

    const totalCurrentValue = holdings.reduce(
        (sum, holding) => sum + calculateTotalValue(holding.quantity, holding.last_price),
        0
    );

    const totalCostBasis = holdings.reduce(
        (sum, holding) => sum + calculateCostBasis(holding.quantity, holding.average_price),
        0
    );

    const totalPnL = totalCurrentValue - totalCostBasis;
    const totalPnLPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    return (
        <div className="w-full space-y-4">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-semibold text-zinc-100">Holdings ({holdings.length})</h3>
                </div>
                <button
                    onClick={fetchHoldings}
                    disabled={loading}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            {holdings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 mb-1">Total Current Value</div>
                        <div className="text-2xl font-bold text-zinc-100">₹{totalCurrentValue.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 mb-1">Total Cost Basis</div>
                        <div className="text-2xl font-bold text-zinc-100">₹{totalCostBasis.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 mb-1">Total P&L</div>
                        <div className={`text-2xl font-bold flex items-center gap-2 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ₹{totalPnL.toFixed(2)}
                            <span className="text-lg">({totalPnLPercentage.toFixed(2)}%)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Holdings List */}
            {loading && !error ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
            ) : holdings.length > 0 ? (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left px-4 py-2 text-zinc-400">Symbol</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">Quantity</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">Avg Price</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">Last Price</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">Cost Basis</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">Current Value</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">P&L</th>
                                    <th className="text-right px-4 py-2 text-zinc-400">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((holding) => {
                                    const currentValue = calculateTotalValue(holding.quantity, holding.last_price);
                                    const costBasis = calculateCostBasis(holding.quantity, holding.average_price);
                                    const pnl = calculatePnL(holding);
                                    const pnlPercent = getPnLPercentage(holding);

                                    return (
                                        <tr key={holding.tradingsymbol} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="px-4 py-2 font-semibold text-zinc-100">{holding.tradingsymbol}</td>
                                            <td className="px-4 py-2 text-right text-zinc-300">{holding.quantity}</td>
                                            <td className="px-4 py-2 text-right text-zinc-300">₹{holding.average_price?.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right text-zinc-300">₹{holding.last_price?.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right text-zinc-300">₹{costBasis.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-zinc-100">₹{currentValue.toFixed(2)}</td>
                                            <td className={`px-4 py-2 text-right font-semibold flex items-center justify-end gap-1 ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                ₹{pnl.toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-2 text-right font-semibold ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {pnlPercent.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {holdings.map((holding) => {
                            const currentValue = calculateTotalValue(holding.quantity, holding.last_price);
                            const costBasis = calculateCostBasis(holding.quantity, holding.average_price);
                            const pnl = calculatePnL(holding);
                            const pnlPercent = getPnLPercentage(holding);

                            return (
                                <div
                                    key={holding.tradingsymbol}
                                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-zinc-100">{holding.tradingsymbol}</span>
                                        <div className={`font-semibold flex items-center gap-1 ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            ₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-zinc-500">Quantity:</span>
                                            <div className="font-semibold text-zinc-300 mt-1">{holding.quantity}</div>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Last Price:</span>
                                            <div className="font-semibold text-zinc-300 mt-1">₹{holding.last_price?.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Avg Price:</span>
                                            <div className="font-semibold text-zinc-300 mt-1">₹{holding.average_price?.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500">Cost Basis:</span>
                                            <div className="font-semibold text-zinc-300 mt-1">₹{costBasis.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-700">
                                        <div className="text-xs text-zinc-500">Current Value</div>
                                        <div className="text-lg font-bold text-emerald-400">₹{currentValue.toFixed(2)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="p-12 text-center text-zinc-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No holdings available</p>
                </div>
            )}

            {/* Last Update */}
            <div className="text-center text-xs text-zinc-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
        </div>
    );
};
