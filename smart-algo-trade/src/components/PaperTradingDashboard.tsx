import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, RotateCcw, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Position {
  symbol: string;
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

interface Portfolio {
  initial_capital: number;
  current_value: number;
  cash: number;
  positions_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  return_percent: number;
  positions: Record<string, Position>;
  open_positions_count: number;
  closed_trades: number;
}

interface Stats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  best_trade: number;
  worst_trade: number;
}

const PaperTradingDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [symbol, setSymbol] = useState('NSE:SBIN-EQ');
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(500);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderLoading, setOrderLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'trades' | 'stats'>('overview');

  // Fetch portfolio data
  const fetchPortfolio = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/portfolio');
      const data = await response.json();
      if (data.status === 'success') {
        setPortfolio(data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/stats');
      const data = await response.json();
      if (data.status === 'success') {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/orders');
      const data = await response.json();
      if (data.status === 'success') {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/trades');
      const data = await response.json();
      if (data.status === 'success') {
        setTrades(data.data);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPortfolio(), fetchStats(), fetchOrders(), fetchTrades()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Place order
  const handlePlaceOrder = async () => {
    if (!symbol || quantity <= 0 || price <= 0) {
      alert('Please fill in all fields');
      return;
    }

    setOrderLoading(true);
    try {
      const params = new URLSearchParams({
        symbol,
        quantity: quantity.toString(),
        price: price.toString(),
        side,
        order_type: 'LIMIT'
      });

      const response = await fetch(
        `http://127.0.0.1:8001/api/paper-trading/place-order?${params}`,
        { method: 'POST' }
      );
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${side} order executed!\n\nOrder ID: ${data.order.order_id}\nCash Remaining: ₹${data.cash_remaining.toFixed(2)}`);
        setSymbol('NSE:SBIN-EQ');
        setQuantity(10);
        setPrice(500);
        await refreshData();
      } else {
        alert(`❌ Order Failed: ${data.message}`);
      }
    } catch (error) {
      alert(`Error placing order: ${error}`);
    } finally {
      setOrderLoading(false);
    }
  };

  // Reset portfolio
  const handleReset = async () => {
    if (!confirm('Are you sure? This will reset all positions and trades.')) return;

    try {
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/reset', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Paper trading portfolio reset to ₹10,000');
        await refreshData();
      }
    } catch (error) {
      alert(`Error resetting portfolio: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="mx-auto w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📈 Paper Trading Simulator</h1>
            <p className="text-slate-400">Trade with ₹10,000 virtual capital | Real-time P&L calculation</p>
          </div>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold mb-1">Initial Capital</p>
              <p className="text-2xl font-bold text-white">₹{portfolio.initial_capital.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold mb-1">Current Value</p>
              <p className="text-2xl font-bold text-white">₹{portfolio.current_value.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold mb-1">Cash Available</p>
              <p className="text-2xl font-bold text-white">₹{portfolio.cash.toLocaleString()}</p>
            </div>
            <div className={`${portfolio.total_pnl >= 0 ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'} rounded-lg p-4 border`}>
              <p className="text-slate-400 text-sm font-semibold mb-1">Total P&L</p>
              <p className={`text-2xl font-bold ${portfolio.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{portfolio.total_pnl.toLocaleString()}
              </p>
              <p className={`text-xs mt-1 ${portfolio.return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.return_percent >= 0 ? '+' : ''}{portfolio.return_percent.toFixed(2)}%
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold mb-1">Positions</p>
              <p className="text-2xl font-bold text-white">{portfolio.open_positions_count}</p>
              <p className="text-xs text-slate-500 mt-1">Open / {portfolio.closed_trades} Closed</p>
            </div>
          </div>
        )}

        {/* P&L Details */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Realized P&L</p>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className={`text-xl font-bold ${portfolio.realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{portfolio.realized_pnl.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Unrealized P&L</p>
                <TrendingDown className="w-5 h-5 text-yellow-400" />
              </div>
              <p className={`text-xl font-bold ${portfolio.unrealized_pnl >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                ₹{portfolio.unrealized_pnl.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Positions Value</p>
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-400">₹{portfolio.positions_value.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Trading Panel */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Place Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-sm block mb-2">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="NSE:SBIN-EQ"
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm block mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min="1"
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm block mb-2">Price</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                min="0.01"
                step="0.01"
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm block mb-2">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as 'BUY' | 'SELL')}
                className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className={`w-full py-2 px-4 rounded font-semibold transition flex items-center justify-center gap-2 ${
                  side === 'BUY'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50`}
              >
                {side === 'BUY' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                {orderLoading ? 'Executing...' : side}
              </button>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Order will execute at the entered price. Total amount: ₹{(quantity * price).toLocaleString()}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 mb-6">
          {(['overview', 'positions', 'trades', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && portfolio && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Portfolio Value History</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { name: 'Start', value: portfolio.initial_capital },
                    { name: 'Current', value: portfolio.current_value }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-700 rounded p-4">
                  <p className="text-slate-400 text-sm mb-2">Capital Allocation</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span className="font-semibold">{((portfolio.cash / portfolio.initial_capital) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(portfolio.cash / portfolio.initial_capital) * 100}%`}}></div>
                    </div>
                    <div className="flex justify-between">
                      <span>Positions</span>
                      <span className="font-semibold">{((portfolio.positions_value / portfolio.initial_capital) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${(portfolio.positions_value / portfolio.initial_capital) * 100}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positions' && portfolio && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Open Positions ({portfolio.open_positions_count})</h3>
            {portfolio.open_positions_count > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-4 py-3 text-slate-300">Symbol</th>
                      <th className="text-right px-4 py-3 text-slate-300">Qty</th>
                      <th className="text-right px-4 py-3 text-slate-300">Avg Price</th>
                      <th className="text-right px-4 py-3 text-slate-300">Current Price</th>
                      <th className="text-right px-4 py-3 text-slate-300">Value</th>
                      <th className="text-right px-4 py-3 text-slate-300">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(portfolio.positions).map(([sym, pos]) => {
                      const pnl = (pos.current_price - pos.avg_price) * pos.qty;
                      const pnlPercent = ((pnl / (pos.avg_price * pos.qty)) * 100);
                      return (
                        <tr key={sym} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-white font-semibold">{sym}</td>
                          <td className="text-right px-4 py-3 text-slate-300">{pos.qty}</td>
                          <td className="text-right px-4 py-3 text-slate-300">₹{pos.avg_price.toFixed(2)}</td>
                          <td className="text-right px-4 py-3 text-slate-300">₹{pos.current_price.toFixed(2)}</td>
                          <td className="text-right px-4 py-3 text-white">₹{pos.value.toFixed(2)}</td>
                          <td className={`text-right px-4 py-3 font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No open positions</p>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Completed Trades ({trades.length})</h3>
            {trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-4 py-3 text-slate-300">Symbol</th>
                      <th className="text-right px-4 py-3 text-slate-300">Qty</th>
                      <th className="text-right px-4 py-3 text-slate-300">Entry</th>
                      <th className="text-right px-4 py-3 text-slate-300">Exit</th>
                      <th className="text-right px-4 py-3 text-slate-300">P&L</th>
                      <th className="text-right px-4 py-3 text-slate-300">Return</th>
                      <th className="text-left px-4 py-3 text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, idx) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-white font-semibold">{trade.symbol}</td>
                        <td className="text-right px-4 py-3 text-slate-300">{trade.quantity}</td>
                        <td className="text-right px-4 py-3 text-slate-300">₹{trade.entry_price.toFixed(2)}</td>
                        <td className="text-right px-4 py-3 text-slate-300">₹{trade.exit_price.toFixed(2)}</td>
                        <td className={`text-right px-4 py-3 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ₹{trade.pnl.toFixed(2)}
                        </td>
                        <td className={`text-right px-4 py-3 font-semibold ${trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl_percent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-slate-400">{new Date(trade.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No closed trades yet</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Trading Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Trades</span>
                  <span className="font-semibold text-white">{stats.total_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Winning Trades</span>
                  <span className="font-semibold text-green-400">{stats.winning_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Losing Trades</span>
                  <span className="font-semibold text-red-400">{stats.losing_trades}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-3 mt-3">
                  <span className="text-slate-400">Win Rate</span>
                  <span className="font-semibold text-blue-400">{stats.win_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Win</span>
                  <span className="font-semibold text-green-400">₹{stats.avg_win.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Loss</span>
                  <span className="font-semibold text-red-400">₹{stats.avg_loss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Trade Range</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Best Trade</span>
                  <span className="font-semibold text-green-400">₹{stats.best_trade.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Worst Trade</span>
                  <span className="font-semibold text-red-400">₹{stats.worst_trade.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-3 mt-3">
                  <span className="text-slate-400">Profit Factor</span>
                  <span className="font-semibold text-white">
                    {stats.avg_loss !== 0 ? (Math.abs(stats.avg_win / stats.avg_loss)).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Drawdown</span>
                  <span className="font-semibold text-orange-400">{stats.max_drawdown.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperTradingDashboard;
