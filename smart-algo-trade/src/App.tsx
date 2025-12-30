import { useState, useEffect } from 'react';
import { Sidebar, Header } from './layout/Layout';
import Dashboard from './components/Dashboard';
import Portfolio from './pages/Portfolio';
import UserProfile from './pages/UserProfile';
import Strategies from './pages/Strategies';
import LiveMarket from './pages/LiveMarket';
import MarketAnalysis from './pages/MarketAnalysis';
import MarketAnalysisApex from './pages/MarketAnalysisApex';
import ApiReference from './pages/ApiReference';
import Login from './pages/Login';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useAppContext } from './context/AppContext';
import { TradingModeProvider } from './context/TradingModeContext';
import { TradingModeSelector } from './components/TradingModeSelector';
import { showToast } from './utils/errorHandler';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import LiveCandlestickChart from './components/LiveCandlestickChart';
import LiveMarketDataView from './components/LiveMarketDataView';
import PaperTradingDashboard from './components/PaperTradingDashboard';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const { isAuthenticated, setAuthenticated, setUser, logout } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Check for login success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      // Wait a moment for session to be established, then check auth
      setTimeout(() => {
        checkAuth();
      }, 500);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8001/api/auth/status');
      
      if (!response.ok) {
        setAuthenticated(false);
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setAuthenticated(data.is_authenticated);
      
      if (data.is_authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      
      setAuthChecked(true);
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthenticated(false);
      setUser(null);
      setAuthChecked(true);
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (loading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-400">
        <div className="text-center">
          <div className="animate-spin mb-4 mx-auto w-8 h-8 border-4 border-zinc-800 border-t-violet-500 rounded-full"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onAuthSuccess={checkAuth} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'portfolio': return <Portfolio />;
      case 'profile': return <UserProfile />;
      case 'strategies': return <Strategies />;
      case 'live': return <LiveMarket />;
      case 'analysis': return <MarketAnalysisApex />;
      case 'analysis-old': return <MarketAnalysis />;
      case 'api': return <ApiReference />;
      case 'live-trading': return <LiveTradingDashboard />;
      case 'live-charts': return <LiveCandlestickChart />;
      case 'market-data': return <LiveMarketDataView />;
      case 'paper-trading': return <PaperTradingDashboard />;
      case 'settings': return <div className="p-8 text-zinc-500 text-center">API Settings Placeholder</div>;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans overflow-hidden flex-col">
      <Toaster position="top-right" richColors />
      
      {/* Trading Mode Selector - Visible when authenticated */}
      {isAuthenticated && authChecked && <TradingModeSelector />}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={logout} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header user={null} />
          <main className="flex-1 overflow-y-auto bg-black">
            <div className="w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <TradingModeProvider>
          <AppContent />
        </TradingModeProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
