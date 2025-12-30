import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Candle, calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/technicalIndicators';
import { getMarketDataService } from '../services/marketDataWebSocket';

interface AdvancedCandlestickChartProps {
  symbol: string;
  defaultTimeframe?: string;
  height?: number;
}

interface ChartCandle extends Candle {
  candleColor: string;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  rsi?: number;
  bbandUpper?: number;
  bbandMiddle?: number;
  bbandLower?: number;
  macdLine?: number;
  macdSignal?: number;
  macdHistogram?: number;
}

interface Indicators {
  sma20: boolean;
  sma50: boolean;
  ema12: boolean;
  rsi: boolean;
  bbands: boolean;
  macd: boolean;
}

/**
 * Advanced Real-time Candlestick Chart Component
 * Features: Live WebSocket data, historical candles, multiple timeframes,
 * technical indicators, zoom, crosshair, and production-ready code
 */
export const AdvancedCandlestickChart: React.FC<AdvancedCandlestickChartProps> = ({
  symbol = 'NSE:SBIN-EQ',
  defaultTimeframe = '1D',
  height = 600,
}) => {
  // State
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [displayCandles, setDisplayCandles] = useState<ChartCandle[]>([]);
  const [timeframe, setTimeframe] = useState<string>(defaultTimeframe);
  const [zoom, setZoom] = useState(100);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [crosshairData, setCrosshairData] = useState<{ x: number; y: number } | null>(null);
  const [indicators, setIndicators] = useState<Indicators>({
    sma20: true,
    sma50: false,
    ema12: false,
    rsi: false,
    bbands: false,
    macd: false,
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D', '1W', '1M'];

  /**
   * Load historical candle data
   */
  const loadHistoricalData = async (tf: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8001/api/portfolio/history?symbol=${symbol}&resolution=${tf}`);
      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data)) {
        const processedCandles = data.data.map((c: any) => enrichCandle(c));
        setCandles(processedCandles);
        updateDisplayCandles(processedCandles);
      } else {
        // Show error instead of using mock data
        console.warn('No data available from API');
        setCandles([]);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      // Show error instead of using mock data
      setCandles([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate mock candle data for demo - REMOVED, use real data only
   */
  const generateMockCandles = () => {
    console.warn('Mock data generation disabled. Please ensure real API data is available.');
    setCandles([]);
  };

  /**
   * Enrich candle with indicators
   */
  const enrichCandle = (candle: Candle): ChartCandle => {
    const candleColor = candle.close >= candle.open ? '#10b981' : '#ef4444';
    return {
      ...candle,
      candleColor,
    };
  };

  /**
   * Update display candles with indicators
   */
  const updateDisplayCandles = (allCandles: ChartCandle[]) => {
    let displayData = [...allCandles];

    // Apply zoom
    const itemsToShow = Math.max(20, Math.floor((100 / zoom) * 20));
    displayData = displayData.slice(-itemsToShow);

    // Calculate indicators
    if (indicators.sma20 || indicators.sma50 || indicators.ema12 || indicators.rsi || indicators.bbands || indicators.macd) {
      const sma20 = calculateSMA(displayData, 20);
      const sma50 = calculateSMA(displayData, 50);
      const ema12 = calculateEMA(displayData, 12);
      const rsiValues = calculateRSI(displayData, 14);
      const bbands = calculateBollingerBands(displayData, 20);
      const macData = calculateMACD(displayData);

      displayData = displayData.map((c, i) => ({
        ...c,
        sma20: sma20[i] || undefined,
        sma50: sma50[i] || undefined,
        ema12: ema12[i] || undefined,
        rsi: rsiValues[i] || undefined,
        bbandUpper: bbands.upper[i] || undefined,
        bbandMiddle: bbands.middle[i] || undefined,
        bbandLower: bbands.lower[i] || undefined,
        macdLine: macData.macdLine[i] || undefined,
        macdSignal: macData.signalLine[i] || undefined,
        macdHistogram: macData.histogram[i] || undefined,
      }));
    }

    setDisplayCandles(displayData);
  };

  /**
   * Handle timeframe change
   */
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    loadHistoricalData(newTimeframe);
  };

  /**
   * Handle zoom
   */
  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? Math.min(zoom + 20, 200) : Math.max(zoom - 20, 20);
    setZoom(newZoom);
    updateDisplayCandles(candles);
  };

  /**
   * Handle crosshair
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showCrosshair || !chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    setCrosshairData({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  /**
   * Toggle indicator
   */
  const toggleIndicator = (indicator: keyof Indicators) => {
    setIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  /**
   * Custom tooltip for price information
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload as ChartCandle;
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded p-3 text-sm">
        <p className="text-zinc-300">
          Time: {new Date(data.time).toLocaleTimeString()}
        </p>
        <p className="text-blue-400">O: ₹{data.open.toFixed(2)}</p>
        <p className="text-green-400">H: ₹{data.high.toFixed(2)}</p>
        <p className="text-red-400">L: ₹{data.low.toFixed(2)}</p>
        <p className={data.close >= data.open ? 'text-emerald-400' : 'text-red-400'}>
          C: ₹{data.close.toFixed(2)}
        </p>
        {data.volume && <p className="text-zinc-400">Vol: {(data.volume / 1000).toFixed(0)}K</p>}
      </div>
    );
  };

  // Effects
  useEffect(() => {
    loadHistoricalData(timeframe);
  }, [symbol]);

  useEffect(() => {
    updateDisplayCandles(candles);
  }, [indicators, zoom]);

  // WebSocket connection (optional - only if service is available)
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        const service = getMarketDataService();
        
        // Try to connect
        try {
          await service.connect();
          setConnected(true);

          // Subscribe to candle updates
          unsubscribeRef.current = service.subscribeCandleUpdates(symbol, timeframe, (update) => {
            setCandles((prev) => {
              const updated = [...prev];
              const lastCandle = updated[updated.length - 1];

              if (lastCandle && update.isNewCandle) {
                updated.push(enrichCandle(update.candle));
              } else if (lastCandle) {
                updated[updated.length - 1] = enrichCandle({
                  ...lastCandle,
                  ...update.candle,
                });
              }

              updateDisplayCandles(updated);
              return updated;
            });
          });
        } catch (error) {
          console.warn('WebSocket connection failed, using mock service:', error);
          setConnected(false);
        }
      } catch (error) {
        console.warn('Market data service error:', error);
      }
    };

    setupWebSocket();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [symbol, timeframe]);

  return (
    <div className="w-full h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 space-y-3">
        {/* Title and Status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{symbol}</h2>
            <p className="text-xs text-zinc-400">
              {connected ? '🟢 Live' : '⚪ Historical'} • {displayCandles.length} candles
            </p>
          </div>
          <div className="flex items-center gap-2">
            {displayCandles.length > 0 && (
              <>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ₹{displayCandles[displayCandles.length - 1].close.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                      displayCandles[displayCandles.length - 1].close >=
                      displayCandles[displayCandles.length - 1].open
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {displayCandles[displayCandles.length - 1].close >=
                    displayCandles[displayCandles.length - 1].open ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(
                      displayCandles[displayCandles.length - 1].close -
                        displayCandles[displayCandles.length - 1].open
                    ).toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Timeframe Selector */}
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom('out')}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs bg-zinc-800 px-3 py-1 rounded">{zoom}%</span>
            <button
              onClick={() => handleZoom('in')}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Crosshair */}
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-1 rounded transition-colors ${
              showCrosshair ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            title="Toggle Crosshair"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors ${
              showSettings ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            title="Indicators Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              setZoom(100);
              setShowCrosshair(false);
              handleTimeframeChange(timeframe);
            }}
            className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            title="Reset Chart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Indicator Settings */}
        {showSettings && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.keys(indicators).map((indicator) => (
              <button
                key={indicator}
                onClick={() => toggleIndicator(indicator as keyof Indicators)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  indicators[indicator as keyof Indicators]
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {indicators[indicator as keyof Indicators] ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {indicator.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div
        ref={chartRef}
        className="flex-1 overflow-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowCrosshair(false)}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <p>Loading chart data...</p>
          </div>
        ) : displayCandles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <p>No candle data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayCandles} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey={(d: ChartCandle) => new Date(d.time).toLocaleTimeString()}
                stroke="#888"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#888" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Candlesticks as Bar chart */}
              <Bar
                dataKey="close"
                fill="#fff"
                isAnimationActive={false}
                shape={<CandleShape />}
              />

              {/* Moving Averages */}
              {indicators.sma20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#f59e0b"
                  dot={false}
                  strokeWidth={1}
                  name="SMA 20"
                  isAnimationActive={false}
                />
              )}
              {indicators.sma50 && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={1}
                  name="SMA 50"
                  isAnimationActive={false}
                />
              )}
              {indicators.ema12 && (
                <Line
                  type="monotone"
                  dataKey="ema12"
                  stroke="#ec4899"
                  dot={false}
                  strokeWidth={1}
                  name="EMA 12"
                  isAnimationActive={false}
                />
              )}

              {/* Bollinger Bands */}
              {indicators.bbands && (
                <>
                  <Line
                    type="monotone"
                    dataKey="bbandUpper"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="BB Upper"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbandMiddle"
                    stroke="#6b7280"
                    dot={false}
                    strokeWidth={1}
                    name="BB Middle"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbandLower"
                    stroke="#ef4444"
                    dot={false}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="BB Lower"
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Crosshair */}
              {showCrosshair && crosshairData && (
                <>
                  <ReferenceLine x={crosshairData.x} stroke="#888" strokeDasharray="5 5" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

/**
 * Custom Candlestick Shape Component
 */
const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;

  if (!payload || !payload.open || !payload.close) return null;

  const candleColor = payload.close >= payload.open ? '#10b981' : '#ef4444';
  const yAxis = props.yAxis || { scale: { domain: [0, 1000] } };

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={candleColor}
        strokeWidth={1}
      />
      <rect
        x={x + width * 0.2}
        y={payload.close >= payload.open ? y : y + (height * (1 - (payload.close - payload.open) / (payload.high - payload.low)))}
        width={width * 0.6}
        height={Math.max(2, Math.abs((height * (payload.close - payload.open)) / (payload.high - payload.low)))}
        fill={candleColor}
        stroke={candleColor}
        strokeWidth={1}
      />
    </g>
  );
};
