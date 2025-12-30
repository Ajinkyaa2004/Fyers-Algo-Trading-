/**
 * Technical Indicators Calculator
 * Production-ready indicator calculations for trading charts
 */

export interface Candle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorValues {
  sma?: number;
  ema?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bbands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr?: number;
}

/**
 * Calculate Simple Moving Average
 */
export const calculateSMA = (candles: Candle[], period: number): (number | null)[] => {
  return candles.map((_, index) => {
    if (index < period - 1) return null;
    const sum = candles.slice(index - period + 1, index + 1).reduce((acc, c) => acc + c.close, 0);
    return sum / period;
  });
};

/**
 * Calculate Exponential Moving Average
 */
export const calculateEMA = (candles: Candle[], period: number): (number | null)[] => {
  const k = 2 / (period + 1);
  const ema: (number | null)[] = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      ema.push(null);
      sum += candles[i].close;
    } else if (i === period - 1) {
      sum += candles[i].close;
      const sma = sum / period;
      ema.push(sma);
    } else {
      const previousEMA = ema[i - 1] as number;
      const newEMA = candles[i].close * k + previousEMA * (1 - k);
      ema.push(newEMA);
    }
  }

  return ema;
};

/**
 * Calculate Relative Strength Index
 */
export const calculateRSI = (candles: Candle[], period: number = 14): (number | null)[] => {
  const rsi: (number | null)[] = [];
  const deltas: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    deltas.push(candles[i].close - candles[i - 1].close);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (deltas[i] > 0) {
      gains += deltas[i];
    } else {
      losses -= deltas[i];
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  for (let i = period; i < deltas.length + 1; i++) {
    const rs = avgGain / (avgLoss || 0.0001);
    rsi.push(100 - 100 / (1 + rs));

    const delta = deltas[i];
    avgGain = (avgGain * (period - 1) + (delta > 0 ? delta : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (delta < 0 ? -delta : 0)) / period;
  }

  return rsi;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export const calculateMACD = (
  candles: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) => {
  const ema12 = calculateEMA(candles, fastPeriod);
  const ema26 = calculateEMA(candles, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (ema12[i] === null || ema26[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push((ema12[i] as number) - (ema26[i] as number));
    }
  }

  const signalLine = calculateEMA(
    macdLine.map((v, i) => ({ ...candles[i], close: v as number })),
    signalPeriod
  );

  const histogram: (number | null)[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push((macdLine[i] as number) - (signalLine[i] as number));
    }
  }

  return { macdLine, signalLine, histogram };
};

/**
 * Calculate Bollinger Bands
 */
export const calculateBollingerBands = (
  candles: Candle[],
  period: number = 20,
  stdDev: number = 2
) => {
  const sma = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const avg = sma[i] as number;
      const variance =
        slice.reduce((sum, c) => sum + Math.pow(c.close - avg, 2), 0) / period;
      const standardDev = Math.sqrt(variance);

      middle.push(avg);
      upper.push(avg + stdDev * standardDev);
      lower.push(avg - stdDev * standardDev);
    }
  }

  return { upper, middle, lower };
};

/**
 * Calculate Average True Range
 */
export const calculateATR = (candles: Candle[], period: number = 14): (number | null)[] => {
  const atr: (number | null)[] = [];
  const trueRanges: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      trueRanges.push(tr);
    }
  }

  let sum = 0;
  for (let i = 0; i < period && i < trueRanges.length; i++) {
    sum += trueRanges[i];
  }

  let atrValue = sum / period;
  for (let i = 0; i < period && i < candles.length; i++) {
    atr.push(null);
  }

  atr.push(atrValue);

  for (let i = period + 1; i < trueRanges.length; i++) {
    atrValue = (atrValue * (period - 1) + trueRanges[i]) / period;
    atr.push(atrValue);
  }

  return atr;
};

/**
 * Get all indicators for a candle
 */
export const getIndicators = (
  candles: Candle[],
  index: number,
  indicators: {
    sma?: number;
    ema?: number;
    rsi?: boolean;
    macd?: boolean;
    bbands?: boolean;
    atr?: boolean;
  } = {}
): IndicatorValues => {
  const values: IndicatorValues = {};

  if (indicators.sma) {
    const smaValues = calculateSMA(candles, indicators.sma);
    values.sma = smaValues[index] || undefined;
  }

  if (indicators.ema) {
    const emaValues = calculateEMA(candles, indicators.ema);
    values.ema = emaValues[index] || undefined;
  }

  if (indicators.rsi) {
    const rsiValues = calculateRSI(candles, 14);
    values.rsi = rsiValues[index] || undefined;
  }

  if (indicators.macd) {
    const macdData = calculateMACD(candles);
    values.macd = {
      macd: macdData.macdLine[index] || 0,
      signal: macdData.signalLine[index] || 0,
      histogram: macdData.histogram[index] || 0,
    };
  }

  if (indicators.bbands) {
    const bbData = calculateBollingerBands(candles);
    values.bbands = {
      upper: bbData.upper[index] || 0,
      middle: bbData.middle[index] || 0,
      lower: bbData.lower[index] || 0,
    };
  }

  if (indicators.atr) {
    const atrValues = calculateATR(candles);
    values.atr = atrValues[index] || undefined;
  }

  return values;
};

/**
 * Helper: Get OHLC data with indicators
 */
export const getCandlesWithIndicators = (
  candles: Candle[],
  indicators: {
    sma?: number;
    ema?: number;
    rsi?: boolean;
    macd?: boolean;
    bbands?: boolean;
    atr?: boolean;
  } = {}
) => {
  return candles.map((candle, index) => ({
    ...candle,
    indicators: getIndicators(candles, index, indicators),
  }));
};
