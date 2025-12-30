import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, Clock, CheckCircle, XCircle } from 'lucide-react';

interface MarketStatus {
  exchange: string;
  segment: string;
  market_type: string;
  status: string;
  open_time?: string;
  close_time?: string;
}

const MarketStatus: React.FC = () => {
  const [markets, setMarkets] = useState<MarketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchMarketStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('/api/market/market-status');
      if (!response.ok) throw new Error('Failed to fetch market status');

      const data = await response.json();
      if (data.status === 'success') {
        setMarkets(data.data);
        setLastUpdated(new Date());
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'CLOSE':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'CLOSE':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getSegmentBadge = (segment: string) => {
    const badgeColors: { [key: string]: string } = {
      'E': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'D': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'C': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'M': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    };

    const labels: { [key: string]: string } = {
      'E': 'Equity',
      'D': 'Derivatives',
      'C': 'Currency',
      'M': 'Commodity',
    };

    const color = badgeColors[segment] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    const label = labels[segment] || segment;

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-700 bg-gray-900 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-white font-semibold text-lg">
                <Clock className="h-5 w-5" />
                Market Status
              </h3>
              <p className="text-sm text-gray-400 mt-1">Real-time market open/close status</p>
            </div>
            <button
              onClick={fetchMarketStatus}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {error ? (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : markets.length > 0 ? (
            <div className="space-y-4">
              {/* Last Updated */}
              {lastUpdated && (
                <p className="text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}

              {/* Markets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.map((market, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-all ${getStatusColor(market.status)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white text-lg">{market.exchange}</p>
                        <p className="text-xs text-gray-300">{market.market_type || 'Normal'}</p>
                      </div>
                      {getStatusIcon(market.status)}
                    </div>

                    <div className="space-y-2">
                      {getSegmentBadge(market.segment)}

                      <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
                        <span className="text-sm">Status:</span>
                        <span className="font-semibold uppercase text-sm">
                          {market.status}
                        </span>
                      </div>

                      {market.open_time && (
                        <div className="text-xs text-gray-300">
                          <p>Opens: {market.open_time}</p>
                        </div>
                      )}

                      {market.close_time && (
                        <div className="text-xs text-gray-300">
                          <p>Closes: {market.close_time}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="pt-4 border-t border-gray-700 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Open Markets</p>
                    <p className="text-2xl font-bold text-green-400">
                      {markets.filter(m => m.status?.toUpperCase() === 'OPEN').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Closed Markets</p>
                    <p className="text-2xl font-bold text-red-400">
                      {markets.filter(m => m.status?.toUpperCase() === 'CLOSE').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {markets.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No market status data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketStatus;
