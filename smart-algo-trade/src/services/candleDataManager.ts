/**
 * Candle Data Manager Service
 * Handles historical and live candle data separately
 * Ensures proper data flow: Historical → Chart Load → Live Updates
 */

export interface Candle {
  time: number; // Unix timestamp in milliseconds
  date: string; // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandleUpdate {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isComplete: boolean; // true if candle is finalized, false if still forming
}

/**
 * Generate sample OHLC candles for demonstration
 * In production, this would come from your API
 */
export const generateSampleCandles = (count: number = 50): Candle[] => {
  const candles: Candle[] = [];
  let currentPrice = 25000;
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * fifteenMinutes;
    const date = new Date(time);

    // Generate realistic OHLC
    const open = currentPrice;
    const randomChange = (Math.random() - 0.5) * 200;
    const close = Math.max(20000, open + randomChange);
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    const volume = Math.floor(Math.random() * 1000000);

    candles.push({
      time,
      date: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return candles;
};

/**
 * Fetch historical candles from API
 * Ensures proper data format and validation
 */
export const fetchHistoricalCandles = async (
  symbol: string,
  timeframe: string = '15', // minutes
  count: number = 50
): Promise<Candle[]> => {
  try {
    // Try to fetch from your API
    const response = await fetch(
      `http://127.0.0.1:8001/api/portfolio/history?symbol=${symbol}&resolution=${timeframe}&count=${count}`
    );

    if (!response.ok) {
      console.warn('History API failed, using sample data');
      return generateSampleCandles(count);
    }

    const data = await response.json();
    const historyArray = Array.isArray(data) ? data : data?.data || [];

    // Transform and validate data
    return transformToCandles(historyArray).slice(0, count);
  } catch (error) {
    console.warn('Failed to fetch historical candles:', error);
    return generateSampleCandles(count);
  }
};

/**
 * Transform raw API data into Candle format
 */
const transformToCandles = (data: any[]): Candle[] => {
  return data.map((item: any) => {
    const timestamp = item.time || item.timestamp || Date.now();
    const time = typeof timestamp === 'string' 
      ? new Date(timestamp).getTime() 
      : timestamp * 1000; // Convert Unix seconds to milliseconds

    return {
      time,
      date: new Date(time).toISOString(),
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseFloat(item.volume) || 0
    };
  }).filter(c => c.open > 0 && c.close > 0); // Remove invalid candles
};

/**
 * Validate candle data integrity
 */
export const validateCandle = (candle: Candle): boolean => {
  return (
    candle.time > 0 &&
    candle.open > 0 &&
    candle.high >= candle.low &&
    candle.high >= candle.open &&
    candle.high >= candle.close &&
    candle.low <= candle.open &&
    candle.low <= candle.close &&
    candle.close > 0
  );
};

/**
 * Check if two candles have the same timestamp
 */
export const areCandlesSame = (c1: Candle, c2: Candle): boolean => {
  return c1.time === c2.time;
};

/**
 * Merge live candle update with historical data
 * Updates ONLY the last candle, prevents duplicates
 */
export const mergeCandles = (
  historicalCandles: Candle[],
  liveUpdate: CandleUpdate
): Candle[] => {
  if (historicalCandles.length === 0) {
    return [{
      time: liveUpdate.time,
      date: new Date(liveUpdate.time).toISOString(),
      open: liveUpdate.open,
      high: liveUpdate.high,
      low: liveUpdate.low,
      close: liveUpdate.close,
      volume: 0
    }];
  }

  const lastCandle = historicalCandles[historicalCandles.length - 1];

  // If live update is for the same candle, update it
  if (liveUpdate.time === lastCandle.time) {
    return [
      ...historicalCandles.slice(0, -1),
      {
        ...lastCandle,
        open: liveUpdate.open,
        high: liveUpdate.high,
        low: liveUpdate.low,
        close: liveUpdate.close
      }
    ];
  }

  // If live update is for a new candle, append it
  if (liveUpdate.time > lastCandle.time) {
    return [
      ...historicalCandles,
      {
        time: liveUpdate.time,
        date: new Date(liveUpdate.time).toISOString(),
        open: liveUpdate.open,
        high: liveUpdate.high,
        low: liveUpdate.low,
        close: liveUpdate.close,
        volume: 0
      }
    ];
  }

  // Ignore updates for old candles
  return historicalCandles;
};

/**
 * Convert candles to ApexCharts format
 */
export const candlesToApexFormat = (candles: Candle[]): any[] => {
  return candles.map(c => ({
    x: new Date(c.time).toISOString(),
    y: [c.open, c.high, c.low, c.close]
  }));
};

/**
 * Calculate candle statistics for display
 */
export const calculateCandleStats = (candles: Candle[]) => {
  if (candles.length === 0) {
    return {
      highest: 0,
      lowest: 0,
      avgClose: 0,
      avgVolume: 0,
      bullishCount: 0,
      bearishCount: 0
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);

  const bullishCount = candles.filter(c => c.close > c.open).length;
  const bearishCount = candles.filter(c => c.close < c.open).length;

  return {
    highest: Math.max(...highs),
    lowest: Math.min(...lows),
    avgClose: closes.reduce((a, b) => a + b, 0) / closes.length,
    avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
    bullishCount,
    bearishCount
  };
};

/**
 * Format candle data for display in tooltip
 */
export const formatCandleForDisplay = (candle: Candle): string => {
  const date = new Date(candle.time).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
  const changeColor = candle.close >= candle.open ? '🟢' : '🔴';

  return `
${date}
O: ₹${candle.open.toFixed(2)} | H: ₹${candle.high.toFixed(2)}
L: ₹${candle.low.toFixed(2)} | C: ₹${candle.close.toFixed(2)}
Change: ${changeColor} ${change}%
  `.trim();
};
