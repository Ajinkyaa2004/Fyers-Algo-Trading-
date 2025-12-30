import { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { HistoricalChart } from '../components/HistoricalChart';

interface StockDetailsProps {
  symbol: string;
  onBack: () => void;
}

type TradingMode = 'paper' | 'real';
type TimeFrame = '1' | '5' | '15' | '60' | 'D' | 'W' | 'M';
type OptionType = 'CALL' | 'PUT';

interface OptionChain {
  strikePrice: number;
  callBid: number;
  callAsk: number;
  callOI: number;
  putBid: number;
  putAsk: number;
  putOI: number;
  iv: number;
}

interface Order {
  id: string;
  type: 'CALL' | 'PUT' | 'BUY' | 'SELL';
  symbol: string;
  strike?: number;
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'EXECUTED';
  mode: TradingMode;
}

export default function StockDetails({ symbol, onBack }: StockDetailsProps) {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tradingMode, setTradingMode] = useState<TradingMode>('paper');
  const [timeframe, setTimeframe] = useState<TimeFrame>('D');
  const [optionChain, setOptionChain] = useState<OptionChain[]>([]);
  const [selectedOption, setSelectedOption] = useState<{ type: OptionType; strike: number } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: '1', label: '1M' },
    { value: '5', label: '5M' },
    { value: '15', label: '15M' },
    { value: '60', label: '1H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1W' },
    { value: 'M', label: '1M' }
  ];

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8001/api/market/quote?symbols=${encodeURIComponent(symbol)}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data[0]) {
        const v = data.data[0].v;
        setQuote({
          symbol: v.symbol,
          ltp: v.lp,
          chp: v.chp,
          ch: v.ch,
          open_price: v.open_price,
          high_price: v.high_price,
          low_price: v.low_price,
          close_price: v.lp,
          volume: v.volume,
          prev_close_price: v.prev_close_price,
          ask: v.ask,
          bid: v.bid
        });
        
        // Generate option chain based on current price
        generateOptionChain(v.lp);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptionChain = (basePrice: number) => {
    const strikes = [];
    
    // Generate 5 strikes around current price
    for (let i = -2; i <= 2; i++) {
      const strike = basePrice + (i * 100);
      const distance = Math.abs(strike - basePrice);
      
      // Simplified option pricing
      const callPrice = Math.max(Math.abs(basePrice - strike), 10 + (100 - distance * 0.1));
      const putPrice = Math.max(Math.abs(strike - basePrice), 10 + (100 - distance * 0.1));
      const iv = 18 - (distance * 0.02);
      
      strikes.push({
        strikePrice: strike,
        callBid: callPrice - 5,
        callAsk: callPrice + 5,
        callOI: Math.floor(Math.random() * 500000) + 50000,
        putBid: putPrice - 5,
        putAsk: putPrice + 5,
        putOI: Math.floor(Math.random() * 500000) + 50000,
        iv: Math.max(iv, 8)
      });
    }
    
    setOptionChain(strikes);
  };

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const shortName = symbol.split(':')[1]?.replace('-EQ', '') || symbol;
  const isPositive = quote?.ch >= 0;

  const handlePlaceOrder = async (type: 'BUY' | 'SELL' | 'CALL' | 'PUT') => {
    const shortSymbol = symbol.split(':')[1]?.replace('-EQ', '') || symbol;

    const newOrder: Order = {
      id: `ORDER-${Date.now()}`,
      type: type as 'CALL' | 'PUT' | 'BUY' | 'SELL',
      symbol: selectedOption ? `${symbol}${selectedOption.strike}${selectedOption.type}` : symbol,
      strike: selectedOption?.strike,
      quantity: quantity,
      price: selectedOption ? 100 : (type === 'BUY' ? quote?.ask : quote?.bid),
      totalValue: selectedOption ? 100 * quantity : (type === 'BUY' ? quote?.ask * quantity : quote?.bid * quantity),
      timestamp: new Date(),
      status: 'ACTIVE',
      mode: tradingMode
    };
    
    setOrders([newOrder, ...orders]);

    // Add to holdings if buying
    if (type === 'BUY' || type === 'CALL' || type === 'PUT') {
      const newHolding = {
        id: `HOLD-${Date.now()}`,
        symbol: shortSymbol,
        type: type === 'BUY' ? 'STOCK' : (type === 'CALL' ? 'CALL' : 'PUT'),
        quantity: quantity,
        buyPrice: type === 'BUY' ? quote?.ask : 100,
        currentPrice: type === 'BUY' ? quote?.ask : 100,
        totalBought: type === 'BUY' ? quote?.ask * quantity : 100 * quantity,
        currentValue: type === 'BUY' ? quote?.ask * quantity : 100 * quantity,
        pl: 0,
        plPercent: 0,
        timestamp: new Date(),
        mode: tradingMode,
        strike: selectedOption?.strike
      };

      const existingHoldings = JSON.parse(localStorage.getItem('holdings') || '[]');
      existingHoldings.unshift(newHolding);
      localStorage.setItem('holdings', JSON.stringify(existingHoldings));

      if (selectedOption) {
        toast.success('Order Placed', {
          description: `${selectedOption.type} @ ${selectedOption.strike} | ${quantity} contracts`
        });
      } else {
        toast.success('Order Placed', {
          description: `${shortSymbol} | ${quantity} shares`
        });
      }
    } else {
      toast.success('Order Placed', {
        description: `${shortSymbol} | ${quantity} shares`
      });
    }

    setSelectedOption(null);
    setQuantity(1);
  };

  const cancelOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'CANCELLED' } : order
    ));
    toast.info('Order Cancelled', {
      description: 'The order has been cancelled'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">{shortName}</h1>
            <p className="text-sm text-zinc-400 mt-1">{symbol}</p>
          </div>

          <div className="text-right">
            <p className="text-4xl font-bold text-zinc-100">
              ₹{quote?.ltp?.toFixed(2) || 'N/A'}
            </p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {quote?.ch >= 0 ? '+' : ''}{quote?.ch?.toFixed(2)} ({quote?.chp?.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Trading Mode Selector */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm text-zinc-400">Trading Mode:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTradingMode('paper')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                tradingMode === 'paper'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Paper Trading (Demo)
            </button>
            <button
              onClick={() => setTradingMode('real')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                tradingMode === 'real'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Real Money
            </button>
          </div>
        </div>

        {tradingMode === 'real' && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            Real Money Mode - Orders will be executed with actual funds!
          </div>
        )}
      </div>

      {/* Price Details */}
      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">OPEN</p>
            <p className="text-xl font-bold text-zinc-100">₹{quote.open_price.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">HIGH</p>
            <p className="text-xl font-bold text-emerald-400">₹{quote.high_price.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">LOW</p>
            <p className="text-xl font-bold text-red-400">₹{quote.low_price.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">VOLUME</p>
            <p className="text-xl font-bold text-blue-400">{(quote.volume / 1000).toFixed(0)}K</p>
          </div>
        </div>
      )}

      {/* Chart with Timeframe Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Timeframe:</span>
          <div className="flex gap-2 flex-wrap">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  timeframe === tf.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
        
        <HistoricalChart symbol={symbol} resolution={timeframe} />
      </div>

      {/* P&L Calculator */}
      {quote && (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-emerald-300">Profit & Loss Calculator</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <label className="text-xs text-zinc-500 mb-2 block">Entry Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder={quote.open_price.toFixed(2)}
                className="w-full bg-zinc-700 border border-zinc-600 text-zinc-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="entryPrice"
              />
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <label className="text-xs text-zinc-500 mb-1 block">Current Price</label>
              <p className="text-2xl font-bold text-emerald-400">₹{quote.ltp.toFixed(2)}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Quantity (Shares)</p>
              <input
                type="number"
                min="1"
                value={quantity}
                className="w-full bg-zinc-700 border border-zinc-600 text-zinc-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* P&L Display */}
          <div id="plResults" className="grid grid-cols-2 md:grid-cols-4 gap-4 hidden">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Total Cost</p>
              <p className="text-lg font-bold text-blue-400" id="totalCost">₹0.00</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Current Value</p>
              <p className="text-lg font-bold text-emerald-400" id="currentValue">₹0.00</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">P&L (₹)</p>
              <p className="text-lg font-bold text-emerald-400" id="plAmount">₹0.00</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">P&L %</p>
              <p className="text-lg font-bold text-emerald-400" id="plPercent">0.00%</p>
            </div>
          </div>

          <button
            onClick={() => {
              const entryPrice = parseFloat((document.getElementById('entryPrice') as HTMLInputElement)?.value || quote.open_price.toString());
              const totalCost = entryPrice * quantity;
              const currentValue = quote.ltp * quantity;
              const pl = currentValue - totalCost;
              const plPercent = (pl / totalCost) * 100;

              const resultsDiv = document.getElementById('plResults');
              if (resultsDiv) resultsDiv.classList.remove('hidden');
              
              const totalCostEl = document.getElementById('totalCost');
              const currentValueEl = document.getElementById('currentValue');
              const plAmountEl = document.getElementById('plAmount');
              const plPercentEl = document.getElementById('plPercent');

              if (totalCostEl) totalCostEl.textContent = `₹${totalCost.toFixed(2)}`;
              if (currentValueEl) currentValueEl.textContent = `₹${currentValue.toFixed(2)}`;
              if (plAmountEl) {
                plAmountEl.textContent = `₹${pl.toFixed(2)}`;
                plAmountEl.className = `text-lg font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
              }
              if (plPercentEl) {
                plPercentEl.textContent = `${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(2)}%`;
                plPercentEl.className = `text-lg font-bold ${plPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
              }
            }}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
          >
            Calculate P&L
          </button>
        </div>
      )}

      {/* Options Chain */}
      {optionChain.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold text-zinc-100">Options Chain</h2>
            <p className="text-sm text-zinc-400 mt-1">Select Call or Put options to trade</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-zinc-400">CALL BID</th>
                  <th className="px-4 py-3 text-left text-zinc-400">CALL ASK</th>
                  <th className="px-4 py-3 text-center text-zinc-400 font-bold">STRIKE</th>
                  <th className="px-4 py-3 text-right text-zinc-400">PUT BID</th>
                  <th className="px-4 py-3 text-right text-zinc-400">PUT ASK</th>
                  <th className="px-4 py-3 text-center text-zinc-400">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {optionChain.map((option) => (
                  <tr key={option.strikePrice} className="hover:bg-zinc-800/50 transition">
                    <td className="px-4 py-3 text-zinc-300">₹{option.callBid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">₹{option.callAsk.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-bold text-zinc-100">{option.strikePrice}</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">₹{option.putBid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-zinc-300">₹{option.putAsk.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center space-x-2 flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedOption({ type: 'CALL', strike: option.strikePrice })}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          selectedOption?.type === 'CALL' && selectedOption?.strike === option.strikePrice
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 text-emerald-400 hover:bg-emerald-600/20'
                        }`}
                      >
                        CALL
                      </button>
                      <button
                        onClick={() => setSelectedOption({ type: 'PUT', strike: option.strikePrice })}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          selectedOption?.type === 'PUT' && selectedOption?.strike === option.strikePrice
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-800 text-red-400 hover:bg-red-600/20'
                        }`}
                      >
                        PUT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Trading Section */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Stock Trading</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <label className="text-xs text-zinc-500 mb-2 block">Quantity (Shares)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-zinc-700 border border-zinc-600 text-zinc-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Cost (Buy)</p>
            <p className="text-2xl font-bold text-blue-400">₹{(quote?.ask * quantity).toFixed(2)}</p>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 mb-1">Selling Price</p>
            <p className="text-2xl font-bold text-emerald-400">₹{(quote?.bid * quantity).toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handlePlaceOrder('BUY')}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
          >
            Buy {quantity} Shares
          </button>
          <button
            onClick={() => handlePlaceOrder('SELL')}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
          >
            Sell {quantity} Shares
          </button>
        </div>
      </div>

      {/* Options Trading Section */}
      {selectedOption && (
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-purple-300">Options Trading</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Selected Option</p>
              <p className="text-2xl font-bold text-zinc-100">
                {selectedOption.strike} {selectedOption.type}
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <label className="text-xs text-zinc-500 mb-2 block">Contracts</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-700 border border-zinc-600 text-zinc-100 rounded px-3 py-2"
              />
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">Premium</p>
              <p className="text-2xl font-bold text-purple-400">₹{(100 * quantity).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              className={`flex-1 px-6 py-3 ${
                selectedOption.type === 'CALL'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-zinc-700 opacity-50 cursor-not-allowed'
              } text-white rounded-lg font-semibold transition`}
              disabled={selectedOption.type !== 'CALL'}
            >
              Buy Call
            </button>
            <button
              onClick={() => handlePlaceOrder('PUT')}
              className={`flex-1 px-6 py-3 ${
                selectedOption.type === 'PUT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-zinc-700 opacity-50 cursor-not-allowed'
              } text-white rounded-lg font-semibold transition`}
              disabled={selectedOption.type !== 'PUT'}
            >
              Buy Put
            </button>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={fetchQuote}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>

        <button
          onClick={() => setShowOrders(!showOrders)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition relative"
        >
          Order Book
          {orders.filter(o => o.status === 'ACTIVE').length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {orders.filter(o => o.status === 'ACTIVE').length}
            </span>
          )}
        </button>
      </div>

      {/* Active Orders Panel */}
      {showOrders && (
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-300">Order Book</h2>
            <button
              onClick={() => setShowOrders(false)}
              className="text-purple-400 hover:text-purple-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No orders placed yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderDetail(order)}
                  className={`p-4 rounded-lg border cursor-pointer transition hover:scale-105 ${
                    order.status === 'ACTIVE'
                      ? 'bg-zinc-800/50 border-emerald-600 hover:bg-zinc-700/50'
                      : 'bg-zinc-800/30 border-zinc-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          order.type === 'CALL' ? 'bg-emerald-600/30 text-emerald-400' :
                          order.type === 'PUT' ? 'bg-red-600/30 text-red-400' :
                          order.type === 'BUY' ? 'bg-blue-600/30 text-blue-400' :
                          'bg-orange-600/30 text-orange-400'
                        }`}>
                          {order.type}
                        </span>
                        <span className="text-sm text-zinc-300 font-semibold">
                          {order.symbol} x{order.quantity}
                        </span>
                        {order.strike && (
                          <span className="text-xs text-zinc-400">@{order.strike}</span>
                        )}
                        <span className={`text-xs font-bold ml-auto ${
                          order.status === 'ACTIVE' ? 'text-emerald-400' : 'text-zinc-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>₹{order.price.toFixed(2)} × {order.quantity}</span>
                        <span className="font-semibold text-zinc-300">
                          Total: ₹{order.totalValue.toFixed(2)}
                        </span>
                        <span>{order.mode === 'paper' ? 'Demo' : 'Real'}</span>
                        <span>
                          {order.timestamp.toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>

                    {order.status === 'ACTIVE' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="ml-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                        title="Cancel Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order Statistics */}
          {orders.length > 0 && (
            <div className="pt-4 border-t border-purple-700 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">ACTIVE ORDERS</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {orders.filter(o => o.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">CANCELLED</p>
                <p className="text-2xl font-bold text-red-400">
                  {orders.filter(o => o.status === 'CANCELLED').length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">TOTAL VALUE</p>
                <p className="text-2xl font-bold text-blue-400">
                  ₹{orders.filter(o => o.status === 'ACTIVE').reduce((sum, o) => sum + o.totalValue, 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 max-w-2xl w-full mx-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">📊 Order Details</h2>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-zinc-800/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                    selectedOrderDetail.type === 'CALL' ? 'bg-emerald-600/30 text-emerald-400' :
                    selectedOrderDetail.type === 'PUT' ? 'bg-red-600/30 text-red-400' :
                    selectedOrderDetail.type === 'BUY' ? 'bg-blue-600/30 text-blue-400' :
                    'bg-orange-600/30 text-orange-400'
                  }`}>
                    {selectedOrderDetail.type}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedOrderDetail.symbol}</h3>
                    <p className="text-sm text-zinc-400">{selectedOrderDetail.timestamp.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold ${
                  selectedOrderDetail.status === 'ACTIVE' ? 'bg-emerald-600/30 text-emerald-400' :
                  'bg-zinc-700/30 text-zinc-400'
                }`}>
                  {selectedOrderDetail.status}
                </div>
              </div>
            </div>

            {/* Trading Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-2">Entry Price</p>
                <p className="text-3xl font-bold text-white">₹{selectedOrderDetail.price.toFixed(2)}</p>
              </div>

              <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                <p className="text-sm text-purple-300 mb-2">Quantity</p>
                <p className="text-3xl font-bold text-white">{selectedOrderDetail.quantity}</p>
              </div>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-2">Total Invested</p>
                <p className="text-3xl font-bold text-white">₹{selectedOrderDetail.totalValue.toFixed(2)}</p>
              </div>

              <div className={`rounded-lg p-4 border ${
                selectedOrderDetail.type === 'SELL' ? 'bg-orange-900/30 border-orange-700' : 'bg-emerald-900/30 border-emerald-700'
              }`}>
                <p className={`text-sm mb-2 ${selectedOrderDetail.type === 'SELL' ? 'text-orange-300' : 'text-emerald-300'}`}>
                  Trading Mode
                </p>
                <p className={`text-3xl font-bold ${selectedOrderDetail.type === 'SELL' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {selectedOrderDetail.mode === 'paper' ? 'Demo' : 'Real'}
                </p>
              </div>
            </div>

            {/* Current Market Values */}
            <div className="space-y-3 border-t border-zinc-700 pt-6">
              <h3 className="text-lg font-bold text-white">Current Market Price</h3>
              {selectedOrderDetail.type === 'BUY' && quote && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                    <p className="text-sm text-emerald-300 mb-2">Current Price</p>
                    <p className="text-3xl font-bold text-emerald-400">₹{quote.ltp.toFixed(2)}</p>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-2">Current Value</p>
                    <p className="text-3xl font-bold text-white">₹{(quote.ltp * selectedOrderDetail.quantity).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {selectedOrderDetail.type !== 'BUY' && (
                <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                  <p className="text-sm text-emerald-300 mb-2">Current Premium</p>
                  <p className="text-3xl font-bold text-emerald-400">₹100</p>
                </div>
              )}
            </div>

            {/* P&L Calculation */}
            <div className="space-y-3 border-t border-zinc-700 pt-6">
              <h3 className="text-lg font-bold text-white">Profit & Loss</h3>
              
              {selectedOrderDetail.type === 'BUY' && quote && (() => {
                const currentValue = quote.ltp * selectedOrderDetail.quantity;
                const entryValue = selectedOrderDetail.totalValue;
                const pl = currentValue - entryValue;
                const plPercent = (pl / entryValue) * 100;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">ENTRY VALUE</p>
                        <p className="text-2xl font-bold text-zinc-300">₹{entryValue.toFixed(2)}</p>
                      </div>

                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-xs text-zinc-400 mb-1">CURRENT VALUE</p>
                        <p className="text-2xl font-bold text-emerald-400">₹{currentValue.toFixed(2)}</p>
                      </div>

                      <div className={`rounded-lg p-4 ${pl >= 0 ? 'bg-emerald-600/30' : 'bg-red-600/30'}`}>
                        <p className={`text-xs mb-1 ${pl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>P&L (₹)</p>
                        <p className={`text-2xl font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className={`rounded-lg p-6 text-center ${pl >= 0 ? 'bg-emerald-600/20 border border-emerald-600' : 'bg-red-600/20 border border-red-600'}`}>
                      <p className={`text-sm mb-2 ${pl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Return Percentage</p>
                      <p className={`text-5xl font-bold ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                      </p>
                      <p className={`text-sm mt-2 ${pl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {pl >= 0 ? 'PROFIT' : 'LOSS'} - {Math.abs(pl).toFixed(2)} per share
                      </p>
                    </div>
                  </div>
                );
              })()}

              {selectedOrderDetail.type !== 'BUY' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-xs text-zinc-400 mb-1">PREMIUM PAID</p>
                      <p className="text-2xl font-bold text-zinc-300">₹{selectedOrderDetail.totalValue.toFixed(2)}</p>
                    </div>

                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-xs text-zinc-400 mb-1">CURRENT VALUE</p>
                      <p className="text-2xl font-bold text-emerald-400">₹{(100 * selectedOrderDetail.quantity).toFixed(2)}</p>
                    </div>

                    <div className="bg-emerald-600/30 rounded-lg p-4">
                      <p className="text-xs text-emerald-300 mb-1">P&L (₹)</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        +{((100 * selectedOrderDetail.quantity) - selectedOrderDetail.totalValue).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-600/20 border border-emerald-600 rounded-lg p-6 text-center">
                    <p className="text-sm text-emerald-300 mb-2">Break Even Price</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      ₹{(selectedOrderDetail.totalValue / selectedOrderDetail.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-zinc-700">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
              >
                Close
              </button>
              {selectedOrderDetail.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    cancelOrder(selectedOrderDetail.id);
                    setSelectedOrderDetail(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
