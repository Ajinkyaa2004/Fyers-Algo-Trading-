import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Portfolio {
  total_value: number;
  available_cash: number;
  used_margin: number;
  pnl: number;
  pnl_percentage: number;
}

interface Position {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  pnl: number;
  pnl_percentage: number;
}

interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const LiveTradingDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);

  // Chart states
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [selectedStock, setSelectedStock] = useState('NSE:SBIN-EQ');
  const [timeframe, setTimeframe] = useState<'1min' | '5min' | '15min' | '1h' | '1d'>('5min');
  const [chartPrice, setChartPrice] = useState(0);

  // Form states
  const [buyForm, setBuyForm] = useState({
    symbol: 'NSE:SBIN-EQ',
    quantity: 1,
    stopLoss: 0,
    takeProfit: 0,
  });

  const [sellForm, setSellForm] = useState({
    symbol: 'NSE:SBIN-EQ',
    quantity: 1,
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [portfolioRes, positionsRes, ordersRes] = await Promise.all([
        fetch('http://127.0.0.1:8001/api/live-trading/portfolio'),
        fetch('http://127.0.0.1:8001/api/live-trading/positions'),
        fetch('http://127.0.0.1:8001/api/live-trading/orders'),
      ]);

      if (!portfolioRes.ok || !positionsRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const portfolioData = await portfolioRes.json();
      const positionsData = await positionsRes.json();
      const ordersData = await ordersRes.json();

      setPortfolio(portfolioData.data || portfolioData);
      setPositions(positionsData.data || positionsData);
      setOrders(ordersData.data || ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to connect to trading backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateCandleData = (): CandleData[] => {
    const data: CandleData[] = [];
    let basePrice = 550;
    
    for (let i = 0; i < 20; i++) {
      const open = basePrice + (Math.random() - 0.5) * 10;
      const close = open + (Math.random() - 0.5) * 15;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      
      data.push({
        time: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
      });
      
      basePrice = close;
    }
    
    setChartPrice(parseFloat(basePrice.toFixed(2)));
    return data;
  };

  useEffect(() => {
    const data = generateCandleData();
    setCandleData(data);
    const interval = setInterval(() => {
      setCandleData(generateCandleData());
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedStock, timeframe]);

  const handleBuy = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8001/api/live-trading/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: buyForm.symbol,
          quantity: parseInt(buyForm.quantity.toString()),
          stop_loss_price: buyForm.stopLoss || undefined,
          take_profit_price: buyForm.takeProfit || undefined,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Buy order placed successfully!\nOrder ID: ${result.order_id}`);
        setShowBuyForm(false);
        fetchDashboardData();
      } else {
        alert(`Buy order failed: ${result.message}`);
      }
    } catch (err) {
      alert('Error placing buy order: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8001/api/live-trading/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: sellForm.symbol,
          quantity: parseInt(sellForm.quantity.toString()),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Sell order placed successfully!\nOrder ID: ${result.order_id}\nP&L: ₹${result.pnl}`);
        setShowSellForm(false);
        fetchDashboardData();
      } else {
        alert(`Sell order failed: ${result.message}`);
      }
    } catch (err) {
      alert('Error placing sell order: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p>Loading trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Portfolio Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Live Trading Dashboard</h1>
            <p className="text-slate-400">Real-time market data & automated trading</p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {portfolio && (
          <div className="grid grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
              <p className="text-blue-200 text-sm font-semibold mb-2">Portfolio Value</p>
              <p className="text-3xl font-bold text-white">₹{(portfolio.total_value || 0).toLocaleString('en-IN')}</p>
              <p className={`text-sm mt-2 ${portfolio.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.pnl_percentage >= 0 ? '+' : ''}{portfolio.pnl_percentage?.toFixed(2)}%
              </p>
            </div>

            {/* Available Cash */}
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 border border-green-700">
              <p className="text-green-200 text-sm font-semibold mb-2">Available Cash</p>
              <p className="text-3xl font-bold text-white">₹{(portfolio.available_cash || 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-green-300 mt-2">Ready to trade</p>
            </div>

            {/* Used Margin */}
            <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-6 border border-orange-700">
              <p className="text-orange-200 text-sm font-semibold mb-2">Used Margin</p>
              <p className="text-3xl font-bold text-white">₹{(portfolio.used_margin || 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-orange-300 mt-2">In positions</p>
            </div>

            {/* Total P&L */}
            <div className={`rounded-lg p-6 border bg-gradient-to-br ${portfolio.pnl >= 0 ? 'from-green-900 to-green-800 border-green-700' : 'from-red-900 to-red-800 border-red-700'}`}>
              <p className={`text-sm font-semibold mb-2 ${portfolio.pnl >= 0 ? 'text-green-200' : 'text-red-200'}`}>Total P&L</p>
              <p className={`text-3xl font-bold ${portfolio.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.pnl >= 0 ? '+' : ''}₹{portfolio.pnl?.toLocaleString('en-IN') || '0'}
              </p>
              <p className={`text-sm mt-2 ${portfolio.pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {portfolio.pnl >= 0 ? '📈 Winning' : '📉 Losing'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trading Actions */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setShowBuyForm(!showBuyForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <TrendingUp className="h-5 w-5" />
          Place Buy Order
        </button>
        <button
          onClick={() => setShowSellForm(!showSellForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          <TrendingDown className="h-5 w-5" />
          Place Sell Order
        </button>
      </div>

      {/* Live Chart Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📊 Live Candlestick Chart</h2>
          <div className="flex gap-4">
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600"
            >
              <option>NSE:SBIN-EQ</option>
              <option>NSE:INFY-EQ</option>
              <option>NSE:TCS-EQ</option>
              <option>NSE:RELIANCE-EQ</option>
              <option>NSE:HDFC-EQ</option>
              <option>NSE:MARUTI-EQ</option>
              <option>NSE:WIPRO-EQ</option>
              <option>NSE:LT-EQ</option>
            </select>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600"
            >
              <option value="1min">1 Min</option>
              <option value="5min">5 Min</option>
              <option value="15min">15 Min</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
            </select>
          </div>
        </div>

        {/* Price Info */}
        <div className="bg-slate-700 rounded p-4 mb-4 flex gap-4 justify-between">
          <div>
            <p className="text-slate-400 text-sm">Current Price</p>
            <p className="text-2xl font-bold text-white">₹{chartPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">24h High</p>
            <p className="text-lg font-semibold text-green-400">{candleData.length > 0 ? '₹' + Math.max(...candleData.map(d => d.high)).toFixed(2) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">24h Low</p>
            <p className="text-lg font-semibold text-red-400">{candleData.length > 0 ? '₹' + Math.min(...candleData.map(d => d.low)).toFixed(2) : 'N/A'}</p>
          </div>
        </div>

        {/* Chart */}
        {candleData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={candleData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404854" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number | undefined) => value !== undefined ? `₹${value.toFixed(2)}` : ''}
              />
              <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="Close" />
              <Line type="monotone" dataKey="open" stroke="#a855f7" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Open" />
              <Bar dataKey="volume" fill="#10b981" opacity={0.3} name="Volume" yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400">Loading chart data...</p>
          </div>
        )}
      </div>

      {/* Buy Form */}
      {showBuyForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Place Buy Order</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Symbol</label>
              <input
                type="text"
                value={buyForm.symbol}
                onChange={(e) => setBuyForm({ ...buyForm, symbol: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                placeholder="e.g., NSE:SBIN-EQ"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Quantity</label>
              <input
                type="number"
                value={buyForm.quantity}
                onChange={(e) => setBuyForm({ ...buyForm, quantity: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                min="1"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Stop Loss (Optional)</label>
              <input
                type="number"
                value={buyForm.stopLoss}
                onChange={(e) => setBuyForm({ ...buyForm, stopLoss: parseFloat(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                placeholder="Price"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Take Profit (Optional)</label>
              <input
                type="number"
                value={buyForm.takeProfit}
                onChange={(e) => setBuyForm({ ...buyForm, takeProfit: parseFloat(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                placeholder="Price"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold"
            >
              {loading ? 'Processing...' : 'Confirm Buy'}
            </button>
            <button
              onClick={() => setShowBuyForm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sell Form */}
      {showSellForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Place Sell Order</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Symbol</label>
              <input
                type="text"
                value={sellForm.symbol}
                onChange={(e) => setSellForm({ ...sellForm, symbol: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                placeholder="e.g., NSE:SBIN-EQ"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-semibold block mb-2">Quantity</label>
              <input
                type="number"
                value={sellForm.quantity}
                onChange={(e) => setSellForm({ ...sellForm, quantity: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded"
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSell}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold"
            >
              {loading ? 'Processing...' : 'Confirm Sell'}
            </button>
            <button
              onClick={() => setShowSellForm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Positions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">📍 Active Positions ({positions.length})</h2>
        {positions.length > 0 ? (
          <div className="grid gap-4">
            {positions.map((pos, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">SYMBOL</p>
                    <p className="text-white font-bold">{pos.symbol}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">QUANTITY</p>
                    <p className="text-white font-bold">{pos.quantity}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">AVG PRICE</p>
                    <p className="text-white">₹{pos.avg_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">CURRENT</p>
                    <p className="text-white">₹{pos.current_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">P&L</p>
                    <p className={`font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{pos.pnl?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">RETURN</p>
                    <p className={`font-bold ${pos.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.pnl_percentage?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
            <p className="text-slate-400">No active positions</p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">📋 Recent Orders ({orders.length})</h2>
        {orders.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {orders.slice(0, 10).map((order, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-white font-semibold">{order.symbol}</p>
                  <p className="text-slate-400 text-sm">{order.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold flex items-center gap-2 ${order.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {order.type === 'BUY' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {order.type} {order.quantity} @ ₹{order.price?.toFixed(2)}
                  </p>
                  <p className={`text-xs mt-1 ${order.status === 'completed' ? 'text-green-300' : 'text-yellow-300'}`}>
                    {order.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
            <p className="text-slate-400">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTradingDashboard;
