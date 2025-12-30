// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    STATUS: `${API_BASE_URL}/api/auth/status`,
    PROCESS_CODE: `${API_BASE_URL}/api/auth/process-code`,
  },
  // Portfolio
  PORTFOLIO: {
    PROFILE: `${API_BASE_URL}/api/portfolio/profile`,
    MARGINS: `${API_BASE_URL}/api/portfolio/margins`,
    HOLDINGS: `${API_BASE_URL}/api/portfolio/holdings`,
    POSITIONS: `${API_BASE_URL}/api/portfolio/positions`,
    ORDERS: `${API_BASE_URL}/api/portfolio/orders`,
  },
  // Market
  MARKET: {
    QUOTE: (symbols: string) => `${API_BASE_URL}/api/market/quote?symbols=${encodeURIComponent(symbols)}`,
  },
  // Live Data
  LIVE: {
    STATUS: `${API_BASE_URL}/api/live/status`,
    CANDLES: (symbol: string, interval: string, count: number) => 
      `${API_BASE_URL}/api/live/candles/${symbol}?interval=${interval}&count=${count}`,
    CURRENT_CANDLE: (symbol: string, interval: string) => 
      `${API_BASE_URL}/api/live/candle/current/${symbol}?interval=${interval}`,
    START: `${API_BASE_URL}/api/live/start`,
    STOP: `${API_BASE_URL}/api/live/stop`,
  },
  // Paper Trading
  PAPER_TRADING: {
    PORTFOLIO: `${API_BASE_URL}/api/paper-trading/portfolio`,
    TRADES: (limit: number = 10) => `${API_BASE_URL}/api/paper-trading/trades?limit=${limit}`,
    HISTORY: `${API_BASE_URL}/api/paper-trading/history`,
    STATS: `${API_BASE_URL}/api/paper-trading/stats`,
    RESET: `${API_BASE_URL}/api/paper-trading/reset`,
    PLACE_ORDER: `${API_BASE_URL}/api/paper-trading/place-order`,
  },
  // Root
  ROOT: API_BASE_URL,
} as const;

export default API_ENDPOINTS;
