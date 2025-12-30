import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TradingModeContextType {
  isPaperTrading: boolean;
  setIsPaperTrading: (value: boolean) => void;
  toggleTradingMode: () => void;
  tradingMode: 'PAPER' | 'LIVE';
}

const TradingModeContext = createContext<TradingModeContextType | undefined>(undefined);

export function TradingModeProvider({ children }: { children: ReactNode }) {
  const [isPaperTrading, setIsPaperTrading] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('tradingMode');
    return saved ? saved === 'PAPER' : true;
  });

  const toggleTradingMode = () => {
    const newMode = !isPaperTrading;
    setIsPaperTrading(newMode);
    localStorage.setItem('tradingMode', newMode ? 'PAPER' : 'LIVE');
  };

  const tradingMode = isPaperTrading ? 'PAPER' : 'LIVE';

  return (
    <TradingModeContext.Provider value={{ isPaperTrading, setIsPaperTrading, toggleTradingMode, tradingMode }}>
      {children}
    </TradingModeContext.Provider>
  );
}

export function useTradingMode() {
  const context = useContext(TradingModeContext);
  if (!context) {
    throw new Error('useTradingMode must be used within TradingModeProvider');
  }
  return context;
}
