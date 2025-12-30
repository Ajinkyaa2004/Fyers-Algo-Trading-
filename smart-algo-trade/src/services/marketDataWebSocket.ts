/**
 * WebSocket Market Data Service
 * Real-time candlestick and price updates using WebSocket
 */

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  timestamp: number;
  volume?: number;
}

export interface CandleUpdate {
  symbol: string;
  timeframe: string;
  candle: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  };
  isNewCandle: boolean;
}

type MarketDataCallback = (data: MarketData) => void;
type CandleUpdateCallback = (data: CandleUpdate) => void;
type ConnectionCallback = (connected: boolean) => void;

/**
 * Market Data WebSocket Manager
 */
export class MarketDataWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscriptions: Set<string> = new Set();
  private callbacks: {
    marketData: Map<string, Set<MarketDataCallback>>;
    candleUpdate: Map<string, Set<CandleUpdateCallback>>;
    connection: Set<ConnectionCallback>;
  } = {
    marketData: new Map(),
    candleUpdate: new Map(),
    connection: new Set(),
  };

  constructor(url: string = 'ws://127.0.0.1:8001/ws/market-data') {
    this.url = url;
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to market data');
          this.reconnectAttempts = 0;
          this.notifyConnectionCallbacks(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          console.error('[WebSocket] Connection error:', event);
          this.notifyConnectionCallbacks(false);
          reject(event);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Connection closed');
          this.notifyConnectionCallbacks(false);
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to market data updates
   */
  subscribeMarketData(symbol: string, callback: MarketDataCallback): () => void {
    if (!this.callbacks.marketData.has(symbol)) {
      this.callbacks.marketData.set(symbol, new Set());
    }
    this.callbacks.marketData.get(symbol)!.add(callback);

    if (this.ws && !this.subscriptions.has(`quote:${symbol}`)) {
      this.send({ type: 'subscribe', channel: 'quote', symbol });
      this.subscriptions.add(`quote:${symbol}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.marketData.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.marketData.delete(symbol);
          if (this.ws) {
            this.send({ type: 'unsubscribe', channel: 'quote', symbol });
            this.subscriptions.delete(`quote:${symbol}`);
          }
        }
      }
    };
  }

  /**
   * Subscribe to candle updates
   */
  subscribeCandleUpdates(
    symbol: string,
    timeframe: string,
    callback: CandleUpdateCallback
  ): () => void {
    const key = `${symbol}:${timeframe}`;
    if (!this.callbacks.candleUpdate.has(key)) {
      this.callbacks.candleUpdate.set(key, new Set());
    }
    this.callbacks.candleUpdate.get(key)!.add(callback);

    if (this.ws && !this.subscriptions.has(`candle:${key}`)) {
      this.send({ type: 'subscribe', channel: 'candle', symbol, timeframe });
      this.subscriptions.add(`candle:${key}`);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.candleUpdate.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.candleUpdate.delete(key);
          if (this.ws) {
            this.send({ type: 'unsubscribe', channel: 'candle', symbol, timeframe });
            this.subscriptions.delete(`candle:${key}`);
          }
        }
      }
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.callbacks.connection.add(callback);
    return () => this.callbacks.connection.delete(callback);
  }

  /**
   * Send message to WebSocket
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'quote') {
        this.notifyMarketDataCallbacks(message.symbol, message.data);
      } else if (message.type === 'candle') {
        this.notifyCandleUpdateCallbacks(message);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Notify market data subscribers
   */
  private notifyMarketDataCallbacks(symbol: string, data: MarketData): void {
    const callbacks = this.callbacks.marketData.get(symbol);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in market data callback:', error);
        }
      });
    }
  }

  /**
   * Notify candle update subscribers
   */
  private notifyCandleUpdateCallbacks(data: CandleUpdate): void {
    const key = `${data.symbol}:${data.timeframe}`;
    const callbacks = this.callbacks.candleUpdate.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in candle update callback:', error);
        }
      });
    }
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionCallbacks(connected: boolean): void {
    this.callbacks.connection.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[WebSocket] Error in connection callback:', error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[WebSocket] Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Fallback: Mock Market Data Service for testing
 * Use when WebSocket is not available
 */
export class MockMarketDataService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: {
    marketData: Map<string, Set<MarketDataCallback>>;
    candleUpdate: Map<string, Set<CandleUpdateCallback>>;
    connection: Set<ConnectionCallback>;
  } = {
    marketData: new Map(),
    candleUpdate: new Map(),
    connection: new Set(),
  };

  constructor() {
    // Initialize
  }

  async connect(): Promise<void> {
    console.log('[MockService] Connected');
    this.callbacks.connection.forEach((cb) => cb(true));
  }

  disconnect(): void {
    console.log('[MockService] Disconnected');
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.callbacks.connection.forEach((cb) => cb(false));
  }

  subscribeMarketData(symbol: string, callback: MarketDataCallback): () => void {
    if (!this.callbacks.marketData.has(symbol)) {
      this.callbacks.marketData.set(symbol, new Set());

      // Simulate market data updates
      const interval = setInterval(() => {
        const basePrice = 500 + Math.random() * 100;
        const data: MarketData = {
          symbol,
          price: basePrice,
          bid: basePrice - 0.5,
          ask: basePrice + 0.5,
          timestamp: Date.now(),
          volume: Math.floor(Math.random() * 10000),
        };

        const callbacks = this.callbacks.marketData.get(symbol);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      }, 500);

      this.intervals.set(`quote:${symbol}`, interval);
    }

    const callbacks = this.callbacks.marketData.get(symbol)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        const interval = this.intervals.get(`quote:${symbol}`);
        if (interval) clearInterval(interval);
        this.intervals.delete(`quote:${symbol}`);
        this.callbacks.marketData.delete(symbol);
      }
    };
  }

  subscribeCandleUpdates(
    symbol: string,
    timeframe: string,
    callback: CandleUpdateCallback
  ): () => void {
    const key = `${symbol}:${timeframe}`;
    if (!this.callbacks.candleUpdate.has(key)) {
      this.callbacks.candleUpdate.set(key, new Set());

      // Simulate candle updates
      const interval = setInterval(() => {
        const time = Math.floor(Date.now() / 1000);
        const open = 500 + Math.random() * 100;
        const close = open + (Math.random() - 0.5) * 10;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;

        const data: CandleUpdate = {
          symbol,
          timeframe,
          candle: {
            time,
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 100000),
          },
          isNewCandle: Math.random() > 0.7,
        };

        const callbacks = this.callbacks.candleUpdate.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      }, 1000);

      this.intervals.set(`candle:${key}`, interval);
    }

    const callbacks = this.callbacks.candleUpdate.get(key)!;
    callbacks.add(callback);

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        const interval = this.intervals.get(`candle:${key}`);
        if (interval) clearInterval(interval);
        this.intervals.delete(`candle:${key}`);
        this.callbacks.candleUpdate.delete(key);
      }
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.callbacks.connection.add(callback);
    return () => this.callbacks.connection.delete(callback);
  }

  isConnected(): boolean {
    return true;
  }
}

// Create singleton instance
let instance: MarketDataWebSocket | MockMarketDataService | null = null;

export const getMarketDataService = (): MarketDataWebSocket | MockMarketDataService => {
  if (!instance) {
    try {
      instance = new MarketDataWebSocket();
    } catch {
      console.warn('WebSocket not available, using mock service');
      instance = new MockMarketDataService();
    }
  }
  return instance;
};
