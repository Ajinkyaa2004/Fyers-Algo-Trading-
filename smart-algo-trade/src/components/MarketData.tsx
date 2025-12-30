import { useState } from 'react';
import { Search, BarChart3 } from 'lucide-react';

interface Quote {
  n?: string;
  ltp?: number;
  ltq?: number;
  ltt?: number;
  bid?: number;
  bidsz?: number;
  ask?: number;
  asksz?: number;
  depth?: any;
  o?: number;
}

interface DepthData {
  bid?: Array<[number, number]>;
  ask?: Array<[number, number]>;
}

interface HistoryCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export const MarketData = () => {
  const [searchSymbol, setSearchSymbol] = useState('NSE:SBIN-EQ');
  const [quotes, setQuotes] = useState<Record<string, Quote> | null>(null);
  const [depth, setDepth] = useState<DepthData | null>(null);
  const [history, setHistory] = useState<HistoryCandle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch quotes
      const quotesRes = await fetch(`http://127.0.0.1:8001/api/portfolio/quotes?symbols=${searchSymbol}`);
      const quotesData = await quotesRes.json();
      if (quotesData.status === 'success') {
        setQuotes(quotesData.data);
      }

      // Fetch depth
      const depthRes = await fetch(`http://127.0.0.1:8001/api/portfolio/depth?symbol=${searchSymbol}`);
      const depthData = await depthRes.json();
      if (depthData.status === 'success') {
        setDepth(depthData.data);
      }

      // Fetch history (last 30 days)
      const historyRes = await fetch(`http://127.0.0.1:8001/api/portfolio/history?symbol=${searchSymbol}&resolution=D`);
      const historyData = await historyRes.json();
      if (historyData.status === 'success') {
        setHistory(historyData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quote = quotes?.[searchSymbol];
  const change = quote ? ((quote.ltp! - (quote.o || quote.ltp!)) / (quote.o || quote.ltp!)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="Enter symbol (e.g., NSE:SBIN-EQ)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 placeholder-zinc-500 font-mono"
            />
            <button
              onClick={fetchMarketData}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>

      {/* Quote Card */}
      {quote && (
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">{quote.n || searchSymbol}</h2>
              <p className="text-zinc-500 text-sm mt-1">LTP: {quote.ltp}</p>
            </div>
            <div className={`text-3xl font-bold ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-sm mb-1">Bid Price</p>
              <p className="text-lg font-semibold text-zinc-100">{quote.bid?.toFixed(2) || '-'}</p>
              <p className="text-xs text-zinc-600 mt-1">Qty: {quote.bidsz || 0}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-sm mb-1">Ask Price</p>
              <p className="text-lg font-semibold text-zinc-100">{quote.ask?.toFixed(2) || '-'}</p>
              <p className="text-xs text-zinc-600 mt-1">Qty: {quote.asksz || 0}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-sm mb-1">Last Traded Qty</p>
              <p className="text-lg font-semibold text-zinc-100">{quote.ltq || '-'}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-500 text-sm mb-1">Last Traded Time</p>
              <p className="text-xs font-semibold text-zinc-100">
                {quote.ltt ? new Date(quote.ltt * 1000).toLocaleTimeString() : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Depth Chart */}
      {depth && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Depth
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Bid Side */}
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase">Bid (Buy Orders)</h4>
              <div className="space-y-2">
                {depth.bid?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{item[0]}</span>
                    <span className="text-zinc-100">{item[1]} qty</span>
                  </div>
                )) || <p className="text-zinc-500">No bid data</p>}
              </div>
            </div>

            {/* Ask Side */}
            <div>
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 uppercase">Ask (Sell Orders)</h4>
              <div className="space-y-2">
                {depth.ask?.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{item[0]}</span>
                    <span className="text-zinc-100">{item[1]} qty</span>
                  </div>
                )) || <p className="text-zinc-500">No ask data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Chart */}
      {history.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Price History (Last 30 Days)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-400">Date</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-400">Open</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-400">High</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-400">Low</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-400">Close</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-400">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {history.slice(-10).reverse().map((candle, idx) => {
                  const change = candle.c - candle.o;
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-2 text-sm text-zinc-300">
                        {new Date(candle.t * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-zinc-100">
                        {candle.o.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-emerald-500">
                        {candle.h.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-red-500">
                        {candle.l.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-right text-sm font-semibold ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {candle.c.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-zinc-400">
                        {(candle.v / 1000).toFixed(0)}K
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!quotes && !history && !error && (
        <div className="text-center text-zinc-400 py-12">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter a symbol and click Search to view market data</p>
        </div>
      )}
    </div>
  );
};
