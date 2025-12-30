import React, { useState } from 'react';
import { Plus, Trash2, Play, Pause, Edit2, TrendingUp, TrendingDown, BarChart3, Calendar, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface Strategy {
  id: string;
  name: string;
  type: 'momentum' | 'mean-reversion' | 'rsi' | 'macd' | 'custom';
  enabled: boolean;
  winRate: number;
  trades: number;
  roi: number;
  createdAt: string;
}

interface BacktestResult {
  symbol: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
}

const Strategies: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'auto' | 'backtest' | 'historical'>('builder');
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: '1',
      name: 'RSI Momentum',
      type: 'rsi',
      enabled: true,
      winRate: 62.5,
      trades: 48,
      roi: 15.3,
      createdAt: '2025-12-20'
    },
    {
      id: '2',
      name: 'MACD Crossover',
      type: 'macd',
      enabled: true,
      winRate: 58.2,
      trades: 35,
      roi: 12.8,
      createdAt: '2025-12-18'
    }
  ]);

  const [strategyForm, setStrategyForm] = useState({
    name: '',
    type: 'rsi' as const
  });

  const [backtestForm, setBacktestForm] = useState({
    symbol: 'NIFTY',
    strategy: 'rsi',
    startDate: '2025-01-01',
    endDate: '2025-12-26'
  });

  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);

  const [historicalForm, setHistoricalForm] = useState({
    symbol: 'NIFTY',
    timeframe: '1D',
    startDate: '2025-01-01',
    endDate: '2025-12-26'
  });

  const [historicalData, setHistoricalData] = useState<any[]>([
    { date: '2025-12-26', open: 23450, high: 23520, low: 23400, close: 23485, volume: 2500000 },
    { date: '2025-12-25', open: 23420, high: 23490, low: 23350, close: 23450, volume: 2400000 },
    { date: '2025-12-24', open: 23380, high: 23460, low: 23300, close: 23420, volume: 2300000 },
    { date: '2025-12-23', open: 23350, high: 23420, low: 23280, close: 23380, volume: 2200000 },
    { date: '2025-12-22', open: 23400, high: 23500, low: 23330, close: 23350, volume: 2600000 }
  ]);

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyForm.name.trim()) {
      toast.error('Strategy name required');
      return;
    }

    const newStrategy: Strategy = {
      id: Date.now().toString(),
      name: strategyForm.name,
      type: strategyForm.type,
      enabled: true,
      winRate: Math.random() * 40 + 45,
      trades: Math.floor(Math.random() * 50) + 10,
      roi: Math.random() * 25 + 5,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setStrategies([...strategies, newStrategy]);
    setStrategyForm({ name: '', type: 'rsi' });
    toast.success('Strategy created', { description: `${newStrategy.name} is now active` });
  };

  const handleToggleStrategy = (id: string) => {
    setStrategies(strategies.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    const strategy = strategies.find(s => s.id === id);
    const newState = !strategy?.enabled;
    toast.success(newState ? 'Strategy enabled' : 'Strategy disabled', {
      description: strategy?.name
    });
  };

  const handleDeleteStrategy = (id: string) => {
    const strategy = strategies.find(s => s.id === id);
    setStrategies(strategies.filter(s => s.id !== id));
    toast.success('Strategy deleted', { description: strategy?.name });
  };

  const handleBacktest = (e: React.FormEvent) => {
    e.preventDefault();

    const mockResults: BacktestResult = {
      symbol: backtestForm.symbol,
      startDate: backtestForm.startDate,
      endDate: backtestForm.endDate,
      totalTrades: Math.floor(Math.random() * 100) + 30,
      winningTrades: Math.floor(Math.random() * 60) + 15,
      losingTrades: Math.floor(Math.random() * 40) + 10,
      winRate: Math.random() * 20 + 55,
      grossProfit: Math.random() * 50000 + 25000,
      grossLoss: Math.random() * 10000 + 5000,
      netProfit: Math.random() * 40000 + 15000,
      profitFactor: Math.random() * 2.5 + 1.5,
      maxDrawdown: -(Math.random() * 8 + 2)
    };

    setBacktestResults(mockResults);
    toast.success('Backtest completed', {
      description: `${backtestForm.symbol} tested successfully`
    });
  };

  const handleFetchHistoricalData = (e: React.FormEvent) => {
    e.preventDefault();
    const mockData = Array.from({ length: 30 }, (_, i) => {
      const basePrice = 23400 + Math.random() * 500 - 250;
      return {
        date: new Date(2025, 11, 26 - i).toISOString().split('T')[0],
        open: basePrice,
        high: basePrice + Math.random() * 100,
        low: basePrice - Math.random() * 100,
        close: basePrice + Math.random() * 100 - 50,
        volume: Math.floor(Math.random() * 3000000) + 1000000
      };
    }).reverse();
    setHistoricalData(mockData);
    toast.success('Data loaded', {
      description: `${historicalForm.symbol} historical data loaded successfully`
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto w-full p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Trading Strategies</h1>
          <p className="text-zinc-400">Strategy builder, auto trading, and backtesting</p>
        </div>

        <div className="flex gap-3 mb-8 border-b border-zinc-800">
          {[
            { id: 'builder', label: 'Strategy Builder', icon: '⚙️' },
            { id: 'auto', label: 'Auto Trading', icon: '🤖' },
            { id: 'backtest', label: 'Backtesting', icon: '📈' },
            { id: 'historical', label: 'Historical Data', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Strategy Builder Tab */}
        {activeTab === 'builder' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Create New Strategy</h2>
                <form onSubmit={handleAddStrategy} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Strategy Name</label>
                    <input
                      type="text"
                      value={strategyForm.name}
                      onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                      placeholder="e.g., RSI Breakout"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Strategy Type</label>
                    <select
                      value={strategyForm.type}
                      onChange={(e) => setStrategyForm({ ...strategyForm, type: e.target.value as any })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    >
                      <option value="rsi">RSI Momentum</option>
                      <option value="macd">MACD Crossover</option>
                      <option value="momentum">Momentum</option>
                      <option value="mean-reversion">Mean Reversion</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Create Strategy
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white">Active Strategies ({strategies.length})</h2>
                {strategies.map(strategy => (
                  <div key={strategy.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => handleToggleStrategy(strategy.id)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              strategy.enabled
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {strategy.enabled ? <Play size={14} className="inline mr-1" /> : <Pause size={14} className="inline mr-1" />}
                            {strategy.enabled ? 'Active' : 'Inactive'}
                          </button>
                          <h3 className="text-white font-semibold">{strategy.name}</h3>
                          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{strategy.type.toUpperCase()}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-400">Win Rate</span>
                            <p className="text-white font-semibold">{strategy.winRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-zinc-400">Trades</span>
                            <p className="text-white font-semibold">{strategy.trades}</p>
                          </div>
                          <div>
                            <span className="text-zinc-400">ROI</span>
                            <p className={`font-semibold ${strategy.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {strategy.roi > 0 ? '+' : ''}{strategy.roi.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-800 rounded transition-colors">
                          <Edit2 size={16} className="text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteStrategy(strategy.id)}
                          className="p-2 hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto Trading Tab */}
        {activeTab === 'auto' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Active Bots</h2>
              {strategies.filter(s => s.enabled).map(strategy => (
                <div key={strategy.id} className="bg-zinc-800/50 rounded-lg p-4 mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">{strategy.name}</h3>
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <p>Status: Trading Active</p>
                    <p>Today Trades: {Math.floor(Math.random() * 5)}</p>
                    <p>Daily P&L: ₹{Math.random() * 5000 + 1000 |0}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Performance Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400">Total Bots Running</span>
                    <span className="text-2xl font-bold text-white">{strategies.filter(s => s.enabled).length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400">Average Win Rate</span>
                    <span className="text-2xl font-bold text-green-400">
                      {(strategies.filter(s => s.enabled).reduce((sum, s) => sum + s.winRate, 0) / Math.max(1, strategies.filter(s => s.enabled).length)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400">Total Trades Today</span>
                    <span className="text-2xl font-bold text-white">{Math.floor(Math.random() * 20) + 5}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backtesting Tab */}
        {activeTab === 'backtest' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Backtest Settings</h2>
                <form onSubmit={handleBacktest} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Symbol</label>
                    <input
                      type="text"
                      value={backtestForm.symbol}
                      onChange={(e) => setBacktestForm({ ...backtestForm, symbol: e.target.value.toUpperCase() })}
                      placeholder="NIFTY"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Strategy</label>
                    <select
                      value={backtestForm.strategy}
                      onChange={(e) => setBacktestForm({ ...backtestForm, strategy: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    >
                      <option value="rsi">RSI Momentum</option>
                      <option value="macd">MACD Crossover</option>
                      <option value="momentum">Momentum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={backtestForm.startDate}
                      onChange={(e) => setBacktestForm({ ...backtestForm, startDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">End Date</label>
                    <input
                      type="date"
                      value={backtestForm.endDate}
                      onChange={(e) => setBacktestForm({ ...backtestForm, endDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart3 size={18} /> Run Backtest
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              {backtestResults ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-lg font-bold text-white mb-6">Backtest Results</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Total Trades</p>
                      <p className="text-2xl font-bold text-white">{backtestResults.totalTrades}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Win Rate</p>
                      <p className="text-2xl font-bold text-green-400">{backtestResults.winRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Net Profit</p>
                      <p className={`text-2xl font-bold ${backtestResults.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{backtestResults.netProfit.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Profit Factor</p>
                      <p className="text-2xl font-bold text-white">{backtestResults.profitFactor.toFixed(2)}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-400">{backtestResults.maxDrawdown.toFixed(2)}%</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-zinc-400 text-sm mb-1">Winning Trades</p>
                      <p className="text-2xl font-bold text-white">{backtestResults.winningTrades}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-zinc-700">
                    <p className="text-zinc-400 text-sm">
                      Period: {backtestResults.startDate} to {backtestResults.endDate}
                    </p>
                    <p className="text-zinc-400 text-sm mt-1">
                      Symbol: {backtestResults.symbol}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                  <BarChart3 size={48} className="text-zinc-600 mb-4" />
                  <p className="text-zinc-400 text-center">Run a backtest to see results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historical Data Tab */}
        {activeTab === 'historical' && (
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Filter Data</h2>
                <form onSubmit={handleFetchHistoricalData} className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Symbol</label>
                    <input
                      type="text"
                      value={historicalForm.symbol}
                      onChange={(e) => setHistoricalForm({ ...historicalForm, symbol: e.target.value.toUpperCase() })}
                      placeholder="NIFTY"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Timeframe</label>
                    <select
                      value={historicalForm.timeframe}
                      onChange={(e) => setHistoricalForm({ ...historicalForm, timeframe: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    >
                      <option value="5M">5 Min</option>
                      <option value="15M">15 Min</option>
                      <option value="30M">30 Min</option>
                      <option value="1H">1 Hour</option>
                      <option value="1D">1 Day</option>
                      <option value="1W">1 Week</option>
                      <option value="1M">1 Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={historicalForm.startDate}
                      onChange={(e) => setHistoricalForm({ ...historicalForm, startDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">End Date</label>
                    <input
                      type="date"
                      value={historicalForm.endDate}
                      onChange={(e) => setHistoricalForm({ ...historicalForm, endDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> Load Data
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">Price Movement Chart</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#a1a1a1" 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#a1a1a1' }}
                    />
                    <YAxis 
                      stroke="#a1a1a1"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#a1a1a1' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#27272a', 
                        border: '1px solid #3f3f46',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="open" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                      dot={false}
                      name="Open"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#34d399" 
                      strokeWidth={2}
                      dot={false}
                      name="Close"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="high" 
                      stroke="#fbbf24" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="High"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      stroke="#f87171" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Low"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">OHLCV Data - {historicalForm.symbol}</h2>
                  <div className="text-sm text-zinc-400">{historicalForm.timeframe} - {historicalData.length} records</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Date</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Open</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">High</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Low</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Close</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Volume</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((row, idx) => {
                        const changePercent = ((row.close - row.open) / row.open * 100).toFixed(2);
                        const isPositive = parseFloat(changePercent) >= 0;
                        return (
                          <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <td className="py-3 px-4 text-white">{row.date}</td>
                            <td className="text-right py-3 px-4 text-white">{row.open.toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-white">{row.high.toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-white">{row.low.toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-white font-semibold">{row.close.toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-zinc-400">{(row.volume / 1000000).toFixed(2)}M</td>
                            <td className={`text-right py-3 px-4 font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{changePercent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-700 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">High</p>
                    <p className="text-xl font-bold text-white">
                      {Math.max(...historicalData.map(d => d.high)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Low</p>
                    <p className="text-xl font-bold text-white">
                      {Math.min(...historicalData.map(d => d.low)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Avg Volume</p>
                    <p className="text-xl font-bold text-white">
                      {(historicalData.reduce((sum, d) => sum + d.volume, 0) / historicalData.length / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm mb-1">Change</p>
                    <p className={`text-xl font-bold ${historicalData[historicalData.length - 1].close >= historicalData[0].open ? 'text-green-400' : 'text-red-400'}`}>
                      {((historicalData[historicalData.length - 1].close - historicalData[0].open) / historicalData[0].open * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Strategies;