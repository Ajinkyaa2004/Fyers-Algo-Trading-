import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
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
  ArrowDownRight
} from 'lucide-react';
import { LiveDataDisplay } from '../components/LiveDataDisplay';
import { OptionsTrading } from '../components/OptionsTrading';
import { OrderPlacement } from '../components/OrderPlacement';
import { PaperTradingTracker } from '../components/PaperTradingTracker';
import StockDetails from './StockDetails';
import { showToast } from '../utils/toast';

// Market hours check (IST timezone)
const isMarketOpen = (): boolean => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const day = istTime.getUTCDay();
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  if (day === 0 || day === 6) return false;
  
  const marketOpen = 9 * 60 + 15;
  const marketClose = 15 * 60 + 30;
  
  return currentMinutes >= marketOpen && currentMinutes <= marketClose;
};

interface BackendStatus {
  status: string;
  message: string;
  version: string;
  modules: string[];
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

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  // Initialize with demo data immediately for better UX
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([
    { symbol: 'NSE:NIFTY50-INDEX', name: 'NIFTY 50', ltp: 21731.45, change: 69.85, changePercent: 0.32 },
    { symbol: 'NSE:NIFTYBANK-INDEX', name: 'NIFTY BANK', ltp: 46142.30, change: -83.20, changePercent: -0.18 },
    { symbol: 'NSE:SENSEX-INDEX', name: 'SENSEX', ltp: 71752.11, change: 234.12, changePercent: 0.33 },
    { symbol: 'NSE:MIDCPNIFTY-INDEX', name: 'MIDCPNIFTY', ltp: 12543.85, change: 156.45, changePercent: 1.26 }
  ]);
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
    
    // Smart auto-refresh: faster during market hours (10s), slower when closed (30s)
    const getRefreshInterval = () => isMarketOpen() ? 10000 : 30000;
    
    const refreshData = () => {
      fetchAccountData();
      fetchMarketIndices();
    };
    
    let refreshInterval = setInterval(refreshData, getRefreshInterval());
    
    // Update interval when market status changes (check every minute)
    const statusCheckInterval = setInterval(() => {
      const newInterval = getRefreshInterval();
      clearInterval(refreshInterval);
      refreshInterval = setInterval(refreshData, newInterval);
    }, 60000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(statusCheckInterval);
    };
  }, []);

  const fetchBackendStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/');
      const data = await response.json();
      setBackendStatus(data);
    } catch (error) {
      console.error('Failed to fetch backend status:', error);
      showToast.error('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketIndices = async () => {
    try {
      const indices = ['NSE:NIFTY50-INDEX', 'NSE:NIFTYBANK-INDEX', 'NSE:SENSEX-INDEX', 'NSE:MIDCPNIFTY-INDEX'];
      const symbolsParam = indices.join(',');
      const response = await fetch(
        `http://127.0.0.1:8001/api/market/quote?symbols=${encodeURIComponent(symbolsParam)}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.data && Object.keys(data.data).length > 0) {
        // data.data is an object with keys like 'NSE:NIFTY50-INDEX'
        const indexData = Object.entries(data.data).map(([symbol, item]: [string, any]) => {
          const v = item.v || item;
          return {
            symbol: symbol,
            name: symbol.replace('NSE:', '').replace('-INDEX', ''),
            ltp: v.lp || v.last_price || 0,
            change: v.ch || v.change || 0,
            changePercent: v.chp || v.change_percent || 0,
          };
        });
        setMarketIndices(indexData);
      } else {
        // If API returns no data (market closed or not authenticated), show demo data
        const demoIndices = [
          { symbol: 'NSE:NIFTY50-INDEX', name: 'NIFTY 50', ltp: 21731.45, change: 69.85, changePercent: 0.32 },
          { symbol: 'NSE:NIFTYBANK-INDEX', name: 'NIFTY BANK', ltp: 46142.30, change: -83.20, changePercent: -0.18 },
          { symbol: 'NSE:SENSEX-INDEX', name: 'SENSEX', ltp: 71752.11, change: 234.12, changePercent: 0.33 },
          { symbol: 'NSE:MIDCPNIFTY-INDEX', name: 'MIDCPNIFTY', ltp: 12543.85, change: 156.45, changePercent: 1.26 }
        ];
        setMarketIndices(demoIndices);
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
      // Set demo data on error
      const demoIndices = [
        { symbol: 'NSE:NIFTY50-INDEX', name: 'NIFTY 50', ltp: 21731.45, change: 69.85, changePercent: 0.32 },
        { symbol: 'NSE:NIFTYBANK-INDEX', name: 'NIFTY BANK', ltp: 46142.30, change: -83.20, changePercent: -0.18 },
        { symbol: 'NSE:SENSEX-INDEX', name: 'SENSEX', ltp: 71752.11, change: 234.12, changePercent: 0.33 },
        { symbol: 'NSE:MIDCPNIFTY-INDEX', name: 'MIDCPNIFTY', ltp: 12543.85, change: 156.45, changePercent: 1.26 }
      ];
      setMarketIndices(demoIndices);
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
    await Promise.all([fetchAccountData(), fetchMarketIndices()]);
  };

  const calculateTotalPnL = () => {
    const holdingsPnL = account.holdings.reduce((sum, h) => sum + parseFloat(h.pnl || 0), 0);
    const positionsPnL = account.positions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);
    return holdingsPnL + positionsPnL;
  };

  return (
    <>
      {selectedStock ? (
        <StockDetails symbol={selectedStock} onBack={() => setSelectedStock(null)} />
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Smart Algo Trade
                </h1>
                <p className="text-zinc-400">{account.profile?.name || 'Loading...'}</p>
              </div>

              <div className="flex gap-3 items-center">
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
          </div>

          {/* Market Indices */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Market Indices
            </h2>
            {marketIndices.length === 0 ? (
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-8 text-center">
                <p className="text-zinc-400">Loading market data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketIndices.map((index, idx) => (
                  <div
                    key={idx}
                    className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-zinc-700 transition-all"
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
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Overview */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-violet-400" />
              Portfolio Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5 hover:border-violet-700/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-950/50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
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

          {/* Holdings */}
          {account.holdings && account.holdings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Holdings ({account.holdings.length})
              </h2>
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-300">Symbol</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">Quantity</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">Avg Price</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">LTP</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.holdings.map((holding: any, idx: number) => {
                        const pnl = parseFloat(holding.pnl || 0);
                        return (
                          <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{holding.tradingsymbol || holding.symbol}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">{holding.quantity}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">₹{parseFloat(holding.avgPrice || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">₹{parseFloat(holding.lastPrice || 0).toFixed(2)}</td>
                            <td className={`px-6 py-4 text-right font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Positions */}
          {account.positions && account.positions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Open Positions ({account.positions.length})
              </h2>
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-300">Symbol</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">Qty</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">Avg Price</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">LTP</th>
                        <th className="px-6 py-3 text-right font-semibold text-zinc-300">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.positions.map((position: any, idx: number) => {
                        const pnl = parseFloat(position.pnl || 0);
                        return (
                          <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{position.tradingsymbol || position.symbol}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">{position.netQty}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">₹{parseFloat(position.avgPrice || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right text-zinc-300">₹{parseFloat(position.netPrice || 0).toFixed(2)}</td>
                            <td className={`px-6 py-4 text-right font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Status */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-violet-400" />
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-950/50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">API Status</p>
                    <p className="text-lg font-semibold text-emerald-400">Connected</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-950/50 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Data Stream</p>
                    <p className="text-lg font-semibold text-violet-400">Active</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-950/50 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Version</p>
                    <p className="text-lg font-semibold text-amber-400">{backendStatus?.version || '1.0.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Placement */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Place Order
            </h2>
            <OrderPlacement />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate('portfolio')}
                className="bg-linear-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Portfolio & Account
              </button>
              <button
                onClick={() => onNavigate('live')}
                className="bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                Live Market Data
              </button>
              <button
                onClick={() => onNavigate('strategies')}
                className="bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Explore Strategies
              </button>
            </div>
          </div>

          {/* Complete Market Data Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Real-time Market Data</h2>
            </div>
            <LiveDataDisplay onSelectStock={setSelectedStock} />
          </div>

          {/* Paper Trading Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Paper Trading Simulator</h2>
              <span className="px-3 py-1 bg-amber-950/50 text-amber-400 text-xs font-semibold rounded-full border border-amber-800/50">DEMO MODE</span>
            </div>
            <PaperTradingTracker />
          </div>

          {/* Options Trading Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Options Trading</h2>
              <span className="px-3 py-1 bg-violet-950/50 text-violet-400 text-xs font-semibold rounded-full border border-violet-800/50">ADVANCED</span>
            </div>
            <OptionsTrading />
          </div>
        </div>
      )}
    </>
  );
}
