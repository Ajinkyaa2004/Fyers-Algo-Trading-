import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Volume2 } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  bid_qty: number;
  ask_qty: number;
  timestamp: string;
  ma_20?: number;
  ma_50?: number;
  rsi?: number;
  macd?: number;
}

const LiveMarketDataView: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [sortBy, setSortBy] = useState<'change' | 'symbol' | 'price' | 'volume'>('change');
  const [filterType, setFilterType] = useState<'all' | 'gainers' | 'losers'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(false);

  // Popular stocks
  const stocks = [
    'NSE:NIFTY50-IDX',
    'NSE:SBIN-EQ',
    'NSE:INFY-EQ',
    'NSE:TCS-EQ',
    'NSE:RELIANCE-EQ',
    'NSE:HDFC-EQ',
    'NSE:MARUTI-EQ',
    'NSE:WIPRO-EQ',
    'NSE:LT-EQ',
    'NSE:BAJAJFINSV-EQ',
    'NSE:HDFCBANK-EQ',
    'NSE:ITC-EQ',
    'NSE:ADANIPORTS-EQ',
    'NSE:SUNPHARMA-EQ',
    'NSE:AIRTEL-EQ',
    'NSE:ASIANPAINT-EQ',
  ];

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      // Fetch from real backend API
      const response = await fetch('http://127.0.0.1:8001/api/market/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: stocks })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const result = await response.json();
      const data: MarketData[] = [];

      if (result.status === 'success' && result.data) {
        // Map real API data to MarketData format
        Object.values(result.data).forEach((item: any) => {
          if (item && typeof item === 'object') {
            data.push({
              symbol: item.symbol || item.n || '',
              price: parseFloat((item.ltp || item.ltq || 0).toFixed(2)),
              previousClose: parseFloat((item.pclose || 0).toFixed(2)),
              high: parseFloat((item.high || item.h || 0).toFixed(2)),
              low: parseFloat((item.low || item.l || 0).toFixed(2)),
              volume: item.volume || item.v || 0,
              change: parseFloat(((item.ltp || 0) - (item.pclose || 0)).toFixed(2)),
              changePercent: parseFloat((((item.ltp || 0) - (item.pclose || 0)) / (item.pclose || 1) * 100).toFixed(2)),
              bid: parseFloat((item.bid || item.b || (item.ltp || 0)).toFixed(2)),
              ask: parseFloat((item.ask || item.a || (item.ltp || 0)).toFixed(2)),
              bid_qty: item.bidQty || item.bq || 0,
              ask_qty: item.askQty || item.aq || 0,
              timestamp: new Date().toLocaleTimeString(),
              ma_20: parseFloat((item.ma20 || 0).toFixed(2)),
              ma_50: parseFloat((item.ma50 || 0).toFixed(2)),
              rsi: parseFloat((item.rsi || 0).toFixed(2)),
              macd: parseFloat((item.macd || 0).toFixed(4)),
            });
          }
        });
      }

      // Sort based on current selection
      const sorted = sortData(data);
      setMarketData(sorted);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoading(false);
    }
  };

  const sortData = (data: MarketData[]) => {
    let sorted = [...data];

    // Filter first
    if (filterType === 'gainers') {
      sorted = sorted.filter((d) => d.changePercent > 0);
    } else if (filterType === 'losers') {
      sorted = sorted.filter((d) => d.changePercent < 0);
    }

    // Search filter
    if (searchTerm) {
      sorted = sorted.filter((d) =>
        d.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'change':
        sorted.sort((a, b) => b.changePercent - a.changePercent);
        break;
      case 'price':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume - a.volume);
        break;
      case 'symbol':
        sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
    }

    return sorted;
  };

  const filteredData = sortData(marketData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="mx-auto w-full p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">📈 Live Market Data</h1>
              <p className="text-slate-400">Real-time prices, volume & technical indicators</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">Last Updated:</p>
              <p className="text-white font-mono text-lg">{lastUpdated}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchMarketData();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-2 ml-auto"
              >
                <RefreshCw className="h-5 w-5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Market Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Gainers',
                value: filteredData.filter((d) => d.changePercent > 0).length,
                color: 'text-green-400',
                bg: 'bg-green-900/20',
              },
              {
                label: 'Losers',
                value: filteredData.filter((d) => d.changePercent < 0).length,
                color: 'text-red-400',
                bg: 'bg-red-900/20',
              },
              {
                label: 'Avg Change',
                value:
                  (filteredData.reduce((sum, d) => sum + d.changePercent, 0) / filteredData.length).toFixed(2) + '%',
                color: 'text-blue-400',
                bg: 'bg-blue-900/20',
              },
              {
                label: 'Total Volume',
                value: (
                  filteredData.reduce((sum, d) => sum + d.volume, 0) / 1000000
                ).toFixed(0) + 'M',
                color: 'text-purple-400',
                bg: 'bg-purple-900/20',
              },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} rounded-lg p-4 border border-slate-700`}>
                <p className="text-slate-400 text-sm font-semibold mb-2">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search symbol (e.g., SBIN, INFY)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded placeholder-slate-400"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2">
              <span className="text-white font-semibold">Filter:</span>
              {(['all', 'gainers', 'losers'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                  }}
                  className={`px-4 py-2 rounded font-semibold transition capitalize ${
                    filterType === type
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <span className="text-white font-semibold">Sort:</span>
              {(['change', 'symbol', 'price', 'volume'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSortBy(type)}
                  className={`px-4 py-2 rounded font-semibold transition capitalize ${
                    sortBy === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Market Data Table */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="text-left px-4 py-3 text-slate-300 font-semibold">Symbol</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">Price</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">Change</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">High / Low</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">Bid / Ask</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">Volume</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">MA20 / MA50</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-semibold">RSI</th>
                  <th className="text-center px-4 py-3 text-slate-300 font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((data, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                        data.changePercent > 0 ? 'bg-green-900/10' : 'bg-red-900/10'
                      }`}
                    >
                      {/* Symbol */}
                      <td className="px-4 py-3">
                        <p className="text-white font-semibold">{data.symbol}</p>
                        <p className="text-slate-400 text-xs">
                          {data.timestamp}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="text-right px-4 py-3">
                        <p className="text-white font-bold">₹{data.price.toFixed(2)}</p>
                        <p className="text-slate-400 text-xs">
                          Prev: ₹{data.previousClose.toFixed(2)}
                        </p>
                      </td>

                      {/* Change */}
                      <td className="text-right px-4 py-3">
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            data.changePercent > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {data.changePercent > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-bold">
                            {data.changePercent > 0 ? '+' : ''}
                            {data.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          {data.changePercent > 0 ? '+' : ''}₹{data.change.toFixed(2)}
                        </p>
                      </td>

                      {/* High / Low */}
                      <td className="text-right px-4 py-3">
                        <p className="text-green-400 text-sm">H: ₹{data.high.toFixed(2)}</p>
                        <p className="text-red-400 text-sm">L: ₹{data.low.toFixed(2)}</p>
                      </td>

                      {/* Bid / Ask */}
                      <td className="text-right px-4 py-3">
                        <p className="text-blue-400 text-sm">
                          B: ₹{data.bid.toFixed(2)} ({data.bid_qty})
                        </p>
                        <p className="text-orange-400 text-sm">
                          A: ₹{data.ask.toFixed(2)} ({data.ask_qty})
                        </p>
                      </td>

                      {/* Volume */}
                      <td className="text-right px-4 py-3">
                        <p className="text-white font-semibold">
                          <Volume2 className="h-4 w-4 inline mr-1" />
                          {(data.volume / 1000000).toFixed(2)}M
                        </p>
                      </td>

                      {/* Moving Averages */}
                      <td className="text-right px-4 py-3">
                        <p className="text-purple-400 text-sm">
                          MA20: ₹{data.ma_20?.toFixed(2)}
                        </p>
                        <p className="text-indigo-400 text-sm">
                          MA50: ₹{data.ma_50?.toFixed(2)}
                        </p>
                      </td>

                      {/* RSI */}
                      <td className="text-right px-4 py-3">
                        <p
                          className={`font-bold ${
                            data.rsi && data.rsi > 70
                              ? 'text-red-400'
                              : data.rsi && data.rsi < 30
                                ? 'text-green-400'
                                : 'text-yellow-400'
                          }`}
                        >
                          {data.rsi?.toFixed(2)}
                        </p>
                      </td>

                      {/* Signal */}
                      <td className="text-center px-4 py-3">
                        {data.rsi && data.rsi < 30 ? (
                          <div className="inline-block bg-green-600/30 text-green-300 px-3 py-1 rounded text-xs font-semibold">
                            BUY
                          </div>
                        ) : data.rsi && data.rsi > 70 ? (
                          <div className="inline-block bg-red-600/30 text-red-300 px-3 py-1 rounded text-xs font-semibold">
                            SELL
                          </div>
                        ) : (
                          <div className="inline-block bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded text-xs font-semibold">
                            HOLD
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center px-4 py-8 text-slate-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3">📊 Technical Indicators Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-yellow-400 font-semibold">RSI</span>
              <p className="text-slate-400">
                {"<30: Oversold (Buy) | >70: Overbought (Sell)"}
              </p>
            </div>
            <div>
              <span className="text-purple-400 font-semibold">MA20/MA50</span>
              <p className="text-slate-400">
                Price above = Uptrend, Below = Downtrend
              </p>
            </div>
            <div>
              <span className="text-green-400 font-semibold">High/Low</span>
              <p className="text-slate-400">Daily range of prices</p>
            </div>
            <div>
              <span className="text-blue-400 font-semibold">Volume</span>
              <p className="text-slate-400">Trading activity in millions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMarketDataView;
