import { useState, useEffect } from 'react';
import { User, Wallet, TrendingUp, Activity, RefreshCw } from 'lucide-react';

interface UserData {
  profile: any;
  funds: any;
  holdings: any[];
  positions: any[];
  orders: any[];
}

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, fundsRes, holdingsRes, positionsRes, ordersRes] = await Promise.all([
        fetch('http://127.0.0.1:8001/api/portfolio/profile'),
        fetch('http://127.0.0.1:8001/api/portfolio/margins'),
        fetch('http://127.0.0.1:8001/api/portfolio/holdings'),
        fetch('http://127.0.0.1:8001/api/portfolio/positions'),
        fetch('http://127.0.0.1:8001/api/portfolio/orders'),
      ]);

      const [profileData, fundsData, holdingsData, positionsData, ordersData] = await Promise.all([
        profileRes.json(),
        fundsRes.json(),
        holdingsRes.json(),
        positionsRes.json(),
        ordersRes.json(),
      ]);

      setUserData({
        profile: profileData.data,
        funds: fundsData.data,
        holdings: holdingsData.data || [],
        positions: positionsData.data?.net || [],
        orders: ordersData.data || [],
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-8 max-w-md">
          <h2 className="text-red-400 font-bold text-lg mb-2">Error Loading Data</h2>
          <p className="text-zinc-300 mb-4">{error}</p>
          <button
            onClick={fetchUserData}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Your Trading Dashboard</h1>
          <button
            onClick={fetchUserData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* User Profile Card */}
        {userData?.profile && (
          <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{userData.profile.user_name}</h2>
                <p className="text-zinc-400 mb-3">{userData.profile.email}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {userData.profile.broker}
                  </span>
                  <span className="text-sm text-zinc-400">
                    📍 Exchanges: {userData.profile.exchanges?.join(', ') || 'N/A'}
                  </span>
                  <span className="text-sm text-zinc-400">
                    🏆 Type: {userData.profile.user_type || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funds Overview */}
        {userData?.funds && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400">Available Cash</h3>
                <Wallet className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold">
                ₹{userData.funds.available?.cash?.toLocaleString() || 0}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400">Used Margin</h3>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-amber-400">
                ₹{userData.funds.utilised?.debits?.toLocaleString() || 0}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400">Net Equity</h3>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-400">
                ₹{userData.funds.net?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        )}

        {/* Holdings */}
        {userData?.holdings && userData.holdings.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Holdings ({userData.holdings.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Symbol</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Quantity</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Avg Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">LTP</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Value</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {userData.holdings.map((holding, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/50">
                      <td className="px-6 py-4 font-semibold">{holding.tradingsymbol}</td>
                      <td className="px-6 py-4 text-right">{holding.quantity}</td>
                      <td className="px-6 py-4 text-right">₹{holding.average_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">₹{holding.last_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">₹{(holding.last_price * holding.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${holding.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ₹{holding.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Positions */}
        {userData?.positions && userData.positions.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Open Positions ({userData.positions.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Symbol</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Quantity</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Avg Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">LTP</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {userData.positions.map((position, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/50">
                      <td className="px-6 py-4 font-semibold">{position.tradingsymbol}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${position.quantity > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {position.quantity > 0 ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{Math.abs(position.quantity)}</td>
                      <td className="px-6 py-4 text-right">₹{position.average_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">₹{position.last_price.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${position.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ₹{position.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {userData?.orders && userData.orders.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold">Recent Orders ({userData.orders.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Symbol</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Qty</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Price</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-400 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {userData.orders.slice(0, 10).map((order, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/50">
                      <td className="px-6 py-4 font-semibold">{order.tradingsymbol}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${order.transaction_type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {order.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{order.quantity}</td>
                      <td className="px-6 py-4 text-right">₹{order.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${order.status === 'COMPLETE' ? 'bg-emerald-500/20 text-emerald-400' : order.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-zinc-500">
                        {new Date(order.order_timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Messages */}
        {userData?.holdings?.length === 0 && userData?.positions?.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400 text-lg">No holdings or positions yet. Start trading!</p>
          </div>
        )}
      </div>
    </div>
  );
}
