import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Wallet, 
  DollarSign,
  PieChart,
  Server,
  Database,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Layers,
  Clock,
  Wifi,
  HardDrive,
  AlertCircle,
  XCircle,
  ShoppingCart,
  Loader2,
  PlayCircle,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { showToast } from '../utils/toast';

interface BackendStatus {
  status: string;
  message: string;
  version: string;
}
interface UserProfile {
  name?: string;
  email?: string;
  accountId?: string;
}

interface AccountData {
  profile: UserProfile | null;
  funds: any;
  holdings: any[];
  positions: any[];
  loading: boolean;
  error: string | null;
}

interface MarketIndex {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
}

interface PaperTradingStats {
  total_trades?: number;
  winning_trades?: number;
  losing_trades?: number;
  win_rate?: number;
  total_pnl?: number;
  avg_profit_per_trade?: number;
  available_capital?: number;
  used_capital?: number;
}

interface Order {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  type: string;
  status: string;
  timestamp: string;
}

interface Trade {
  symbol: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  entry_time: string;
  exit_time: string;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps = {}) => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [paperStats, setPaperStats] = useState<PaperTradingStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [uptime, setUptime] = useState('0h 0m');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    indices: true,
    stats: true,
    orders: true,
    trades: true
  });
  const [account, setAccount] = useState<AccountData>({
    profile: null,
    funds: null,
    holdings: [],
    positions: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchBackendStatus();
    fetchAccountData();
    fetchMarketIndices();
    fetchPaperTradingStats();
    fetchRecentOrders();
    fetchRecentTrades();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAccountData();
      fetchMarketIndices();
      fetchPaperTradingStats();
      updateUptime();
    }, 30000);
    
    // Update uptime every minute
    const uptimeInterval = setInterval(updateUptime, 60000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const updateUptime = () => {
    if (backendStatus) {
      // Calculate uptime (simplified - you would get this from backend)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diff = now.getTime() - startOfDay.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setUptime(`${hours}h ${minutes}m`);
    }
  };

  const fetchBackendStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/');
      const data = await response.json();
      setBackendStatus(data);
      updateUptime();
    } catch (error) {
      console.error('Failed to fetch backend status:', error);
      showToast.error('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaperTradingStats = async () => {
    setLoadingStates(prev => ({ ...prev, stats: true }));
    try {
      if (demoMode) {
        // Demo data
        setPaperStats({
          total_trades: 24,
          winning_trades: 18,
          losing_trades: 6,
          win_rate: 75,
          total_pnl: 15500,
          avg_profit_per_trade: 645.83,
          available_capital: 450000,
          used_capital: 50000
        });
        setLoadingStates(prev => ({ ...prev, stats: false }));
        setLastUpdated(new Date());
        return;
      }
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setPaperStats(data.data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch paper trading stats:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, stats: false }));
    }
  };

  const fetchRecentOrders = async () => {
    setLoadingStates(prev => ({ ...prev, orders: true }));
    try {
      if (demoMode) {
        setRecentOrders([
          { id: '1', symbol: 'NSE:RELIANCE-EQ', side: 'BUY', quantity: 10, price: 2450.50, type: 'LIMIT', status: 'FILLED', timestamp: new Date().toISOString() },
          { id: '2', symbol: 'NSE:TCS-EQ', side: 'BUY', quantity: 5, price: 3650.00, type: 'MARKET', status: 'FILLED', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', symbol: 'NSE:INFY-EQ', side: 'SELL', quantity: 15, price: 1450.75, type: 'LIMIT', status: 'PENDING', timestamp: new Date(Date.now() - 7200000).toISOString() }
        ]);
        setLoadingStates(prev => ({ ...prev, orders: false }));
        return;
      }
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/orders?limit=10');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setRecentOrders(data.data.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchRecentTrades = async () => {
    setLoadingStates(prev => ({ ...prev, trades: true }));
    try {
      if (demoMode) {
        setRecentTrades([
          { symbol: 'NSE:SBIN-EQ', entry_price: 590.50, exit_price: 605.25, quantity: 20, pnl: 295.00, entry_time: new Date(Date.now() - 86400000).toISOString(), exit_time: new Date(Date.now() - 43200000).toISOString() },
          { symbol: 'NSE:HDFC-EQ', entry_price: 1650.00, exit_price: 1625.50, quantity: 10, pnl: -245.00, entry_time: new Date(Date.now() - 172800000).toISOString(), exit_time: new Date(Date.now() - 86400000).toISOString() },
          { symbol: 'NSE:ICICIBANK-EQ', entry_price: 920.25, exit_price: 935.75, quantity: 15, pnl: 232.50, entry_time: new Date(Date.now() - 259200000).toISOString(), exit_time: new Date(Date.now() - 172800000).toISOString() }
        ]);
        setLoadingStates(prev => ({ ...prev, trades: false }));
        return;
      }
      const response = await fetch('http://127.0.0.1:8001/api/paper-trading/trades?limit=10');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setRecentTrades(data.data.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent trades:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, trades: false }));
    }
  };

  const fetchMarketIndices = async () => {
    setLoadingStates(prev => ({ ...prev, indices: true }));
    try {
      const indices = ['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX', 'NSE:SENSEX-INDEX', 'NSE:MIDCPNIFTY-INDEX'];
      const symbolsParam = indices.join(',');
      const response = await fetch(
        `http://127.0.0.1:8001/api/market/quote?symbols=${encodeURIComponent(symbolsParam)}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const indexData = data.data.map((item: any) => {
          const v = item.v;
          return {
            symbol: v.symbol,
            name: v.symbol.replace('NSE:', '').replace('-INDEX', ''),
            ltp: v.lp || 0,
            change: v.ch || 0,
            changePercent: v.chp || 0,
          };
        });
        setMarketIndices(indexData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, indices: false }));
    }
  };

  const fetchAccountData = async () => {
    try {
      setAccount(prev => ({ ...prev, loading: !refreshing, error: null }));
      
      // Fetch profile
      const profileRes = await fetch('http://127.0.0.1:8001/api/portfolio/profile');
      const profileData = profileRes.ok ? await profileRes.json() : null;
      
      // Fetch funds/margins
      const fundsRes = await fetch('http://127.0.0.1:8001/api/portfolio/margins');
      const fundsData = fundsRes.ok ? await fundsRes.json() : null;
      
      // Fetch holdings
      const holdingsRes = await fetch('http://127.0.0.1:8001/api/portfolio/holdings');
      const holdingsData = holdingsRes.ok ? await holdingsRes.json() : null;

      // Fetch positions
      const positionsRes = await fetch('http://127.0.0.1:8001/api/portfolio/positions');
      const positionsData = positionsRes.ok ? await positionsRes.json() : null;

      setAccount(prev => ({
        ...prev,
        profile: profileData?.data,
        funds: fundsData?.data,
        holdings: Array.isArray(holdingsData?.data) ? holdingsData.data : [],
        positions: Array.isArray(positionsData?.data?.net) ? positionsData.data.net : [],
        loading: false,
        error: null
      }));
      
      if (refreshing) {
        showToast.success('Dashboard refreshed successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch account data:', error);
      const errorMsg = error.message || 'Failed to load account data';
      setAccount(prev => ({
        ...prev,
        loading: false,
        error: errorMsg
      }));
      showToast.error(errorMsg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAccountData(), 
      fetchMarketIndices(),
      fetchPaperTradingStats(),
      fetchRecentOrders(),
      fetchRecentTrades()
    ]);
  };

  const calculateTotalPnL = () => {
    const holdingsPnL = account.holdings.reduce((sum, h) => sum + parseFloat(h.pnl || 0), 0);
    const positionsPnL = account.positions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);
    return holdingsPnL + positionsPnL;
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    if (!demoMode) {
      // When enabling demo mode, immediately fetch demo data
      fetchPaperTradingStats();
      fetchRecentOrders();
      fetchRecentTrades();
      showToast.success('Demo mode enabled - Showing sample data');
    } else {
      // When disabling, fetch real data
      fetchPaperTradingStats();
      fetchRecentOrders();
      fetchRecentTrades();
      showToast.success('Demo mode disabled - Showing live data');
    }
  };

  // Loading Skeleton Component
  const CardSkeleton = () => (
    <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-zinc-800 rounded w-24"></div>
        <div className="h-5 w-5 bg-zinc-800 rounded"></div>
      </div>
      <div className="h-8 bg-zinc-800 rounded w-32 mb-2"></div>
      <div className="h-3 bg-zinc-800 rounded w-20"></div>
    </div>
  );

  // Empty State Component
  const EmptyState = ({ icon: Icon, message, action }: { icon: any, message: string, action?: { label: string, onClick: () => void } }) => (
    <div className="text-center py-8">
      <Icon className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-500" />
      <p className="text-zinc-500 mb-3">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Smart Algo Trade
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-zinc-400">{account.profile?.name || 'Loading...'}</p>
              {lastUpdated && (
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(lastUpdated).toLocaleTimeString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* Demo Mode Toggle */}
            <button
              onClick={toggleDemoMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                demoMode 
                  ? 'bg-amber-950/50 border-amber-800/50 text-amber-400 hover:bg-amber-900/50' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {demoMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {demoMode ? 'Demo Mode' : 'Live Mode'}
            </button>

            <button
              onClick={handleRefresh}
              disabled={account.loading || refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all border border-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {!loading && backendStatus && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/50 border border-emerald-800/50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400 font-medium">Online</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
          <button
            onClick={() => onNavigate?.('paper-trading')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            Place Order
          </button>
          <button
            onClick={() => onNavigate?.('paper-trading')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
          >
            <Eye className="w-4 h-4" />
            View All Trades
          </button>
        </div>
      </div>

      {/* Market Indices */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          Market Indices
          {loadingStates.indices && (
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {loadingStates.indices ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
          ) : marketIndices.length > 0 ? (
            marketIndices.map((index, idx) => (
              <div
                key={idx}
                className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-violet-500/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">{index.name}</p>
                    <p className="text-2xl font-bold text-white">
                      {index.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {index.change >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  index.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <span>{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}</span>
                  <span>({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                icon={BarChart3} 
                message="Market data unavailable. Please check your connection."
                action={{ label: 'Retry', onClick: fetchMarketIndices }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Overview */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-violet-400" />
          Portfolio Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Available Cash */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-emerald-700/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-950/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-zinc-400">Available Cash</p>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{(account.funds?.availableMargin || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Used Margin */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-amber-700/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-950/50 rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-zinc-400">Used Margin</p>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{(account.funds?.usedMargin || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-blue-700/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-950/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-zinc-400">Total P&L</p>
            </div>
            <p className={`text-2xl font-bold ${calculateTotalPnL() >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {calculateTotalPnL() >= 0 ? '+' : ''}₹{calculateTotalPnL().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Holdings Count */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-zinc-900/50 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">Active Positions</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {account.holdings.length + account.positions.length}
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-violet-400" />
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">API Status</p>
              {backendStatus ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className={`text-xl font-bold ${backendStatus ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendStatus ? 'Connected' : 'Disconnected'}
            </p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">WebSocket</p>
              <Wifi className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-xl font-bold text-violet-400">Active</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Data Collection</p>
              <Database className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-amber-400">Running</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Uptime</p>
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xl font-bold text-white">{uptime}</p>
          </div>
        </div>
      </div>

      {/* Today's Performance */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Today's Performance
          <span className="ml-2 px-2 py-1 bg-emerald-950/50 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-800/50">LIVE</span>
          {loadingStates.stats && (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {loadingStates.stats ? (
            Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
          ) : paperStats && (paperStats.total_trades ?? 0) > 0 ? (
            <>
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:shadow-lg hover:shadow-violet-500/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Trades Executed</p>
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {paperStats?.total_trades || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/20 to-black/40 backdrop-blur-sm border border-emerald-800/30 rounded-lg p-5 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Win Rate</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {paperStats?.win_rate ? `${paperStats.win_rate.toFixed(1)}%` : '0%'}
            </p>
          </div>

          <div className={`bg-gradient-to-br ${(paperStats?.total_pnl || 0) >= 0 ? 'from-emerald-950/20 to-black/40 border-emerald-800/30' : 'from-red-950/20 to-black/40 border-red-800/30'} backdrop-blur-sm border rounded-lg p-5 hover:shadow-lg transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Daily P&L</p>
              <DollarSign className={`w-5 h-5 ${(paperStats?.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <p className={`text-2xl font-bold ${(paperStats?.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(paperStats?.total_pnl || 0) >= 0 ? '+' : ''}₹{(paperStats?.total_pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`bg-gradient-to-br ${(paperStats?.avg_profit_per_trade || 0) >= 0 ? 'from-emerald-950/20 to-black/40 border-emerald-800/30' : 'from-red-950/20 to-black/40 border-red-800/30'} backdrop-blur-sm border rounded-lg p-5 hover:shadow-lg transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Avg Profit/Trade</p>
              <BarChart3 className={`w-5 h-5 ${(paperStats?.avg_profit_per_trade || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <p className={`text-2xl font-bold ${(paperStats?.avg_profit_per_trade || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(paperStats?.avg_profit_per_trade || 0) >= 0 ? '+' : ''}₹{(paperStats?.avg_profit_per_trade || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          </>
          ) : (
            <div className="col-span-full">
              <EmptyState 
                icon={Activity} 
                message={demoMode ? "Enable demo data to see sample trading performance" : "No trading activity yet. Start trading to see performance metrics."}
                action={!demoMode ? { label: 'Enable Demo Mode', onClick: toggleDemoMode } : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-400" />
            Recent Orders
            {loadingStates.orders && (
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            )}
          </h2>
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden min-h-[350px]">
            {loadingStates.orders ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse">
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {recentOrders.map((order, idx) => (
                  <div key={idx} className="p-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{order.symbol}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          order.side === 'BUY' 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                            : 'bg-red-950/50 text-red-400 border border-red-800/50'
                        }`}>
                          {order.side}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        order.status === 'FILLED' 
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                          : order.status === 'PENDING'
                          ? 'bg-amber-950/50 text-amber-400 border border-amber-800/50'
                          : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Qty: {order.quantity} @ ₹{order.price.toFixed(2)}</span>
                      <span className="text-zinc-500 text-xs">
                        {new Date(order.timestamp).toLocaleTimeString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={ShoppingCart} 
                message={demoMode ? "Sample orders will appear here" : "No recent orders. Place your first order to get started!"}
                action={!demoMode ? { label: 'Place Order', onClick: () => onNavigate?.('paper-trading') } : undefined}
              />
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Recent Trades
            {loadingStates.trades && (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            )}
          </h2>
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden min-h-[350px]">
            {loadingStates.trades ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse">
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentTrades.length > 0 ? (
              <div className="divide-y divide-zinc-800/50">
                {recentTrades.map((trade, idx) => (
                  <div key={idx} className="p-4 hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{trade.symbol}</span>
                        <span className="text-xs text-zinc-500">
                          Qty: {trade.quantity}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        trade.pnl >= 0 
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                          : 'bg-red-950/50 text-red-400 border border-red-800/50'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>₹{trade.entry_price.toFixed(2)} → ₹{trade.exit_price.toFixed(2)}</span>
                      <span className="text-zinc-500 text-xs">
                        {new Date(trade.exit_time).toLocaleTimeString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={TrendingUp} 
                message={demoMode ? "Sample completed trades will appear here" : "No completed trades yet. Complete your first trade to see results!"}
                action={!demoMode ? { label: 'View All Trades', onClick: () => onNavigate?.('paper-trading') } : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Holdings & Positions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-violet-400" />
          Top Holdings & Positions
        </h2>
        <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden">
          {(account.holdings.length > 0 || account.positions.length > 0) ? (
            <div className="divide-y divide-zinc-800/50">
              {/* Holdings */}
              {account.holdings.slice(0, 3).map((holding, idx) => (
                <div key={`h-${idx}`} className="p-4 hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-white">{holding.symbol}</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-950/50 text-blue-400 border border-blue-800/50">
                        HOLDING
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      parseFloat(holding.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {parseFloat(holding.pnl || 0) >= 0 ? '+' : ''}₹{parseFloat(holding.pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Qty: {holding.quantity} @ Avg: ₹{parseFloat(holding.avg_price || 0).toFixed(2)}</span>
                    <span>LTP: ₹{parseFloat(holding.ltp || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              
              {/* Positions */}
              {account.positions.slice(0, 3).map((position, idx) => (
                <div key={`p-${idx}`} className="p-4 hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-white">{position.symbol}</span>
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/50 text-amber-400 border border-amber-800/50">
                        POSITION
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      parseFloat(position.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {parseFloat(position.pnl || 0) >= 0 ? '+' : ''}₹{parseFloat(position.pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Qty: {position.qty} @ Avg: ₹{parseFloat(position.avg_price || 0).toFixed(2)}</span>
                    <span>LTP: ₹{parseFloat(position.ltp || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No holdings or positions</p>
            </div>
          )}
        </div>
      </div>

      {/* Account Summary Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-400" />
          Account Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Total Holdings</p>
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">{account.holdings.length}</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Active Positions</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{account.positions.length}</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Winning Trades</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{paperStats?.winning_trades || 0}</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Losing Trades</p>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{paperStats?.losing_trades || 0}</p>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-violet-400" />
          Portfolio Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Market Indices</p>
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">{marketIndices.length}</p>
            <p className="text-xs text-zinc-500 mt-2">Tracked indices</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Holdings</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{account.holdings.length}</p>
            <p className="text-xs text-zinc-500 mt-2">Stock holdings</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Open Positions</p>
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white">{account.positions.length}</p>
            <p className="text-xs text-zinc-500 mt-2">Active trades</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">Total Trades</p>
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-2xl font-bold text-white">{paperStats?.total_trades || 0}</p>
            <p className="text-xs text-zinc-500 mt-2">All time</p>
          </div>
        </div>
      </div>

      {/* Active Strategies */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Active Strategies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Supertrend + RSI</p>
              <span className="px-2 py-1 bg-emerald-950/50 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-800/50">Active</span>
            </div>
            <p className="text-xs text-zinc-400">Momentum-based strategy</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Pattern Detection</p>
              <span className="px-2 py-1 bg-emerald-950/50 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-800/50">Active</span>
            </div>
            <p className="text-xs text-zinc-400">Candlestick patterns</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Trend Analysis</p>
              <span className="px-2 py-1 bg-emerald-950/50 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-800/50">Active</span>
            </div>
            <p className="text-xs text-zinc-400">Support/Resistance</p>
          </div>

          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-white">Options Strategy</p>
              <span className="px-2 py-1 bg-amber-950/50 text-amber-400 text-xs font-semibold rounded-full border border-amber-800/50">Waiting</span>
            </div>
            <p className="text-xs text-zinc-400">Premium collection</p>
          </div>
        </div>
      </div>

      {/* System Features */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-violet-400" />
          System Features
        </h2>
        <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Data & Historical
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Historical OHLC data API
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Intraday trading data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Multiple timeframe support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  200+ symbols monitoring
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Trading & Execution
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Order placement & tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Real-time P&L calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Supertrend + RSI strategy
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Position management
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Indicators & Analysis
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  13 Technical indicators
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Pattern detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Support/Resistance
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Options & Advanced
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Options chain analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ATM calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  NSE integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Paper trading
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
