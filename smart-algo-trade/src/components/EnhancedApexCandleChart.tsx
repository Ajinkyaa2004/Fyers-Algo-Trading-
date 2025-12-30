import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CandleData {
  x: string | number;
  y: [number, number, number, number]; // [open, high, low, close]
}

interface EnhancedApexCandleChartProps {
  data: CandleData[];
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
  showStats?: boolean;
  timeframe?: string;
}

interface CandleStats {
  highest: number;
  lowest: number;
  avgClose: number;
  bullishCount: number;
  bearishCount: number;
}

/**
 * Enhanced Candlestick Chart Component
 * Features:
 * - Proper scaling and spacing
 * - Statistics display
 * - Better tooltips
 * - Responsive design
 * - Professional styling
 */
export const EnhancedApexCandleChart: React.FC<EnhancedApexCandleChartProps> = ({
  data,
  symbol,
  height = 500,
  theme = 'dark',
  showStats = true,
  timeframe = '15min'
}) => {

  // Calculate statistics from candle data
  const stats: CandleStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        highest: 0,
        lowest: 0,
        avgClose: 0,
        bullishCount: 0,
        bearishCount: 0
      };
    }

    const closes = data.map(d => d.y[3]); // close prices
    const highs = data.map(d => d.y[1]); // highs
    const lows = data.map(d => d.y[2]); // lows
    const bullish = data.filter(d => d.y[3] > d.y[0]).length; // close > open
    const bearish = data.filter(d => d.y[3] < d.y[0]).length; // close < open

    return {
      highest: Math.max(...highs),
      lowest: Math.min(...lows),
      avgClose: closes.reduce((a, b) => a + b, 0) / closes.length,
      bullishCount: bullish,
      bearishCount: bearish
    };
  }, [data]);

  // Format data for ApexCharts
  const series = useMemo(() => {
    return [{
      data: data.map(d => ({
        x: d.x,
        y: d.y
      }))
    }];
  }, [data]);

  // ApexCharts configuration with better defaults
  const options = {
    chart: {
      type: 'candlestick' as const,
      toolbar: {
        show: true,
        tools: {
          download: 'png',
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'zoom' as const
      },
      background: theme === 'dark' ? '#0f172a' : '#ffffff',
      sparkline: {
        enabled: false
      },
      animations: {
        enabled: true,
        speed: 300,
        animateGradually: {
          enabled: true,
          delay: 50
        },
        dynamicAnimation: {
          enabled: true,
          speed: 150
        }
      }
    },
    title: {
      text: `${symbol} - ${timeframe}`,
      align: 'left' as const,
      style: {
        fontSize: '16px',
        fontWeight: 700,
        color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
      }
    },
    subtitle: {
      text: `${data.length} candles | High: ₹${stats.highest.toFixed(2)} | Low: ₹${stats.lowest.toFixed(2)}`,
      align: 'left' as const,
      style: {
        fontSize: '12px',
        color: theme === 'dark' ? '#94a3b8' : '#64748b'
      }
    },
    xaxis: {
      type: 'datetime' as const,
      axisBorder: {
        show: true,
        color: theme === 'dark' ? '#334155' : '#e2e8f0'
      },
      axisTicks: {
        show: true,
        color: theme === 'dark' ? '#334155' : '#e2e8f0'
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#cbd5e1' : '#475569',
          fontSize: '12px',
          fontFamily: 'Roboto'
        },
        formatter: (val: string) => {
          const date = new Date(val);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      },
      crosshairs: {
        show: true,
        width: 1,
        position: 'back' as const,
        stroke: {
          color: theme === 'dark' ? '#0ea5e9' : '#0284c7',
          width: 1,
          dashArray: 3
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      axisBorder: {
        show: true,
        color: theme === 'dark' ? '#334155' : '#e2e8f0'
      },
      axisTicks: {
        show: true,
        color: theme === 'dark' ? '#334155' : '#e2e8f0'
      },
      labels: {
        style: {
          colors: theme === 'dark' ? '#cbd5e1' : '#475569',
          fontSize: '12px'
        },
        formatter: (val: number) => `₹${val.toFixed(2)}`
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981', // Green for bullish
          downward: '#ef4444' // Red for bearish
        },
        wick: {
          useFillColor: true
        }
      }
    },
    grid: {
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    stroke: {
      width: 1,
      curve: 'smooth' as const
    },
    tooltip: {
      enabled: true,
      theme: theme === 'dark' ? 'dark' : 'light',
      style: {
        fontSize: '12px'
      },
      x: {
        format: 'dd MMM yyyy HH:mm',
        show: true
      },
      y: {
        formatter: (val: number) => `₹${val.toFixed(2)}`,
        title: {
          formatter: (seriesName: string) => seriesName
        }
      },
      marker: {
        show: true
      }
    },
    states: {
      normal: {
        filter: {
          type: 'none' as const
        }
      },
      hover: {
        filter: {
          type: 'lighten' as const,
          value: 0.15
        }
      },
      active: {
        filter: {
          type: 'darken' as const,
          value: 0.15
        }
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-slate-100 border-slate-300'
      }`}>
        <div className="text-center">
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            No candlestick data available
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            Please ensure the API is returning OHLC data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-lg overflow-hidden ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-white'
    }`}>
      {/* Chart Container */}
      <div className={`border ${
        theme === 'dark' 
          ? 'border-slate-700' 
          : 'border-slate-200'
      }`}>
        <Chart
          options={options}
          series={series}
          type="candlestick"
          height={height}
        />
      </div>

      {/* Statistics Footer */}
      {showStats && (
        <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border-t ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Highest
            </p>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
              ₹{stats.highest.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Lowest
            </p>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
              ₹{stats.lowest.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Avg Close
            </p>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              ₹{stats.avgClose.toFixed(2)}
            </p>
          </div>

          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Bullish
            </p>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp size={16} className="text-green-500" />
              <p className="text-lg font-bold text-green-500">
                {stats.bullishCount}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Bearish
            </p>
            <div className="flex items-center justify-center gap-1">
              <TrendingDown size={16} className="text-red-500" />
              <p className="text-lg font-bold text-red-500">
                {stats.bearishCount}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedApexCandleChart;
