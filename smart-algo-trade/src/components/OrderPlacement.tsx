import { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle2, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingMode } from '../context/TradingModeContext';

interface OrderFormData {
  symbol: string;
  quantity: number;
  price: number;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  productType: 'MIS' | 'CNC';
  instrumentType: 'EQUITY' | 'CALL' | 'PUT';
  strikePrice?: number;
  expiryDate?: string;
}

interface OrderResponse {
  status: string;
  data?: any;
  message?: string;
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
}

export function OrderPlacement() {
  const { isPaperTrading, setIsPaperTrading } = useTradingMode();
  const [formData, setFormData] = useState<OrderFormData>({
    symbol: 'NSE:SBIN-EQ',
    quantity: 1,
    price: 500,
    side: 'BUY',
    type: 'LIMIT',
    productType: 'MIS',
    instrumentType: 'EQUITY',
    strikePrice: undefined,
    expiryDate: undefined
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8001/api/paper-trading/portfolio');
        const data = await res.json();
        if (data.status === 'success') {
          setPortfolio(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'strikePrice' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      if (isPaperTrading) {
        // Paper Trading Mode
        const params = new URLSearchParams({
          symbol: formData.symbol,
          quantity: formData.quantity.toString(),
          price: formData.price.toString(),
          side: formData.side,
          order_type: formData.type,
          instrument_type: formData.instrumentType,
          strike_price: formData.strikePrice?.toString() || '',
          expiry_date: formData.expiryDate || ''
        });

        const res = await fetch(`http://127.0.0.1:8001/api/paper-trading/place-order?${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        setResponse(data);

        if (data.success) {
          // Reset form on success
          setFormData({
            symbol: formData.instrumentType === 'EQUITY' ? 'NSE:SBIN-EQ' : 'NIFTY50',
            quantity: 1,
            price: 500,
            side: 'BUY',
            type: 'LIMIT',
            productType: 'MIS',
            instrumentType: 'EQUITY',
            strikePrice: undefined,
            expiryDate: undefined
          });
        } else {
          setError(data.message || 'Order placement failed');
        }
      } else {
        // Real Trading Mode
        const orderData = {
          symbol: formData.symbol,
          qty: formData.quantity,
          type: formData.type,
          side: formData.side === 'BUY' ? 1 : -1,
          productType: formData.productType,
          limitPrice: formData.type === 'LIMIT' ? formData.price : 0,
          stopPrice: 0,
          validity: 'DAY',
          disclosedQty: 0,
          offlineOrder: false,
          instrumentType: formData.instrumentType,
          strikePrice: formData.strikePrice || 0,
          expiryDate: formData.expiryDate || ''
        };

        const res = await fetch('http://127.0.0.1:8001/api/portfolio/place-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        const data = await res.json();
        setResponse(data);

        if (data.status === 'success') {
          // Reset form on success
          setFormData({
            symbol: formData.instrumentType === 'EQUITY' ? 'NSE:SBIN-EQ' : 'NIFTY50',
            quantity: 1,
            price: 500,
            side: 'BUY',
            type: 'LIMIT',
            productType: 'MIS',
            instrumentType: 'EQUITY',
            strikePrice: undefined,
            expiryDate: undefined
          });
        } else {
          setError(data.message || 'Order placement failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          {isPaperTrading && <Zap className="w-5 h-5 text-yellow-500" />}
          Place New Order
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isPaperTrading ? 'text-yellow-500' : 'text-red-500'}`}>
            {isPaperTrading ? 'PAPER TRADING' : 'REAL TRADING'}
          </span>
          <button
            type="button"
            onClick={() => setIsPaperTrading(!isPaperTrading)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPaperTrading ? 'bg-yellow-600' : 'bg-red-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPaperTrading ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* P&L Summary Card */}
      {portfolio && isPaperTrading && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Portfolio Value */}
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase mb-1">Portfolio Value</span>
              <span className="text-lg font-bold text-blue-400">₹{formatNumber(portfolio.current_value)}</span>
              <span className="text-xs text-zinc-500">Initial: ₹{formatNumber(portfolio.initial_capital)}</span>
            </div>

            {/* Total P&L */}
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase mb-1">Total P&L</span>
              <div className="flex items-center gap-1">
                {portfolio.total_pnl >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-400">+₹{formatNumber(Math.abs(portfolio.total_pnl))}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-lg font-bold text-red-400">-₹{formatNumber(Math.abs(portfolio.total_pnl))}</span>
                  </>
                )}
              </div>
              <span className={`text-xs ${portfolio.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {portfolio.total_pnl >= 0 ? '+' : ''}{portfolio.return_percent.toFixed(2)}%
              </span>
            </div>

            {/* Realized P&L */}
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase mb-1">Realized</span>
              <span className={`text-lg font-bold ${portfolio.realized_pnl >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                {portfolio.realized_pnl >= 0 ? '+' : ''}₹{formatNumber(Math.abs(portfolio.realized_pnl))}
              </span>
              <span className="text-xs text-zinc-500">Closed trades</span>
            </div>

            {/* Unrealized P&L */}
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 uppercase mb-1">Unrealized</span>
              <span className={`text-lg font-bold ${portfolio.unrealized_pnl >= 0 ? 'text-purple-400' : 'text-pink-400'}`}>
                {portfolio.unrealized_pnl >= 0 ? '+' : ''}₹{formatNumber(Math.abs(portfolio.unrealized_pnl))}
              </span>
              <span className="text-xs text-zinc-500">Open positions</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
        {/* Instrument Type Selection */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Instrument Type</label>
          <div className="grid grid-cols-3 gap-2">
            {['EQUITY', 'CALL', 'PUT'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  instrumentType: type as 'EQUITY' | 'CALL' | 'PUT',
                  symbol: type === 'EQUITY' ? 'NSE:SBIN-EQ' : 'NIFTY50'
                }))}
                className={`py-2 px-3 rounded text-sm font-medium transition ${
                  formData.instrumentType === type
                    ? type === 'CALL' ? 'bg-emerald-600 text-white' : type === 'PUT' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {type === 'CALL' ? '📈 CALL' : type === 'PUT' ? '📉 PUT' : '📊 EQUITY'}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol and Quantity Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              {formData.instrumentType === 'EQUITY' ? 'Equity Symbol' : 'Index/Underlying'}
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder={formData.instrumentType === 'EQUITY' ? "e.g., NSE:SBIN-EQ" : "e.g., NIFTY50"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Quantity ({formData.instrumentType === 'EQUITY' ? 'shares' : 'contracts'})</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Options Fields: Strike Price and Expiry */}
        {formData.instrumentType !== 'EQUITY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800/50 p-4 rounded border border-zinc-700">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Strike Price</label>
              <input
                type="number"
                name="strikePrice"
                value={formData.strikePrice || ''}
                onChange={handleInputChange}
                step="0.01"
                placeholder="e.g., 19500"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate || ''}
                onChange={handleInputChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Price and Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              disabled={formData.type === 'MARKET'}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Order Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>
        </div>

        {/* Side and Product Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Side</label>
            <select
              name="side"
              value={formData.side}
              onChange={handleInputChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Product</label>
            <select
              name="productType"
              value={formData.productType}
              onChange={handleInputChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="MIS">Intraday (MIS)</option>
              <option value="CNC">Delivery (CNC)</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {response?.status === 'success' && (
          <div className="bg-emerald-900/30 border border-emerald-700 rounded p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-300 text-sm font-medium">Order placed successfully!</p>
              {response.data?.orderId && (
                <p className="text-emerald-400 text-xs mt-1">Order ID: {response.data.orderId}</p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>

      {/* Order Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <p className="text-sm text-zinc-400 mb-3">Order Summary:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
          <div>
            <p className="text-zinc-500">Instrument</p>
            <p className="font-semibold text-zinc-100">
              {formData.instrumentType === 'CALL' ? '📈 CALL' : formData.instrumentType === 'PUT' ? '📉 PUT' : '📊 EQUITY'}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">{formData.side}</p>
            <p className="font-semibold text-zinc-100">{formData.quantity} @ ₹{formData.price}</p>
          </div>
          <div>
            <p className="text-zinc-500">Type</p>
            <p className="font-semibold text-zinc-100">{formData.type}</p>
          </div>
          <div>
            <p className="text-zinc-500">Product</p>
            <p className="font-semibold text-zinc-100">{formData.productType}</p>
          </div>
        </div>

        {formData.instrumentType !== 'EQUITY' && (
          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700 text-sm">
            <p className="text-zinc-400 mb-2">Options Details:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-zinc-500 text-xs">Strike Price</p>
                <p className="font-semibold text-zinc-100">₹{formData.strikePrice || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Expiry Date</p>
                <p className="font-semibold text-zinc-100">{formData.expiryDate || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {formData.instrumentType === 'EQUITY' && (
          <div className="text-right">
            <p className="text-zinc-500 text-xs mb-1">Total Value</p>
            <p className="font-semibold text-emerald-400">₹{(formData.quantity * formData.price).toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
