import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface OptionChain {
  symbol: string;
  strikePrice: number;
  callBid: number;
  callAsk: number;
  callVolume: number;
  callOI: number;
  putBid: number;
  putAsk: number;
  putVolume: number;
  putOI: number;
  iv: number;
}

interface SelectedOption {
  type: 'CALL' | 'PUT';
  strikePrice: number;
  price: number;
}

export const OptionsTrading: React.FC = () => {
  const [baseSymbol, setBaseSymbol] = useState('NSE:NIFTY50-INDEX');
  const [optionChain, setOptionChain] = useState<OptionChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const symbols = [
    'NSE:NIFTY50-INDEX',
    'NSE:BANKNIFTY-INDEX',
    'NSE:NIFTYNXT50-INDEX'
  ];

  // Generate mock option chain data for demonstration
  const generateOptionChain = () => {
    setLoading(true);
    const basePrices = {
      'NSE:NIFTY50-INDEX': 23500,
      'NSE:BANKNIFTY-INDEX': 47000,
      'NSE:NIFTYNXT50-INDEX': 14500
    };
    
    const basePrice = basePrices[baseSymbol as keyof typeof basePrices] || 23500;
    const strikes = [];
    
    // Generate 5 strikes around current price
    for (let i = -2; i <= 2; i++) {
      const strike = basePrice + (i * 100);
      const atm = basePrice;
      const distance = Math.abs(strike - atm);
      
      // Simplified option pricing
      const callPrice = Math.max(Math.abs(atm - strike), 10 + (100 - distance * 0.1));
      const putPrice = Math.max(Math.abs(strike - atm), 10 + (100 - distance * 0.1));
      const iv = 18 - (distance * 0.02);
      
      strikes.push({
        symbol: baseSymbol,
        strikePrice: strike,
        callBid: callPrice - 5,
        callAsk: callPrice + 5,
        callVolume: Math.floor(Math.random() * 10000) + 1000,
        callOI: Math.floor(Math.random() * 500000) + 50000,
        putBid: putPrice - 5,
        putAsk: putPrice + 5,
        putVolume: Math.floor(Math.random() * 10000) + 1000,
        putOI: Math.floor(Math.random() * 500000) + 50000,
        iv: Math.max(iv, 8)
      });
    }
    
    setOptionChain(strikes);
    setLoading(false);
  };

  useEffect(() => {
    generateOptionChain();
  }, [baseSymbol]);

  const handleSelectOption = (strike: number, type: 'CALL' | 'PUT') => {
    const option = optionChain.find(o => o.strikePrice === strike);
    if (option) {
      const price = type === 'CALL' ? option.callAsk : option.putAsk;
      setSelectedOption({ type, strikePrice: strike, price });
      setOrderPlaced(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedOption) return;

    try {
      const orderData = {
        symbol: `${baseSymbol}${selectedOption.strikePrice}${selectedOption.type}`,
        qty: quantity,
        type: 1, // Market order
        side: 1, // Buy
        productType: 'INTRADAY',
        limitPrice: 0,
        stopPrice: 0,
        disclosedQty: 0,
        validity: 'DAY',
        offlineOrder: false
      };

      const response = await fetch('http://127.0.0.1:8001/api/portfolio/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setOrderPlaced(true);
        setTimeout(() => setOrderPlaced(false), 3000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const premiumCost = selectedOption ? selectedOption.price * quantity * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Options Trading</h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm text-zinc-400">Select Index:</label>
            <select
              value={baseSymbol}
              onChange={(e) => setBaseSymbol(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {symbols.map(sym => (
                <option key={sym} value={sym}>
                  {sym.split(':')[1]?.replace('-INDEX', '') || sym}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateOptionChain}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/50 border-b border-zinc-700">
              <tr>
                <th className="px-4 py-3 text-left text-zinc-400 font-semibold">CALL BID</th>
                <th className="px-4 py-3 text-left text-zinc-400 font-semibold">CALL ASK</th>
                <th className="px-4 py-3 text-center text-zinc-400 font-semibold">STRIKE</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-semibold">PUT BID</th>
                <th className="px-4 py-3 text-right text-zinc-400 font-semibold">PUT ASK</th>
                <th className="px-4 py-3 text-center text-zinc-400 font-semibold">IV</th>
                <th className="px-4 py-3 text-center text-zinc-400 font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {optionChain.map((option) => (
                <tr key={option.strikePrice} className="hover:bg-zinc-800/50 transition">
                  {/* Call Side */}
                  <td className="px-4 py-3 text-zinc-300">₹{option.callBid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">₹{option.callAsk.toFixed(2)}</td>

                  {/* Strike Price */}
                  <td className="px-4 py-3 text-center font-bold text-zinc-100">
                    {option.strikePrice}
                  </td>

                  {/* Put Side */}
                  <td className="px-4 py-3 text-red-400 font-semibold">₹{option.putBid.toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-300">₹{option.putAsk.toFixed(2)}</td>

                  {/* IV */}
                  <td className="px-4 py-3 text-center text-zinc-400">{option.iv.toFixed(1)}%</td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3 text-center space-x-2 flex justify-center gap-2">
                    <button
                      onClick={() => handleSelectOption(option.strikePrice, 'CALL')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${
                        selectedOption?.type === 'CALL' && selectedOption?.strikePrice === option.strikePrice
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-emerald-400 hover:bg-emerald-600/20'
                      }`}
                    >
                      CALL
                    </button>
                    <button
                      onClick={() => handleSelectOption(option.strikePrice, 'PUT')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${
                        selectedOption?.type === 'PUT' && selectedOption?.strikePrice === option.strikePrice
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

      {/* Selected Option Details & Order Form */}
      {selectedOption && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option Details */}
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">SELECTED OPTION</p>
              <p className="text-lg font-bold text-zinc-100">
                {selectedOption.strikePrice} {selectedOption.type}
              </p>
              <p className={`text-sm font-semibold mt-2 ${selectedOption.type === 'CALL' ? 'text-emerald-400' : 'text-red-400'}`}>
                Premium: ₹{selectedOption.price.toFixed(2)}
              </p>
            </div>

            {/* Order Details */}
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <label className="text-xs text-zinc-500 mb-2 block">QUANTITY (CONTRACTS)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-700 border border-zinc-600 text-zinc-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-400 mt-2">100 shares per contract</p>
            </div>

            {/* Total Cost */}
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 mb-1">TOTAL PREMIUM</p>
              <p className="text-2xl font-bold text-blue-400">
                ₹{premiumCost.toFixed(2)}
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                {quantity} contract(s) × {selectedOption.price.toFixed(2)} × 100
              </p>
            </div>
          </div>

          {/* Place Order Button */}
          <div className="flex gap-4">
            <button
              onClick={handlePlaceOrder}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                selectedOption.type === 'CALL'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Place {selectedOption.type} Order
            </button>

            <button
              onClick={() => setSelectedOption(null)}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          </div>

          {orderPlaced && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 text-emerald-300 text-center">
              Order placed successfully!
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {!selectedOption && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-blue-300 text-center">
          Click CALL or PUT button on any strike to select an option and place an order
        </div>
      )}
    </div>
  );
};
