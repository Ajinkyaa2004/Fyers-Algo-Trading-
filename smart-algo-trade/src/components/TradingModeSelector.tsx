import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useTradingMode } from '../context/TradingModeContext';

export const TradingModeSelector = () => {
  const { isPaperTrading, toggleTradingMode, tradingMode } = useTradingMode();

  return (
    <div className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700 px-6 py-4 sticky top-0 z-40">
      <div className="mx-auto w-full flex items-center justify-between px-6">
        {/* Trading Mode Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {isPaperTrading ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-yellow-400">PAPER TRADING (DEMO)</span>
                  <span className="text-xs text-yellow-300">Safe Testing Mode</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="font-bold text-red-400">⚠️ LIVE TRADING (REAL MONEY)</span>
                  <span className="text-xs text-red-300">Real Capital at Risk</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-zinc-400">
              {isPaperTrading 
                ? '💰 Trading with Demo Money (₹10,000)' 
                : '⚠️ Trading with REAL Money'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {isPaperTrading 
                ? 'No real capital at risk' 
                : 'Real capital WILL be charged'}
            </p>
          </div>

          <button
            onClick={toggleTradingMode}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 ${
              isPaperTrading
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <span
              className={`inline-flex h-10 w-10 transform items-center justify-center rounded-full bg-white transition-transform duration-300 ${
                isPaperTrading ? 'translate-x-1' : 'translate-x-12'
              }`}
            >
              {isPaperTrading ? (
                <CheckCircle2 className="w-6 h-6 text-yellow-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {isPaperTrading ? 'DEMO' : 'REAL'}
            </span>
          </button>
        </div>

        {/* Quick Info */}
        <div className="text-xs text-zinc-400 text-right">
          <p>Mode: <span className="font-mono font-bold">{tradingMode}</span></p>
          <p>Portfolio: <span className="font-mono text-cyan-400">₹468,832</span></p>
        </div>
      </div>

      {/* Warning Banner for Live Trading */}
      {!isPaperTrading && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-red-400">⚠️ LIVE TRADING ACTIVE</p>
            <p className="text-red-300 text-xs mt-1">
              You are trading with REAL money. All executed orders will affect your actual trading account and real capital will be debited/credited. Proceed with caution!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
