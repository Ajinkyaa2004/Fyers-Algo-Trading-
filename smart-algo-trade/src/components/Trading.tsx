import { useState } from 'react';
import { Send, AlertCircle, Zap } from 'lucide-react';
import { useTradingMode } from '../context/TradingModeContext';

type OrderType = 'MARKET' | 'LIMIT';
type OrderSide = 'BUY' | 'SELL';
type ProductType = 'INTRADAY' | 'DELIVERY' | 'MTF';

interface PlaceOrderRequest {
  symbol: string;
  qty: number;
  type: number;
  side: number;
  productType: string;
  limitPrice: number;
  stopPrice: number;
  validity: string;
  disclosedQty: number;
  offlineOrder: boolean;
}

export const Trading = () => {
  const { isPaperTrading } = useTradingMode();
  const [symbol, setSymbol] = useState('NSE:SBIN-EQ');
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [limitPrice, setLimitPrice] = useState(0);
  const [productType, setProductType] = useState<ProductType>('INTRADAY');
  const [validity, setValidity] = useState('DAY');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const orderData: PlaceOrderRequest = {
        symbol,
        qty,
        type: orderType === 'MARKET' ? 2 : 1, // 1=Limit, 2=Market
        side: orderSide === 'BUY' ? 1 : -1, // 1=Buy, -1=Sell
        productType,
        limitPrice: orderType === 'LIMIT' ? limitPrice : 0,
        stopPrice: 0,
        validity,
        disclosedQty: 0,
        offlineOrder: false,
      };

      const response = await fetch(
        'http://127.0.0.1:8001/api/portfolio/place-order',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess(
          `Order placed successfully! Order ID: ${result.data.id || 'Pending'}`
        );
        setOrderHistory([
          {
            id: result.data.id || Date.now(),
            symbol,
            qty,
            type: orderType,
            side: orderSide,
            price: limitPrice || 'Market',
            status: 'PENDING',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...orderHistory,
        ]);
        // Reset form
        setQty(1);
        setOrderType('MARKET');
        setLimitPrice(0);
      } else {
        setError(result.detail || 'Failed to place order');
      }
    } catch (err: any) {
      setError(err.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-100">Place Order</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isPaperTrading ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold">{isPaperTrading ? 'DEMO MODE' : 'LIVE MODE'}</span>
            </div>
          </div>

          <form onSubmit={placeOrder} className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., NSE:SBIN-EQ"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Order Side */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Order Side
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderSide('BUY')}
                  className={`py-2 rounded-lg font-medium transition ${
                    orderSide === 'BUY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('SELL')}
                  className={`py-2 rounded-lg font-medium transition ${
                    orderSide === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Order Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={`py-2 rounded-lg font-medium transition ${
                    orderType === 'MARKET'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={`py-2 rounded-lg font-medium transition ${
                    orderType === 'LIMIT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Limit Price */}
            {orderType === 'LIMIT' && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Limit Price
                </label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="Enter limit price"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option>INTRADAY</option>
                <option>DELIVERY</option>
                <option>MTF</option>
              </select>
            </div>

            {/* Validity */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Validity
              </label>
              <select
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="DAY">Day</option>
                <option value="IOC">Immediate or Cancel</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex gap-2 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
                <div className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5">✓</div>
                <p className="text-sm text-emerald-400">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                orderSide === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
              } text-white disabled:opacity-50`}
            >
              <Send className="w-4 h-4" />
              {loading ? 'Placing Order...' : `Place ${orderSide} Order`}
            </button>
          </form>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Recent Orders</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orderHistory.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">
              No orders placed yet
            </p>
          ) : (
            orderHistory.map((order, idx) => (
              <div
                key={idx}
                className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-zinc-100">
                    {order.symbol}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      order.side === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {order.side}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Qty: {order.qty}</div>
                  <div>Type: {order.type}</div>
                  <div>Price: {order.price}</div>
                  <div className="text-zinc-500 pt-2">{order.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
