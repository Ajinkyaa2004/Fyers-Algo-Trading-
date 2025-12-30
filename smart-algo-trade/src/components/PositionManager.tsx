import { useState } from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  qty: number;
  side: number;
  type: string;
}

export const PositionManager = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [convertFrom, setConvertFrom] = useState('INTRADAY');
  const [convertTo, setConvertTo] = useState('CNC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fetchedPositions, setFetchedPositions] = useState(false);

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/portfolio/positions');
      const data = await response.json();
      if (data.status === 'success') {
        const positionsList = data.data.net || [];
        setPositions(positionsList);
        setFetchedPositions(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  const convertPosition = async () => {
    if (!selectedPosition) {
      setError('Please select a position');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find the selected position details
      const position = positions.find((p) => p.symbol === selectedPosition);
      if (!position) {
        setError('Position not found');
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8001/api/portfolio/convert-position?` +
        `symbol=${selectedPosition}&` +
        `position_side=${position.side}&` +
        `convert_qty=${position.qty}&` +
        `convert_from=${convertFrom}&` +
        `convert_to=${convertTo}`,
        { method: 'POST' }
      );

      const result = await response.json();
      if (result.status === 'success') {
        setSuccess(`Position converted from ${convertFrom} to ${convertTo}`);
        setSelectedPosition(null);
        setTimeout(() => fetchPositions(), 1000);
      } else {
        setError(result.detail || 'Failed to convert position');
      }
    } catch (err: any) {
      setError(err.message || 'Error converting position');
    } finally {
      setLoading(false);
    }
  };

  const exitPosition = async (positionId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8001/api/portfolio/exit-positions?position_id=${positionId}`,
        { method: 'POST' }
      );

      const result = await response.json();
      if (result.status === 'success') {
        setSuccess(`Position ${positionId} exited successfully`);
        setTimeout(() => fetchPositions(), 1000);
      } else {
        setError(result.detail || 'Failed to exit position');
      }
    } catch (err: any) {
      setError(err.message || 'Error exiting position');
    } finally {
      setLoading(false);
    }
  };

  const exitAllPositions = async () => {
    if (!confirm('Are you sure you want to exit ALL positions?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        'http://127.0.0.1:8001/api/portfolio/exit-positions',
        { method: 'POST' }
      );

      const result = await response.json();
      if (result.status === 'success') {
        setSuccess('All positions exited successfully');
        setPositions([]);
        setFetchedPositions(false);
      } else {
        setError(result.detail || 'Failed to exit all positions');
      }
    } catch (err: any) {
      setError(err.message || 'Error exiting positions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Position Converter */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Convert Position
        </h2>

        <div className="space-y-4">
          {/* Fetch Positions Button */}
          {!fetchedPositions ? (
            <button
              onClick={fetchPositions}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Open Positions'}
            </button>
          ) : null}

          {/* Position Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Select Position
            </label>
            <select
              value={selectedPosition || ''}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Position --</option>
              {positions.map((pos) => (
                <option key={pos.symbol} value={pos.symbol}>
                  {pos.symbol} ({pos.qty} qty, Side: {pos.side === 1 ? 'Long' : 'Short'})
                </option>
              ))}
            </select>
          </div>

          {/* Convert From */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Convert From
            </label>
            <select
              value={convertFrom}
              onChange={(e) => setConvertFrom(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option>INTRADAY</option>
              <option>CNC</option>
              <option>MTF</option>
            </select>
          </div>

          {/* Convert To */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Convert To
            </label>
            <select
              value={convertTo}
              onChange={(e) => setConvertTo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option>CNC</option>
              <option>INTRADAY</option>
              <option>MTF</option>
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
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-400">{success}</p>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={convertPosition}
            disabled={loading || !selectedPosition}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Converting...' : 'Convert Position'}
          </button>
        </div>
      </div>

      {/* Position Exit */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">Exit Positions</h2>

        <div className="space-y-3 mb-6">
          {positions.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              {fetchedPositions ? 'No open positions' : 'Load positions to see options'}
            </p>
          ) : (
            positions.map((pos) => (
              <div
                key={pos.symbol}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
              >
                <div>
                  <p className="font-mono text-zinc-100 font-semibold">{pos.symbol}</p>
                  <p className="text-sm text-zinc-400">
                    Qty: {pos.qty} | Side: {pos.side === 1 ? 'Long' : 'Short'}
                  </p>
                </div>
                <button
                  onClick={() => exitPosition(pos.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  Exit
                </button>
              </div>
            ))
          )}
        </div>

        {positions.length > 0 && (
          <button
            onClick={exitAllPositions}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Exiting...' : 'Exit All Positions'}
          </button>
        )}

        <p className="text-xs text-zinc-500 text-center mt-4">
          ⚠ Exiting positions will close all your open trades
        </p>
      </div>
    </div>
  );
};
