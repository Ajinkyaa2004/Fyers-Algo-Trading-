import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface Quote {
  symbol: string;
  ltp: number;
  chp: number;
  ch: number;
  open_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  prev_close_price: number;
}

interface LiveDataDisplayProps {
  onSelectStock?: (symbol: string) => void;
}

export const LiveDataDisplay: React.FC<LiveDataDisplayProps> = ({ onSelectStock }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbols] = useState(['NSE:SBIN-EQ', 'NSE:INFY-EQ', 'NSE:TCS-EQ', 'NSE:RELIANCE-EQ']);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const symbolsParam = selectedSymbols.join(',');
      const response = await fetch(
        `http://127.0.0.1:8001/api/market/quote?symbols=${encodeURIComponent(symbolsParam)}`
      );
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const quotesData = data.data.map((item: any) => {
          const v = item.v;
          return {
            symbol: v.symbol,
            ltp: v.lp,
            chp: v.chp,
            ch: v.ch,
            open_price: v.open_price,
            high_price: v.high_price,
            low_price: v.low_price,
            volume: v.volume,
            prev_close_price: v.prev_close_price
          };
        });
        setQuotes(quotesData);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchQuotes, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-zinc-400 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading live data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">Live Market Data</h2>
        <button
          onClick={fetchQuotes}
          className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quotes.map((quote) => {
          const isPositive = quote.ch >= 0;
          const shortName = quote.symbol.split(':')[1]?.replace('-EQ', '') || quote.symbol;

          return (
            <div
              key={quote.symbol}
              onClick={() => onSelectStock && onSelectStock(quote.symbol)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-100">{shortName}</h3>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition" />
                </div>
              </div>

              <div className="mb-3">
                <p className="text-2xl font-bold text-zinc-100">₹{quote.ltp.toFixed(2)}</p>
                <p className={`text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{quote.ch.toFixed(2)} ({quote.chp.toFixed(2)}%)
                </p>
              </div>

              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Open:</span>
                  <span className="text-zinc-300">₹{quote.open_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>High:</span>
                  <span className="text-emerald-400">₹{quote.high_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low:</span>
                  <span className="text-red-400">₹{quote.low_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="text-zinc-300">{(quote.volume / 1000).toFixed(0)}K</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-700/50 text-xs text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition">
                Click to view chart →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
