import { useState, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Mail, 
  Building2, 
  Globe, 
  Shield, 
  CreditCard, 
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  TrendingDown,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

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
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const calculateTotalHoldingsValue = () => {
    return userData?.holdings.reduce((sum, h) => sum + (h.last_price * h.quantity), 0) || 0;
  };

  const calculateTotalPnL = () => {
    const holdingsPnL = userData?.holdings.reduce((sum, h) => sum + parseFloat(h.pnl || 0), 0) || 0;
    const positionsPnL = userData?.positions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0) || 0;
    return holdingsPnL + positionsPnL;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-[#a1a1aa]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="bg-red-950/20 border border-red-800/50 rounded-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-red-400 font-bold text-lg mb-2 text-center">Error Loading Data</h2>
          <p className="text-[#a1a1aa] mb-4 text-center">{error}</p>
          <button
            onClick={fetchUserData}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="space-y-4 p-6 w-full max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#fafafa]">My Profile</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Profile Info & Financial Summary Grid */}
        <div className="grid grid-cols-6 gap-3 w-full">
          {/* Profile Card - Spans 2 columns */}
          <div className="col-span-2 bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3">
            <h2 className="text-base font-semibold text-[#fafafa] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Account Information
            </h2>
            
            <div className="space-y-2">
              {/* User Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#a1a1aa]">Full Name</p>
                  <p className="text-sm font-bold text-[#fafafa]">{userData?.profile?.user_name || 'N/A'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2">
                <Mail className="w-3 h-3 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#a1a1aa]">Email</p>
                  <p className="text-xs text-[#fafafa]">{userData?.profile?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Broker */}
              <div className="flex items-start gap-2">
                <Building2 className="w-3 h-3 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#a1a1aa]">Broker</p>
                  <p className="text-xs text-[#fafafa] font-medium">{userData?.profile?.broker || 'N/A'}</p>
                </div>
              </div>

              {/* Exchanges */}
              <div className="flex items-start gap-2">
                <Globe className="w-3 h-3 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#a1a1aa]">Exchanges</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {userData?.profile?.exchanges?.map((exchange: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-blue-950/50 text-blue-400 rounded text-xs font-medium border border-blue-800/50">
                        {exchange}
                      </span>
                    )) || <span className="text-xs text-[#a1a1aa]">N/A</span>}
                  </div>
                </div>
              </div>

              {/* User Type */}
              <div className="flex items-start gap-2">
                <Shield className="w-3 h-3 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#a1a1aa]">Account Type</p>
                  <p className="text-xs text-[#fafafa]">{userData?.profile?.user_type || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          {/* Available Cash */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-emerald-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-emerald-950/50 rounded-lg flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Available Cash</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              ₹{(userData?.funds?.available?.cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Used Margin */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-amber-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-amber-950/50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Used Margin</p>
            </div>
            <p className="text-lg font-bold text-amber-400">
              ₹{(userData?.funds?.utilised?.debits || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Net Equity */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-blue-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-blue-950/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Net Equity</p>
            </div>
            <p className="text-lg font-bold text-blue-400">
              ₹{(userData?.funds?.net || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-blue-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-blue-950/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Total P&L</p>
            </div>
            <p className={`text-lg font-bold ${calculateTotalPnL() >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {calculateTotalPnL() >= 0 ? '+' : ''}₹{calculateTotalPnL().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Holdings Value */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-blue-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-blue-950/50 rounded-lg flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Holdings Value</p>
            </div>
            <p className="text-lg font-bold text-[#fafafa]">
              ₹{calculateTotalHoldingsValue().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Total Holdings Count */}
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 hover:border-blue-700/50 transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-blue-950/50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs text-[#a1a1aa]">Total Holdings</p>
            </div>
            <p className="text-lg font-bold text-[#fafafa]">
              {userData?.holdings.length || 0}
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        {userData?.holdings && userData.holdings.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg overflow-hidden">
            <div className="p-5 border-b border-[#27272a]">
              <h2 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                Holdings ({userData.holdings.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/60">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Symbol</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Quantity</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Avg Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">LTP</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Value</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {userData.holdings.map((holding, idx) => (
                    <tr key={idx} className="hover:bg-[#27272a]/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#fafafa]">{holding.tradingsymbol}</td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">{holding.quantity}</td>
                      <td className="px-6 py-4 text-right text-[#a1a1aa]">₹{holding.average_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">₹{holding.last_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#fafafa] font-medium">
                        ₹{(holding.last_price * holding.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold flex items-center justify-end gap-1 ${holding.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {holding.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        ₹{holding.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Positions Table */}
        {userData?.positions && userData.positions.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg overflow-hidden">
            <div className="p-5 border-b border-[#27272a]">
              <h2 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Open Positions ({userData.positions.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/60">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Symbol</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Quantity</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Avg Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">LTP</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {userData.positions.map((position, idx) => (
                    <tr key={idx} className="hover:bg-[#27272a]/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#fafafa]">{position.tradingsymbol}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${position.quantity > 0 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/50 text-red-400 border border-red-800/50'}`}>
                          {position.quantity > 0 ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">{Math.abs(position.quantity)}</td>
                      <td className="px-6 py-4 text-right text-[#a1a1aa]">₹{position.average_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">₹{position.last_price.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-right font-bold flex items-center justify-end gap-1 ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        ₹{position.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {userData?.orders && userData.orders.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-lg overflow-hidden">
            <div className="p-5 border-b border-[#27272a]">
              <h2 className="text-lg font-semibold text-[#fafafa] flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Recent Orders ({userData.orders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/60">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Symbol</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Qty</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Price</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#a1a1aa] uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {userData.orders.slice(0, 10).map((order, idx) => (
                    <tr key={idx} className="hover:bg-[#27272a]/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#fafafa]">{order.tradingsymbol}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.transaction_type === 'BUY' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/50 text-red-400 border border-red-800/50'}`}>
                          {order.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">{order.quantity}</td>
                      <td className="px-6 py-4 text-right text-[#fafafa]">₹{order.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1 ${
                          order.status === 'COMPLETE' 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                            : order.status === 'PENDING' 
                            ? 'bg-amber-950/50 text-amber-400 border border-amber-800/50' 
                            : 'bg-red-950/50 text-red-400 border border-red-800/50'
                        }`}>
                          {order.status === 'COMPLETE' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#a1a1aa] text-sm">
                        {new Date(order.order_timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {userData?.holdings?.length === 0 && userData?.positions?.length === 0 && (
          <div className="bg-black/40 backdrop-blur-sm border border-[#27272a] rounded-xl p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-[#52525b]" />
            <p className="text-[#a1a1aa] text-lg">No holdings or positions yet.</p>
            <p className="text-[#71717a] text-sm mt-2">Start trading to see your portfolio here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
