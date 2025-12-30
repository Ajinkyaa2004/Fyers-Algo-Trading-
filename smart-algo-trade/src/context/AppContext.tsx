import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Portfolio {
  total_value: number;
  cash_balance: number;
  invested: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

interface AppContextType {
  user: User | null;
  portfolio: Portfolio | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  logout: () => void;
  
  // Portfolio methods
  setPortfolio: (portfolio: Portfolio | null) => void;
  refreshPortfolio: () => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setPortfolio(null);
    setAuthenticated(false);
    localStorage.removeItem('user');
  }, []);

  const refreshPortfolio = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8001/api/portfolio/summary');
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portfolio refresh failed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AppContextType = {
    user,
    portfolio,
    isAuthenticated,
    loading,
    error,
    setUser,
    setAuthenticated,
    logout,
    setPortfolio,
    refreshPortfolio,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
