import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trash2, Eye, EyeOff, ShoppingCart, X, Plus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import API_ENDPOINTS from '../config/api';

interface PaperPortfolio {
  initial_capital: number;
  current_value: number;
  cash: number;
  positions_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  return_percent: number;
  open_positions_count: number;
  closed_trades: number;
}

interface Holding {
  id: string;
  symbol: string;
  type: 'STOCK' | 'CALL' | 'PUT';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalBought: number;
  currentValue: number;
  pl: number;
  plPercent: number;
  timestamp: Date;
  mode: 'paper' | 'real';
  strike?: number;
}

interface SellModalState {
  holding: Holding | null;
  quantity: number;
  showModal: boolean;
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [paperPortfolio, setPaperPortfolio] = useState<PaperPortfolio | null>(null);
  const [showValue, setShowValue] = useState(true);
  const [filter, setFilter] = useState<'all' | 'stock' | 'options'>('all');
  const [sellModal, setSellModal] = useState<SellModalState>({
    holding: null,
    quantity: 1,
    showModal: false
  });
  const [loading, setLoading] = useState(true);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyForm, setBuyForm] = useState({
    symbol: 'NIFTY',
    quantity: 1,
    price: 26042.30
  });

  // Fetch paper trading portfolio
  useEffect(() => {
    const fetchPaperPortfolio = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.PAPER_TRADING.PORTFOLIO);
        const data = await response.json();
        if (data.status === 'success') {
          setPaperPortfolio(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch paper portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaperPortfolio();
    const interval = setInterval(fetchPaperPortfolio, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleBuyStock = async () => {
    if (buyForm.quantity <= 0 || buyForm.price <= 0) {
      toast.error('Invalid Input', {
        description: 'Quantity and price must be greater than 0'
      });
      return;
    }

    const totalCost = buyForm.quantity * buyForm.price;
    if (paperPortfolio && totalCost > paperPortfolio.cash) {
      toast.error('Insufficient Balance', {
        description: `You need ₹${totalCost.toFixed(2)} but have ₹${paperPortfolio.cash.toFixed(2)}`
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.PAPER_TRADING.PLACE_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: buyForm.symbol,
          quantity: buyForm.quantity,
          price: buyForm.price,
          side: 'BUY'
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Buy Order Placed', {
          description: `${buyForm.symbol} | ${buyForm.quantity} shares @ ₹${buyForm.price.toFixed(2)} = ₹${totalCost.toFixed(2)}`
        });
        setBuyModalOpen(false);
        setBuyForm({ symbol: 'NIFTY', quantity: 1, price: 26042.30 });
        
        // Refresh portfolio
        const portfolioRes = await fetch(API_ENDPOINTS.PAPER_TRADING.PORTFOLIO);
        const portfolioData = await portfolioRes.json();
        if (portfolioData.status === 'success') {
          setPaperPortfolio(portfolioData.data);
        }
      } else {
        toast.error('Order Failed', {
          description: data.message || 'Unknown error'
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to place order: ' + String(error)
      });
    }
  };

  const filteredHoldings = holdings.filter(holding => {
    if (filter === 'stock') return holding.type === 'STOCK';
    if (filter === 'options') return holding.type === 'CALL' || holding.type === 'PUT';
    return true;
  });

  // Use paper trading data if available
  const totalInvested = paperPortfolio?.initial_capital || 0;
  const totalCurrent = paperPortfolio?.current_value || 0;
  const totalPL = paperPortfolio?.total_pnl || 0;
  const totalPLPercent = paperPortfolio?.return_percent || 0;

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
    const updated = holdings.filter(h => h.id !== id);
    localStorage.setItem('holdings', JSON.stringify(updated));
  };

  const handleSell = (holding: Holding) => {
    setSellModal({
      holding,
      quantity: 1,
      showModal: true
    });
  };

  const executeSell = () => {
    if (!sellModal.holding || sellModal.quantity <= 0) return;

    const holding = sellModal.holding;
    const sellQuantity = sellModal.quantity;
    const sellProceeds = holding.currentPrice * sellQuantity;
    const costOfShares = holding.buyPrice * sellQuantity;
    const profitFromSale = sellProceeds - costOfShares;

    // Create sell order record
    const sellOrder = {
      id: `SELL-${Date.now()}`,
      type: 'SELL' as const,
      symbol: holding.symbol,
      quantity: sellQuantity,
      buyPrice: holding.buyPrice,
      sellPrice: holding.currentPrice,
      proceeds: sellProceeds,
      profit: profitFromSale,
      timestamp: new Date(),
      mode: holding.mode
    };

    // Save to sell history in localStorage
    const sellHistory = JSON.parse(localStorage.getItem('sellHistory') || '[]');
    sellHistory.unshift(sellOrder);
    localStorage.setItem('sellHistory', JSON.stringify(sellHistory));

    // Update holdings - either reduce quantity or remove
    const updatedHoldings = holdings.map(h => {
      if (h.id === holding.id) {
        const newQuantity = h.quantity - sellQuantity;
        if (newQuantity <= 0) {
          return null;
        }
        return {
          ...h,
          quantity: newQuantity,
          currentValue: holding.currentPrice * newQuantity,
          pl: (holding.currentPrice - h.buyPrice) * newQuantity,
          plPercent: ((holding.currentPrice - h.buyPrice) / h.buyPrice) * 100
        };
      }
      return h;
    }).filter((h) => h !== null) as Holding[];

    setHoldings(updatedHoldings);
    localStorage.setItem('holdings', JSON.stringify(updatedHoldings));

    if (profitFromSale >= 0) {
      toast.success('Sell Order Executed', {
        description: `${holding.symbol} | ${sellQuantity} shares @ ₹${holding.currentPrice.toFixed(2)} | Profit: ₹${profitFromSale.toFixed(2)}`
      });
    } else {
      toast.info('Sell Order Executed', {
        description: `${holding.symbol} | ${sellQuantity} shares @ ₹${holding.currentPrice.toFixed(2)} | Loss: ₹${Math.abs(profitFromSale).toFixed(2)}`
      });
    }

    setSellModal({ holding: null, quantity: 1, showModal: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setBuyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Buy
            </button>
            <button
              onClick={() => setShowValue(!showValue)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition"
            >
              {showValue ? <Eye className="w-5 h-5 text-zinc-400" /> : <EyeOff className="w-5 h-5 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* Portfolio Summary - Clean Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-800/50 rounded p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Initial Capital</p>
            <p className="text-2xl font-semibold text-white">
              {showValue ? `₹${totalInvested.toFixed(0)}` : '•••'}
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Current Value</p>
            <p className="text-2xl font-semibold text-emerald-400">
              {showValue ? `₹${totalCurrent.toFixed(0)}` : '•••'}
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Total P&L</p>
            <p className={`text-2xl font-semibold ${totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {showValue ? `${totalPL >= 0 ? '+' : ''}₹${totalPL.toFixed(0)}` : '•••'}
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded p-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide mb-2">Return</p>
            <p className={`text-2xl font-semibold ${totalPLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {showValue ? `${totalPLPercent >= 0 ? '+' : ''}${totalPLPercent.toFixed(1)}%` : '•••'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'stock', 'options'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {f === 'all' ? 'All Holdings' : f === 'stock' ? 'Stocks' : 'Options'}
          </button>
        ))}
      </div>

      {/* Paper Trading Info */}
      {paperPortfolio && (
        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/50 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-amber-200 text-xs uppercase mb-2">Demo Account Balance</p>
              <p className="text-2xl font-bold text-amber-300">₹{paperPortfolio.cash.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-amber-200 text-xs uppercase mb-2">Positions Value</p>
              <p className="text-2xl font-bold text-emerald-400">₹{paperPortfolio.positions_value.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-amber-200 text-xs uppercase mb-2">Unrealized P&L</p>
              <p className={`text-2xl font-bold ${paperPortfolio.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ₹{paperPortfolio.unrealized_pnl.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-amber-200 text-xs uppercase mb-2">Total Trades</p>
              <p className="text-2xl font-bold text-blue-400">{paperPortfolio.closed_trades}</p>
            </div>
          </div>
        </div>
      )}

      {/* Holdings List */}
      {filteredHoldings.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400 text-lg mb-4">No holdings yet</p>
          <p className="text-zinc-500 text-sm">Buy some stocks or options to see them here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHoldings.map(holding => (
            <div
              key={holding.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:bg-zinc-800/50 transition"
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-max">
                  {/* Type Badge */}
                  <div className={`px-3 py-2 rounded-lg font-bold text-sm ${
                    holding.type === 'STOCK' ? 'bg-blue-600/30 text-blue-400' :
                    holding.type === 'CALL' ? 'bg-emerald-600/30 text-emerald-400' :
                    'bg-red-600/30 text-red-400'
                  }`}>
                    {holding.type}
                  </div>

                  {/* Symbol Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {holding.symbol}
                      {holding.strike && ` ${holding.strike} ${holding.type}`}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Qty: {holding.quantity} | {holding.mode === 'paper' ? 'Demo' : 'Real'}
                    </p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="text-right">
                  <p className="text-lg font-semibold text-zinc-300">
                    ₹{holding.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Entry: ₹{holding.buyPrice.toFixed(2)}
                  </p>
                </div>

                {/* Current Value */}
                <div className="text-right">
                  <p className="text-sm text-zinc-400 mb-1">Value</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {showValue ? `₹${holding.currentValue.toFixed(2)}` : '***'}
                  </p>
                </div>

                {/* P&L Box */}
                <div className={`text-right px-4 py-3 rounded-lg ${
                  holding.pl >= 0 ? 'bg-emerald-600/20' : 'bg-red-600/20'
                }`}>
                  <p className={`text-sm font-semibold flex items-center justify-end gap-1 mb-1 ${
                    holding.pl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {holding.pl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {showValue ? `₹${holding.pl.toFixed(2)}` : '***'}
                  </p>
                  <p className={`text-xs ${holding.plPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {showValue ? `${holding.plPercent >= 0 ? '+' : ''}${holding.plPercent.toFixed(2)}%` : '***'}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeHolding(holding.id)}
                  className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition"
                  title="Close Position"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Sell Button */}
                <button
                  onClick={() => handleSell(holding)}
                  className="p-2 text-orange-400 hover:bg-orange-600/20 rounded-lg transition"
                  title="Sell Holding"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>

              {/* Time Info */}
              <p className="text-xs text-zinc-500">
                {holding.timestamp.toLocaleDateString('en-IN')} at {holding.timestamp.toLocaleTimeString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Sell Modal */}
      {sellModal.showModal && sellModal.holding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Sell {sellModal.holding.symbol}</h2>
              <button
                onClick={() => setSellModal({ holding: null, quantity: 1, showModal: false })}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current Holdings Info */}
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-zinc-400">Total Holding</p>
              <p className="text-2xl font-bold text-white">{sellModal.holding.quantity} shares</p>
              <p className="text-xs text-zinc-500">
                Bought @ ₹{sellModal.holding.buyPrice.toFixed(2)}
              </p>
            </div>

            {/* Current Market Price */}
            <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4 space-y-2">
              <p className="text-sm text-emerald-300">Current Market Price</p>
              <p className="text-3xl font-bold text-emerald-400">₹{sellModal.holding.currentPrice.toFixed(2)}</p>
            </div>

            {/* Quantity to Sell */}
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              <label className="text-sm text-zinc-400">How many to sell?</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={sellModal.holding.quantity}
                  value={sellModal.quantity}
                  onChange={(e) => setSellModal({
                    ...sellModal,
                    quantity: Math.min(Math.max(1, parseInt(e.target.value) || 1), sellModal.holding!.quantity)
                  })}
                  className="flex-1 bg-zinc-700 border border-zinc-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setSellModal({ ...sellModal, quantity: sellModal.holding!.quantity })}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Sale Summary */}
            <div className="space-y-4 border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-bold text-white">Sale Summary</h3>
              
              {/* Cost Breakdown */}
              <div className="space-y-2 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">Entry Price (per share):</span>
                  <span className="text-white font-semibold">₹{sellModal.holding.buyPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">Qty to Sell:</span>
                  <span className="text-white font-semibold">{sellModal.quantity} shares</span>
                </div>
                <div className="border-t border-blue-700 pt-2 flex justify-between items-center">
                  <span className="text-blue-300 font-semibold">Total Cost:</span>
                  <span className="text-white font-bold text-lg">₹{(sellModal.holding.buyPrice * sellModal.quantity).toFixed(2)}</span>
                </div>
              </div>

              {/* Current Price & Proceeds */}
              <div className="space-y-2 bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300">Current Price (per share):</span>
                  <span className="text-white font-semibold">₹{sellModal.holding.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300">Qty to Sell:</span>
                  <span className="text-white font-semibold">{sellModal.quantity} shares</span>
                </div>
                <div className="border-t border-emerald-700 pt-2 flex justify-between items-center">
                  <span className="text-emerald-300 font-semibold">Sale Proceeds:</span>
                  <span className="text-white font-bold text-lg">₹{(sellModal.holding.currentPrice * sellModal.quantity).toFixed(2)}</span>
                </div>
              </div>

              {/* P&L Calculation */}
              {(() => {
                const proceeds = sellModal.holding.currentPrice * sellModal.quantity;
                const cost = sellModal.holding.buyPrice * sellModal.quantity;
                const profit = proceeds - cost;
                const profitPercent = (profit / cost) * 100;
                const priceChange = sellModal.holding.currentPrice - sellModal.holding.buyPrice;

                return (
                  <div className={`rounded-lg p-4 ${profit >= 0 ? 'bg-emerald-600/30 border-2 border-emerald-500' : 'bg-red-600/30 border-2 border-red-500'}`}>
                    <h3 className={`text-sm font-bold mb-3 ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      PROFIT/LOSS BREAKDOWN
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className={`${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          Price per share change:
                        </span>
                        <span className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {priceChange >= 0 ? '+' : ''}₹{priceChange.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          Total profit/loss:
                        </span>
                        <span className={`font-bold text-xl ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded p-3 text-center">
                      <p className={`text-xs ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'} mb-1`}>
                        Return on Investment
                      </p>
                      <p className={`text-3xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                      </p>
                      <p className={`text-xs mt-2 ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {profit >= 0 ? 'PROFIT' : 'LOSS'} - Per share: {profit >= 0 ? '+' : ''}₹{(profit / sellModal.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSellModal({ holding: null, quantity: 1, showModal: false })}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={executeSell}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Sell Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {buyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Buy Stock</h2>
              <button
                onClick={() => setBuyModalOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Available Balance */}
            {paperPortfolio && (
              <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4 space-y-2">
                <p className="text-sm text-emerald-300">Available Balance</p>
                <p className="text-3xl font-bold text-emerald-400">₹{paperPortfolio.cash.toFixed(2)}</p>
              </div>
            )}

            {/* Symbol Input */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Stock Symbol</label>
              <input
                type="text"
                value={buyForm.symbol}
                onChange={(e) => setBuyForm({ ...buyForm, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., NIFTY"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Price per Share (₹)</label>
              <input
                type="number"
                value={buyForm.price}
                onChange={(e) => setBuyForm({ ...buyForm, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Quantity</label>
              <input
                type="number"
                value={buyForm.quantity}
                onChange={(e) => setBuyForm({ ...buyForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                placeholder="1"
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Total Cost */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Total Cost</span>
                <span className="text-2xl font-bold text-blue-400">₹{(buyForm.quantity * buyForm.price).toFixed(2)}</span>
              </div>
              {paperPortfolio && (
                <div className="flex justify-between items-center pt-2 border-t border-blue-700">
                  <span className="text-blue-300 text-sm">Remaining Balance</span>
                  <span className={`font-semibold ${
                    (paperPortfolio.cash - buyForm.quantity * buyForm.price) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    ₹{Math.max(0, paperPortfolio.cash - buyForm.quantity * buyForm.price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setBuyModalOpen(false)}
                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyStock}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
    );
}
